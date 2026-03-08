import twilio from 'twilio';

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    if (AnsweredBy === 'machine_end_beep' || AnsweredBy === 'machine_end_silence' || AnsweredBy === 'machine_end_other') {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="man">Hi, I'm calling from VinLedger about a tool that helps dealerships get more leads and cut software costs. Please call or text us back at this number. Thanks and have a great day!</Say><Hangup/></Response>`
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
        url: 'https://webhooks.twilio.com/v1/Accounts/ACfe0876c1f28398a9406f4c25165293f1/Flows/FWce25cde6f4329472b03498fd9989185a',
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
