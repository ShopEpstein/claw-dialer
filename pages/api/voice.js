import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export default function handler(req, res) {
  const twiml = new VoiceResponse();

  // Answer the call with a brief pause then connect
  twiml.pause({ length: 1 });
  twiml.say({ voice: 'alice' }, 'Connecting your call now.');

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
 
