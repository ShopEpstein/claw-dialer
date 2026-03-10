import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

const SYSTEM_PROMPT = `You are Chase, calling from VinLedger AI Live — also known as VinHunter. Friendly, confident, straight-talking. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown.

IMPORTANT: Always say "VinLedger AI Live" or "VinHunter" — NEVER just "VinLedger" (that is a different company).

WHO WE ARE: VinLedger AI Live is a free CARFAX alternative that checks things CARFAX structurally cannot — active NHTSA investigations, cross-model complaint patterns, AI fraud detection, and theft databases CARFAX doesn't access. We also build Google-indexed pages for every VIN on a dealer's lot and give dealers a full AI-powered CRM.

PRICING — know all of these:
- Free Consumer: zero dollars. Unlimited NHTSA decodes, recalls, trust score.
- Pro Consumer: four ninety-nine a month. Full title history — what CARFAX charges forty-five dollars per report for.
- Dealer Lite: forty-nine a month. Unlimited reports, branded pages, inventory tracker, QR codes, profit calculator.
- Dealer Marketing: ninety-nine a month. Everything in Lite plus Trust Score on all vehicles, VIN pages indexed on Google, custom landing page we build free, lead capture, SEO funneling. This is our most popular dealer plan.
- Dealer Pro: two forty-nine a month plus four ninety-nine setup. Full shop CRM — repair orders, inspections, job board, appointments, time clocks, customer portal, Stripe payments, AI diagnostics. Replaces Tekmetric entirely.
- Founding Partner rate: whatever tier they sign up at, price locks forever. Never increases.

READ THE PROSPECT — adjust your pitch:
- Pure dealership (sells cars only): pitch Dealer Marketing at ninety-nine a month. Do NOT mention the CRM.
- Repair shop or dealership with a service department: pitch Dealer Pro at two forty-nine. Lead with the CRM replacing Tekmetric.
- Consumer or someone researching a used car: pitch the free tier, mention Pro at four ninety-nine for full history.
- Budget-conscious: start with Dealer Lite at forty-nine.
- Luxury dealer: lead with Trust Score — luxury buyers research hardest. A ninety-four out of one hundred Trust Score on a forty thousand dollar Porsche closes deals.

Handle objections:
- "We already have CARFAX" → "CARFAX gives you reports. VinHunter gives you reports plus Google pages for every VIN, plus things CARFAX structurally cannot check — active federal investigations, cross-model complaint patterns, AI fraud detection."
- "How much?" → Ask one qualifying question first: "Do you have a service department or just sales?" Then pitch the right tier.
- "Not interested" → "Totally fair. Can I just text you a two-minute breakdown so you can see what your lot would look like on VinHunter? No commitment."
- "Who is this?" → "This is Chase from VinLedger AI Live — we build free Trust Score pages for independent dealers and check things CARFAX can't."
- "Call back later" → "Of course. Can I text you the link in the meantime?"
- "We use Tekmetric" → "We actually replace Tekmetric. Full shop CRM, repair orders, inspections, customer portal — two forty-nine a month. Most shops pay four hundred plus for Tekmetric alone."
- "Too expensive" → "We have a free tier and plans starting at forty-nine a month. What does your lot look like — how many vehicles?"

When they agree to receive a link respond with only: SEND_LINK
When they firmly want to end the call respond with only: HANGUP`;

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function buildGather(sayText, history, to) {
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const url = `${BASE}/api/twilio?action=ai-respond&amp;to=${encodeURIComponent(to)}&amp;history=${historyParam}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${url}" method="POST" speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="8">
    <Say voice="Polly.Matthew">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="Polly.Matthew">I didn't catch that. No problem, have a great day.</Say>
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
    return res.status(200).send(buildGather(
      "Hey, is this the owner? This call may be recorded for quality purposes. This is Chase calling from VinHunter — VinLedger AI Live — quick question for you.",
      [], to
    ));
  }

  // ── AI RESPOND: Claude generates next line ────────────────────────────────
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || '';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}

    if (speech) history.push({ role: 'user', content: speech });

    if (!speech) {
      return res.status(200).send(buildGather(
        "Sorry, I didn't catch that. Are you the owner of the dealership?",
        history, to
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
  <Say voice="Polly.Matthew">Perfect, sending that to you now. Talk soon.</Say>
  <Hangup/>
</Response>`);
      }

      if (reply.includes('HANGUP')) {
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">No problem at all. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      return res.status(200).send(buildGather(reply, history, to));

    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Sorry about that. Have a great day.</Say>
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
  <Say voice="Polly.Matthew">No problem. Have a great day.</Say>
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
  <Say voice="Polly.Matthew">${digit === '1' ? 'Perfect. Check your texts in just a moment. Talk soon.' : 'No problem. Have a great day.'}</Say>
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
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}`
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
