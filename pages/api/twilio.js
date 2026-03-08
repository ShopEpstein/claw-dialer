import twilio from 'twilio';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';

// Static MP3 hosted in /public — no API calls, no latency, no cost
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

export default async function handler(req, res) {
  const { action } = req.query;

  // ── TWIML: Plays VinHunter MP3, gathers keypress ─────────────────────────
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
          to: customerPhone,
          from: FROM,
          body: `Hey, it's Chase from VinLedger. Here's that free link: https://vinledgerai.live — Trust Scores and Google-indexed pages on every vehicle in your inventory overnight. Reply anytime. Reply STOP to opt out.`
        });
      } catch (err) {
        console.error('SMS error:', err.message);
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">${digit === '1' ? 'Perfect. Check your texts in just a moment. Talk soon.' : 'No problem. Have a great day.'}</Say>
  <Hangup/>
</Response>`);
  }

  // ── AMD: Voicemail drop using your voice ─────────────────────────────────
  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    if (AnsweredBy === 'machine_end_beep' || AnsweredBy === 'machine_end_silence' || AnsweredBy === 'machine_end_other') {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${PITCH_URL}</Play><Hangup/></Response>`
        });
      } catch (err) {
        console.error('Voicemail drop error:', err.message);
      }
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio call status callback ──────────────────────────────────
  if (action === 'status') {
    console.log(`Call ${req.body?.CallSid} → ${req.body?.CallStatus}`);
    return res.status(200).end();
  }

  // ── CALLSTATUS: Frontend polls to detect call end ────────────────────────
  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── INBOX: Fetch inbound SMS replies ─────────────────────────────────────
  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const messages = await client.messages.list({ to: FROM, limit: 50 });
      return res.status(200).json({
        messages: messages.map(m => ({
          sid: m.sid, from: m.from, body: m.body, dateSent: m.dateSent, status: m.status
        }))
      });
    } catch (err) {
      return res.status(500).json({ error: err.message, messages: [] });
    }
  }

  // ── All below require POST ────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // ── CALL: Initiate outbound call ─────────────────────────────────────────
  if (action === 'call') {
    const { to, contactName } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls.create({
        to,
        from: FROM,
        url: `${BASE}/api/twilio?action=twiml`,
        statusCallback: `${BASE}/api/twilio?action=status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactName=${encodeURIComponent(contactName || '')}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── SMS: Manual send ─────────────────────────────────────────────────────
  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({ to, from: FROM, body: smsBody });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
