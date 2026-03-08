import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { to, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'Missing to or body' });

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    const message = await client.messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER,
      body
    });
    res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
