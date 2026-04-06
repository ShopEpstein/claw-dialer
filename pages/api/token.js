import twilio from 'twilio';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { repId } = req.query;
  if (!repId) return res.status(400).json({ error: 'Missing repId' });
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity: repId }
  );
  token.addGrant(voiceGrant);
  return res.status(200).json({ token: token.toJwt() });
}
