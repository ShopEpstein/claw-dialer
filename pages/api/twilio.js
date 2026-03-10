import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

const SYSTEM_PROMPT = `You are an AI calling on Chase's behalf. Friendly, confident, direct — like Chase himself. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown. Contractions always. Short punchy sentences.

CRITICAL IDENTITY RULE: You are an AI assistant, not a human. If anyone asks "are you a human?", "is this a real person?", "am I talking to a bot?" — be honest: say something like "I'm an AI calling on Chase's behalf — want me to have him follow up personally?" Never claim to be human. Never say you're sure you're human. Honesty here is non-negotiable.

IMPORTANT: Always say "VinLedger AI Live" or "VinHunter" when discussing the VIN product — NEVER just "VinLedger" (that is a different company).

── PRODUCT 1: VINHUNTER (VinLedger AI Live) ──
Free CARFAX alternative that checks things CARFAX structurally cannot — active NHTSA investigations, cross-model complaint patterns, AI fraud detection, theft databases CARFAX doesn't access. Also builds Google-indexed Trust Score pages for every VIN on a dealer's lot overnight, plus a full shop CRM.
PRICING:
- Free: NHTSA decodes, recalls, trust score
- Pro Consumer: four ninety-nine a month — full title history (CARFAX charges forty-five per report)
- Dealer Verified: twenty-nine a month — badge, 10 branded reports, QR stickers
- Dealer Reports: forty-nine a month — unlimited reports, profit tracking
- Dealer Marketing: ninety-nine a month — SEO pages every VIN, lead capture, custom landing page built free (PITCH THIS to pure dealerships)
- Dealer Pro: two forty-nine plus four ninety-nine setup — full CRM replacing Tekmetric (PITCH THIS to repair shops and dealers with service dept)
- Founding Partner rate locks forever at whatever tier they sign up at

── PRODUCT 2: ECONOCLAW ──
21 specialized AI agents deployed to any business: customer service, content, research, outreach, analytics — working 24/7.
PRICING: Five hundred setup plus ninety-nine a month (launch pricing). Agencies charge five thousand setup and fifteen hundred a month for the same thing.

── PRODUCT 3: WHITEGLOVECLAW ──
Full white-glove AI infrastructure deployment. Identical to SetupClaw (market leader) at 20% less.
PRICING: Hosted VPS twenty-four hundred. Mac Mini remote four thousand. In-person forty-eight hundred. Additional agents twelve hundred each.

── PRODUCT 4: RENTACLAW ──
Rent AI agents instead of committing. Nine dollars a day, forty-nine a week, a hundred forty-nine a month, nine ninety-nine a year. Also accepts IOU and revenue share.

── PRODUCT 5: BUDGETCLAW ──
Same 21 agents on budget plans. Micro one ninety-nine, Standard two ninety-nine, Pro four ninety-nine a month. No setup fee on annual. Replaces Zapier, HubSpot, ChatGPT, VA costs.

── PRODUCT 6: CLAWAWAY ──
Fully flexible. Build anything, pay anything, pay however — card, Zelle, crypto, rev share, barter, equity. No rigid packages.

── PRODUCT 7: TRANSBID LIVE ──
Public contract exchange for contractors. Zero upfront — zero-point-five percent only when you win a job. HomeAdvisor charges fifteen to thirty percent hidden through inflated quotes. Veterans pay zero percent forever.

── READ THE PROSPECT — ROUTE TO RIGHT PRODUCT ──
- Dealer/auto business (sales only) → VinHunter Dealer Marketing at ninety-nine
- Dealer/auto with service dept → VinHunter Dealer Pro at two forty-nine
- Any business wanting AI automation → EconoClaw at ninety-nine a month
- Executive team, funded company → WhiteGloveClaw
- Tight budget, wants to try → RentAClaw forty-nine a week
- CFO type, wants to see numbers → BUDGETclaw
- "Tell me what you need" / unsure → ClawAway
- Contractor / home services → TransBid Live

── CROSS-SELL RULES ──
- VinHunter dealer says yes → mention EconoClaw for their leads and reviews
- EconoClaw interest from auto dealer → mention VinHunter for their inventory pages
- Contractor → TransBid first, EconoClaw second
- RentAClaw interest → upsell to EconoClaw after trial, rental payments count toward setup fee
- BUDGETclaw → upsell to EconoClaw launch pricing before window closes

── OBJECTION HANDLERS ──
- "We already have CARFAX" → "CARFAX gives you reports. VinHunter gives you reports plus Google pages for every VIN, plus things CARFAX structurally cannot check."
- "We use Tekmetric" → "We replace Tekmetric. Full shop CRM, two forty-nine a month. Most shops pay four hundred plus for Tekmetric alone."
- "Too expensive" → "We have a free tier and plans starting at twenty-nine a month. What does your lot look like?"
- "Not interested" → "Totally fair. Can I just text you a two-minute breakdown? No commitment."
- "Already have AI tools" → "What are you paying for them? We probably replace all of them for less than you're paying for one."
- "Who is this?" → "I'm an AI calling on Chase's behalf — we build AI systems and free Trust Score pages for dealers. Quick question before I let you go..."
- "Are you a robot?" / "Are you human?" / "Is this AI?" → "Yeah, I'm an AI calling on Chase's behalf — he had me reach out first. Want me to have him follow up personally?"
- "Call back later" → "Of course. Can I text you the link in the meantime?"

When they agree to receive a link respond with only: SEND_LINK
When they firmly want to end the call respond with only: HANGUP
When they want to speak with a real human / Chase personally respond with only: ESCALATE`;

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function buildGather(sayText, history, to, script) {
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const scriptParam = encodeURIComponent(script || '');
  const url = `${BASE}/api/twilio?action=ai-respond&amp;to=${encodeURIComponent(to)}&amp;history=${historyParam}&amp;script=${scriptParam}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${url}" method="POST" speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="8">
    <Say voice="Polly.Matthew-Neural">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="Polly.Matthew-Neural">I didn't catch that. No problem, have a great day.</Say>
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

  // ── AI TWIML: Opening line (includes TCPA recording disclosure) ───────────
  if (action === 'ai-twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';

    const openers = {
      'ECONOCLAW': "Hey — is this the owner? Quick thing, this call may be recorded. I'm an AI reaching out on Chase's behalf from EconoClaw — quick question for you.",
      'WHITEGLOVECLAW': "Good day — is this the decision maker? This call may be recorded. I'm an AI calling on Chase's behalf from WhiteGloveClaw — one quick question.",
      'RENTACLAW': "Hey — is this the owner? This call may be recorded. I'm an AI reaching out on Chase's behalf about RentAClaw — quick question for you.",
      'BUDGETCLAW': "Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf from BUDGETclaw — quick one for you.",
      'TRANSBID': "Hey — is this a contractor or do you hire contractors? This call may be recorded. I'm an AI reaching out on Chase's behalf about TransBid — quick question.",
      'CLAWAWAY': "Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf — quick question for you.",
    };

    const opener = openers[script] || "Hey, is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf from VinHunter — VinLedger AI Live — quick question for you.";

    return res.status(200).send(buildGather(opener, [], to, script));
  }

  // ── AI RESPOND: Claude generates next line ────────────────────────────────
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}

    if (speech) history.push({ role: 'user', content: speech });

    if (!speech) {
      return res.status(200).send(buildGather(
        "Sorry, I didn't catch that. Are you the owner?",
        history, to, script
      ));
    }

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

      if (reply.includes('ESCALATE')) {
        if (to) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
              to: '+18503414324', from: FROM,
              body: `ESCALATE: ${to} wants to speak with you directly. Call them back.`
            });
            await client.messages.create({
              to, from: FROM,
              body: `Chase here — just got a heads up you wanted to talk. I'll call you back shortly. — Chase (850) 341-4324`
            });
          } catch(e) { console.error('Escalate SMS error:', e.message); }
        }
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Got it — I'm texting Chase right now to have him call you back personally. Talk soon.</Say>
  <Hangup/>
</Response>`);
      }

      if (reply.includes('SEND_LINK')) {
        if (to) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const SMS_MAP = {
              'ECONOCLAW': `Chase here: 21 AI agents, your biz, 24/7. $500 setup + $99/mo — agencies charge $5K+ for the same. econoclaw.vercel.app Reply STOP to opt out.`,
              'WHITEGLOVECLAW': `Chase here: White-glove AI setup. SetupClaw scope at 20% less. VPS $2,400 · Mac Mini $4K · In-person $4,800. Same-day go-live. Reply STOP to opt out.`,
              'RENTACLAW': `Chase here: Try 21 AI agents for $49/week. Doesn't pay for itself, I'll personally refund you. econoclaw.vercel.app/rent Reply STOP to opt out.`,
              'BUDGETCLAW': `Chase here: Year 1 your way = $6,188+. Year 1 BUDGETclaw = $2,687. 21 agents from $199/mo. Reply STOP to opt out.`,
              'TRANSBID': `Chase here: TransBid — post projects free, pay 0.5% only when you WIN. HomeAdvisor charges 15-30% hidden. transbid.live Reply STOP to opt out.`,
              'CLAWAWAY': `Chase here: We build AI systems. Flexible on what, flexible on payment — card, crypto, rev share, barter. econoclaw.vercel.app Reply STOP to opt out.`,
            };
            const smsBody = SMS_MAP[script] || `Chase @ VinHunter: Here's your free lot audit — see what buyers find when they Google your VINs: https://vinledgerai.live/pricing Founding rate locks forever. Reply STOP to opt out.`;
            await client.messages.create({ to, from: FROM, body: smsBody });
          } catch(e) { console.error('SMS error:', e.message); }
        }
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Perfect, sending that to you now. Talk soon.</Say>
  <Hangup/>
</Response>`);
      }

      if (reply.includes('HANGUP')) {
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">No problem at all. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      return res.status(200).send(buildGather(reply, history, to, script));

    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sorry about that. Have a great day.</Say>
  <Hangup/>
</Response>`);
    }
  }

  // ── TWIML: Original MP3 flow ──────────────────────────────────────────────
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${PITCH_URL}</Play>
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
          body: `Chase @ VinHunter: Free audit shows what buyers find when they Google your VINs. See all plans (free to $249/mo): https://vinledgerai.live/pricing Reply STOP to opt out.`
        });
      } catch(err) { console.error('SMS error:', err.message); }
    }
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">${digit === '1' ? 'Perfect. Check your texts in just a moment. Talk soon.' : 'No problem. Have a great day.'}</Say>
  <Hangup/>
</Response>`);
  }

  // ── AMD: Voicemail drop ───────────────────────────────────────────────────
  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    if (AnsweredBy === 'machine_end_beep' || AnsweredBy === 'machine_end_silence' || AnsweredBy === 'machine_end_other') {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${PITCH_URL}</Play><Hangup/></Response>`
        });
      } catch(err) { console.error('Voicemail drop error:', err.message); }
    }
    return res.status(200).end();
  }

  // ── STATUS: fired by Twilio on call events ────────────────────────────────
  if (action === 'status') {
    const { CallSid, CallStatus, CallDuration, To } = req.body || {};
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const contactEmail = req.query.contactEmail ? decodeURIComponent(req.query.contactEmail) : '';
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';

    console.log(`Call ${CallSid} → ${CallStatus} (${CallDuration}s)`);

    const terminal = ['completed','failed','busy','no-answer'];
    if (terminal.includes(CallStatus)) {
      const dur = parseInt(CallDuration || 0);
      const outcome = CallStatus === 'completed' && dur >= 15 ? 'answered' : 'voicemail';
      await saveCallRecord({
        callSid: CallSid,
        contactName,
        contactPhone: To,
        contactEmail,
        contactId,
        script,
        outcome,
        duration: CallDuration,
        notes: '',
      });
    }

    return res.status(200).end();
  }

  // ── CALLSTATUS ────────────────────────────────────────────────────────────
  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── INBOX ─────────────────────────────────────────────────────────────────
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

  // ── CALL ──────────────────────────────────────────────────────────────────
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
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}&script=${encodeURIComponent(script || '')}`
          : `${BASE}/api/twilio?action=twiml`,
        record: true,
        recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
        recordingStatusCallbackMethod: 'POST',
        recordingChannels: 'mono',
        statusCallback: `${BASE}/api/twilio?action=status&contactName=${nameParam}&contactEmail=${emailParam}&contactId=${idParam}&script=${scriptParam}`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactName=${nameParam}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── SMS ───────────────────────────────────────────────────────────────────
  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({ to, from: FROM, body: smsBody });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
