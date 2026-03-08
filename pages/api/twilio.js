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

  // ── GATHER: Keypress handler — SMS goes to the person WE CALLED ──────────
  // BUG FIX: For outbound calls, From = our toll-free number, To/Called = customer
  if (action === 'gather') {
    const digit = req.body?.Digits;
    const customerPhone = req.body?.To || req.body?.Called || req.body?.From;

    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await client.messages.create({
          to: customerPhone,
          from: FROM,
          body: `Thanks for your interest! Check out VinLedger free at vinledgerai.live — Trust Scores and Google-indexed pages on every vehicle in your inventory. Takes 60 seconds to see your lot. Reply STOP to opt out.`
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
    if (
      AnsweredBy === 'machine_end_beep' ||
      AnsweredBy === 'machine_end_silence' ||
      AnsweredBy === 'machine_end_other'
    ) {
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew">Hi, calling from VinLedger. We help dealerships get more leads with Trust Scores and Google indexed inventory pages. Visit vinledgerai.live to learn more. Have a great day!</Say><Hangup/></Response>`
        });
      } catch (err) {
        console.error('Voicemail drop error:', err.message);
      }
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio call status callback (acknowledge only) ───────────────
  if (action === 'status') {
    return res.status(200).end();
  }

  // ── All below require POST ────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // ── CALL: Initiate outbound call ─────────────────────────────────────────
  if (action === 'call') {
    const { to, contactName } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const call = await client.calls.create({
        to,
        from: FROM,
        url: `${BASE}/api/twilio?action=twiml`,
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
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const message = await client.messages.create({
        to,
        from: FROM,
        body: smsBody,
      });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
