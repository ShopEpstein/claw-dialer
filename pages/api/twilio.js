import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

const SYSTEM_PROMPT = `You are Chase, calling from VinLedger. Friendly, confident, straight-talking. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown.

Your pitch: VinLedger puts a Trust Score on every vehicle on their lot and creates Google-indexed pages for every VIN overnight. 99 dollars a month founding partner rate, locks forever. CARFAX charges 99 to 300 a month just for reports. We give unlimited reports, SEO pages, lead capture, and a free branded landing page.

Handle objections:
- "We already have CARFAX" → "CARFAX gives you reports. We give you reports plus Google pages for every VIN so buyers find your lot before they even call you."
- "How much?" → "Ninety-nine a month. Founding partner rate, locks forever."
- "Not interested" → "Totally fair. Can I just text you a link so you can see what your lot would look like? Thirty seconds."
- "Who is this?" → "This is Chase from VinLedger, we build free Trust Score pages for independent dealers."
- "Call back later" → "Of course. Can I text you the link in the meantime?"

When they agree to receive the link respond with only: SEND_LINK
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
      "Hey, is this the owner? This call may be recorded for quality purposes. This is Chase calling from VinLedger, quick question for you.",
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
              body: `Chase @ VinLedger: Here's your free lot audit — see what buyers find when they Google your VINs: https://vinledgerai.live/pricing Founding rate $99/mo locks forever. Reply STOP to opt out.`
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
          body: `Chase @ VinLedger: Free audit shows what buyers find when they Google your VINs. See plans: https://vinledgerai.live/pricing Reply STOP to opt out.`
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
