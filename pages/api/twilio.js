import twilio from 'twilio';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const XI_API_KEY = 'sk_f298b4ebba104aa308aa7fbbdeaab881ad848c1cf45dd04a';
const XI_VOICE_ID = 'pfFijJvRM8Pt0g6vdKtX';

const PITCH_TEXT = "Hey, this is Chase from VinLedger. Quick question — when a buyer Googles one of your VINs before calling you, what do they find? We put a Trust Score and a Google-indexed page on every vehicle in your inventory, overnight. Press 1 right now and I'll text you a free link so you can see what your lot looks like. Takes 30 seconds.";
const PRESS1_TEXT = "Perfect. Check your texts in just a moment. Talk soon.";
const NOINPUT_TEXT = "No worries. Visit vinledger AI dot live to learn more. Have a great day.";

async function xiSpeak(text, res) {
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${XI_VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': XI_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true }
      })
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const buf = await r.arrayBuffer();
    return res.status(200).send(Buffer.from(buf));
  } catch (err) {
    console.error('ElevenLabs error:', err.message);
    // Fallback: return silence MP3 header so Twilio doesn't crash
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(Buffer.alloc(0));
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── VOICE AUDIO: ElevenLabs TTS served as MP3 for Twilio <Play> ──────────
  if (action === 'audio') {
    const { t } = req.query; // t=pitch|press1|noinput
    const textMap = { pitch: PITCH_TEXT, press1: PRESS1_TEXT, noinput: NOINPUT_TEXT };
    const text = textMap[t] || PITCH_TEXT;
    return xiSpeak(text, res);
  }

  // ── TWIML: Plays VinHunter voice, gathers keypress ───────────────────────
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${BASE}/api/twilio?action=audio&t=pitch</Play>
  <Gather numDigits="1" action="${BASE}/api/twilio?action=gather" method="POST" timeout="8">
    <Play>${BASE}/api/twilio?action=audio&t=pitch</Play>
  </Gather>
  <Play>${BASE}/api/twilio?action=audio&t=noinput</Play>
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
          body: `Hey, it's Chase from VinLedger. Here's that free link: https://vinledgerai.live — we'll put a Trust Score and Google-indexed page on every vehicle in your inventory overnight. Reply anytime with questions. Reply STOP to opt out.`
        });
      } catch (err) {
        console.error('SMS send error:', err.message);
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${BASE}/api/twilio?action=audio&t=${digit === '1' ? 'press1' : 'noinput'}</Play>
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
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${BASE}/api/twilio?action=audio&t=pitch</Play><Hangup/></Response>`
        });
      } catch (err) {
        console.error('Voicemail drop error:', err.message);
      }
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio call status callback ──────────────────────────────────
  if (action === 'status') {
    const { CallSid, CallStatus } = req.body || {};
    console.log(`Call ${CallSid} ended with status: ${CallStatus}`);
    return res.status(200).end();
  }

  // ── CALLSTATUS: Frontend polls this to check if call ended ───────────────
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
