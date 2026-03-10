import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';
const CHASE_CELL = '+18503414324';

const SYSTEM_PROMPT = `You are an AI calling on Chase's behalf from VinHunter — VinLedger AI Live. Friendly, confident, straight-talking. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown.

CRITICAL: You are an AI. NEVER claim to be human. Always identify as: "AI calling on Chase's behalf from VinHunter."

── PRODUCT 1: VINHUNTER (VinLedger AI Live) ──
Free CARFAX alternative. Checks active NHTSA investigations, cross-model complaint patterns, AI fraud detection, theft databases CARFAX doesn't access. Google-indexed Trust Score page for every VIN on a dealer's lot overnight. Full shop CRM.
PRICING:
- Free: NHTSA decodes, recalls, trust score
- Pro Consumer: four ninety-nine a month
- Dealer Verified: twenty-nine a month — badge, 10 branded reports, QR stickers
- Dealer Reports: forty-nine a month — unlimited reports, profit tracking
- Dealer Marketing: ninety-nine a month — SEO pages every VIN, lead capture (PITCH THIS to dealerships)
- Dealer Pro: two forty-nine plus four ninety-nine setup — full CRM replacing Tekmetric

── PRODUCT 2: ECONOCLAW ──
21 specialized AI agents deployed to any business. Five hundred setup plus ninety-nine a month launch pricing. Agencies charge five thousand plus fifteen hundred a month for the same.

── PRODUCT 3: WHITEGLOVECLAW ──
Full white-glove AI infrastructure. VPS twenty-four hundred. Mac Mini four thousand. In-person forty-eight hundred. 20% below market leader.

── PRODUCT 4: RENTACLAW ──
Rent AI agents. Nine dollars a day, forty-nine a week, a hundred forty-nine a month. Revenue share and IOU accepted.

── PRODUCT 5: BUDGETCLAW ──
21 agents on budget plans. One ninety-nine to four ninety-nine a month. Replaces Zapier, HubSpot, ChatGPT, VA costs.

── PRODUCT 6: CLAWAWAY ──
Fully flexible. Build anything, pay anything, pay card, Zelle, crypto, rev share, barter, equity.

── PRODUCT 7: TRANSBID LIVE ──
Public contract exchange. Zero upfront — zero-point-five percent only when you win. Veterans pay zero percent forever.

── ROUTING RULES ──
- Dealer/auto (sales only) → VinHunter Dealer Marketing $99
- Dealer/auto with service dept → VinHunter Dealer Pro $249
- Any business wanting AI → EconoClaw $99/mo
- Executive/funded → WhiteGloveClaw
- Tight budget → RentAClaw $49/week
- CFO/numbers-focused → BudgetClaw
- Contractor/home services → TransBid first
- Unsure → ClawAway

── OBJECTION HANDLERS ──
- "We already have CARFAX" → "CARFAX gives you reports. VinHunter gives you reports plus Google pages for every VIN, plus things CARFAX structurally cannot check."
- "We use Tekmetric" → "We replace Tekmetric. Full shop CRM, two forty-nine a month. Most shops pay four hundred plus for Tekmetric alone."
- "Too expensive" → "We have a free tier and plans starting at twenty-nine a month."
- "Not interested" → "Totally fair. Can I just text you a two-minute breakdown? No commitment."
- "Who is this?" → "This is an AI calling on Chase's behalf from VinHunter. Quick question before I let you go..."
- "Is this a robot?" → "Yes, I'm an AI calling on Chase's behalf. Want me to have Chase call you directly?"

When they want to speak to a real person respond with only: ESCALATE
When they agree to receive a link respond with only: SEND_LINK
When they firmly want to end the call respond with only: HANGUP`;

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function buildGather(sayText, history, to) {
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const url = `${BASE}/api/twilio?action=ai-respond&to=${encodeURIComponent(to)}&history=${historyParam}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${url}" method="POST" speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="8">
    <Say voice="Polly.Matthew-Neural">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="Polly.Matthew-Neural">I didn't catch that. Have a great day.</Say>
  <Hangup/>
</Response>`;
}

async function saveCallRecord(data) {
  try {
    await fetch(`${BASE}/api/recordings?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error('Failed to save call record:', e.message);
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── AI TWIML: Opening line ────────────────────────────────────────────────
  if (action === 'ai-twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    return res.status(200).send(buildGather(
      "Hey, is this the owner? This call may be recorded. This is an AI calling on Chase's behalf from VinHunter — quick question for you.",
      [], to
    ));
  }

  // ── AI RESPOND: Claude generates reply ───────────────────────────────────
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || '';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}

    if (!speech) {
      return res.status(200).send(buildGather(
        "Sorry, I didn't catch that. Are you the owner?",
        history, to
      ));
    }

    history.push({ role: 'user', content: speech });

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: SYSTEM_PROMPT,
        messages: history,
      });

      const reply = response.content[0].text.trim();
      history.push({ role: 'assistant', content: reply });

      // ESCALATE — text Chase, then read a message and hangup
      if (reply.includes('ESCALATE')) {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            to: CHASE_CELL, from: FROM,
            body: `🚨 ESCALATE: Prospect at ${to} wants to speak with you directly. Call them back ASAP.`
          });
        } catch(e) { console.error('Escalate SMS error:', e.message); }
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Perfect — I'm connecting you with Chase directly. He'll reach out to you very shortly. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      // SEND_LINK — SMS the prospect and hang up
      if (reply.includes('SEND_LINK')) {
        if (to) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
              to, from: FROM,
              body: `Chase @ VinHunter: Here's your free lot audit — see what buyers find when they Google your VINs: https://vinledgerai.live/pricing Founding rate locks forever. Reply STOP to opt out.`
            });
          } catch(e) { console.error('SMS error:', e.message); }
        }
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Perfect, sending that to you right now. Talk soon.</Say>
  <Hangup/>
</Response>`);
      }

      // HANGUP
      if (reply.includes('HANGUP')) {
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">No problem at all. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      return res.status(200).send(buildGather(reply, history, to));

    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sorry about that. Have a great day.</Say>
  <Hangup/>
</Response>`);
    }
  }

  // ── TWIML: MP3 pitch flow ─────────────────────────────────────────────────
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${BASE}/api/twilio?action=gather" method="POST" timeout="8">
    <Play>${PITCH_URL}</Play>
  </Gather>
  <Say voice="Polly.Matthew-Neural">No problem. Have a great day.</Say>
  <Hangup/>
</Response>`);
  }

  // ── GATHER: Press 1 → SMS ─────────────────────────────────────────────────
  if (action === 'gather') {
    const digit = req.body?.Digits;
    const customerPhone = req.body?.To || req.body?.Called || req.body?.From;
    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          to: customerPhone, from: FROM,
          body: `Chase @ VinHunter: Free audit shows what buyers find when they Google your VINs. All plans: https://vinledgerai.live/pricing Reply STOP to opt out.`
        });
      } catch(err) { console.error('Gather SMS error:', err.message); }
    }
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">${digit === '1' ? 'Perfect. Check your texts in a moment. Talk soon.' : 'No problem. Have a great day.'}</Say>
  <Hangup/>
</Response>`);
  }

  // ── AMD: Voicemail drop ───────────────────────────────────────────────────
  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    if (['machine_end_beep','machine_end_silence','machine_end_other'].includes(AnsweredBy)) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${PITCH_URL}</Play><Hangup/></Response>`
        });
      } catch(err) { console.error('Voicemail drop error:', err.message); }
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio call status webhook ───────────────────────────────────
  if (action === 'status') {
    const { CallSid, CallStatus, CallDuration, To } = req.body || {};
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const contactEmail = req.query.contactEmail ? decodeURIComponent(req.query.contactEmail) : '';
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';

    const terminal = ['completed','failed','busy','no-answer'];
    if (terminal.includes(CallStatus)) {
      const dur = parseInt(CallDuration || 0);
      const outcome = CallStatus === 'completed' && dur >= 15 ? 'answered' : 'voicemail';
      await saveCallRecord({ callSid: CallSid, contactName, contactPhone: To, contactEmail, contactId, script, outcome, duration: CallDuration, notes: '' });
    }
    return res.status(200).end();
  }

  // ── CALLSTATUS: check a call SID ─────────────────────────────────────────
  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── INBOX: inbound SMS ────────────────────────────────────────────────────
  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const messages = await client.messages.list({ to: FROM, limit: 50 });
      return res.status(200).json({
        messages: messages.map(m => ({ sid: m.sid, from: m.from, body: m.body, dateSent: m.dateSent, status: m.status }))
      });
    } catch(err) { return res.status(500).json({ error: err.message, messages: [] }); }
  }

  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // ── CALL: initiate outbound call ──────────────────────────────────────────
  if (action === 'call') {
    const { to, contactName, contactEmail, contactId, aiMode, script } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const nameParam = encodeURIComponent(contactName || '');
      const emailParam = encodeURIComponent(contactEmail || '');
      const idParam = encodeURIComponent(contactId || '');
      const scriptParam = encodeURIComponent(script || '');
      const call = await client.calls.create({
        to,
        from: FROM,
        url: aiMode
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}`
          : `${BASE}/api/twilio?action=twiml`,
        record: true,
        recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
        recordingStatusCallbackMethod: 'POST',
        recordingChannels: 'mono',
        statusCallback: `${BASE}/api/twilio?action=status&contactName=${nameParam}&contactEmail=${emailParam}&contactId=${idParam}&script=${scriptParam}`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed','failed','busy','no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactName=${nameParam}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── SMS: send outbound SMS ────────────────────────────────────────────────
  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({ to, from: FROM, body: smsBody });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── HANGUP: end a live call ───────────────────────────────────────────────
  if (action === 'hangup') {
    const { callSid } = body;
    if (!callSid) return res.status(400).json({ error: 'Missing callSid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.calls(callSid).update({ status: 'completed' });
      return res.status(200).json({ success: true });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
