import twilio from 'twilio';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';

export default async function handler(req, res) {
  const { action } = req.query;

  // ── TWIML: Plays pitch, gathers keypress ──────────────────────────────────
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">We help dealerships get more leads by putting a Trust Score and Google indexed page on every vehicle in your inventory overnight. Press 1 now to get the link texted to you free.</Say>
  <Gather numDigits="1" action="https://claw-dialer.vercel.app/api/twilio?action=gather" method="POST" timeout="8">
    <Say voice="Polly.Matthew">Press 1 now to receive the link by text.</Say>
  </Gather>
  <Say voice="Polly.Matthew">Thank you for your time. Have a great day.</Say>
  <Hangup/>
</Response>`);
  }

  // ── GATHER: Press 1 → SMS with real hyperlink ─────────────────────────────
  if (action === 'gather') {
    const digit = req.body?.Digits;
    // For outbound calls: To/Called = customer, From = our number
    const customerPhone = req.body?.To || req.body?.Called || req.body?.From;

    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          to: customerPhone,
          from: FROM,
          body: `Thanks for pressing 1! Here is your free VinLedger link: https://vinledgerai.live — Trust Scores and Google-indexed pages on every vehicle in your inventory. Reply STOP to opt out.`
        });
      } catch (err) {
        console.error('SMS send error:', err.message);
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">${digit === '1' ? 'Perfect. Check your texts in just a moment. Have a great day!' : 'Thank you. Have a great day.'}</Say>
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
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew">Hi, calling from VinLedger. We help dealerships get more leads with Trust Scores and Google indexed inventory pages. Visit vinledgerai.live to learn more. Have a great day!</Say><Hangup/></Response>`
        });
      } catch (err) {
        console.error('Voicemail drop error:', err.message);
      }
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio pings this when call ends — return callSid + status ────
  // The frontend polls /api/twilio?action=callstatus&sid=XXX to check
  if (action === 'status') {
    const { CallSid, CallStatus } = req.body || {};
    console.log(`Call ${CallSid} ended with status: ${CallStatus}`);
    return res.status(200).end();
  }

  // ── CALLSTATUS: Frontend polls this to check if a call has ended ──────────
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

  // ── INBOX: Fetch inbound SMS replies (last 50) ────────────────────────────
  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const messages = await client.messages.list({ to: FROM, limit: 50 });
      return res.status(200).json({
        messages: messages.map(m => ({
          sid: m.sid,
          from: m.from,
          body: m.body,
          dateSent: m.dateSent,
          status: m.status
        }))
      });
    } catch (err) {
      return res.status(500).json({ error: err.message, messages: [] });
    }
  }

  // ── All below require POST ────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // ── CALL: Initiate outbound call with statusCallback ─────────────────────
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

  // ── SMS: Manual send from dialer UI ──────────────────────────────────────
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
