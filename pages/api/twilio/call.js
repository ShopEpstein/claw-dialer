import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  let body = {};
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }
  } catch (e) {
    body = {};
  }

  const { to, contactName } = body;
  if (!to) return res.status(400).json({ error: 'Missing to number' });

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/twiml`,
      machineDetection: 'DetectMessageEnd',
      asyncAmdStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/amd?contactName=${encodeURIComponent(contactName || '')}`,
      asyncAmdStatusCallbackMethod: 'POST',
    });
    res.status(200).json({ success: true, callSid: call.sid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
