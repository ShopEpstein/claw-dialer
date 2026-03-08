import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { contactName } = req.query;
  const { CallSid, AnsweredBy } = req.body;

  if (AnsweredBy === 'machine_end_beep' || AnsweredBy === 'machine_end_silence' || AnsweredBy === 'machine_end_other') {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      await client.calls(CallSid).update({
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="man">Hi, I'm calling from VinLedger about a tool that helps dealerships get more leads and cut software costs. Please call or text us back at this number. Thanks and have a great day!</Say>
  <Hangup/>
</Response>`
      });
    } catch (err) {
      console.error('Voicemail drop error:', err);
    }
  }
  res.status(200).end();
}
