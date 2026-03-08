import twilio from 'twilio';

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi, this is an important message for the owner or manager. We help dealerships get more leads by putting a trust score and Google indexed page on every vehicle in your inventory overnight. Visit V-I-N-ledger-A-I dot live to get started free. Press 1 to get the link texted to you right now.</Say>
  <Gather numDigits="1" action="/api/twilio?action=gather" method="POST">
    <Say voice="alice">Press 1 now to receive the link by text.</Say>
  </Gather>
  <Say voice="alice">Thank you. Have a great day.</Say>
</Response>`);
  }

  if (action === 'gather') {
    const digit = req.body?.Digits;
    const from = req.body?.From;
    res.setHeader('Content-Type', 'text/xml');
    if (digit === '1' && from) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          to: from,
          from: process.env.TWILIO_FROM_NUMBER,
          body: `Hey! Here's your free VinLedger link — see what your inventory looks like with Trust Scores and Google-indexed VIN pages: https://vinledgerai.live/dealers — reply STOP to opt out.`
        });
      } catch (err) {
        console.error('SMS error:', err);
      }
    }
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Great! Check your texts in just a moment. Have a great day!</Say>
  <Hangup/>
</Response>`);
  }

  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    if (AnsweredBy === 'machine_end_beep' || AnsweredBy === 'machine_end_silence' || AnsweredBy === 'machine_end_other') {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Hi, I am calling from VinLedger about a tool that helps dealerships get more leads and cut software costs. Visit vinledgerai.live to learn more. Have a great day!</Say><Hangup/></Response>`
        });
      } catch (err) {
        console.error('Voicemail drop error:', err);
      }
    }
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  if (action === 'call') {
    const { to, contactName } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls.create({
        to,
        from: process.env.TWILIO_FROM_NUMBER,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio?action=twiml`,
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio?action=amd&contactName=${encodeURIComponent(contactName || '')}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({
        to,
        from: process.env.TWILIO_FROM_NUMBER,
        body: smsBody,
      });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
