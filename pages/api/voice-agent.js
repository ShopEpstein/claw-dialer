import Anthropic from '@anthropic-ai/sdk';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import WebSocket from 'ws';

export const config = { api: { bodyParser: false } };

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';

const SYSTEM_PROMPT = `You are Chase, calling from VinLedger. Friendly, confident, straight-talking. Keep every response to 1-2 sentences MAX. Never ramble.

Your pitch: VinLedger puts a Trust Score on every vehicle on their lot and creates Google-indexed pages for every VIN overnight. $99/month founding partner rate — locks forever. CARFAX charges $99-300/month just for reports. We give unlimited reports, SEO pages, lead capture, and a free branded landing page.

Handle objections:
- "We already have CARFAX" → "CARFAX gives you reports. We give you reports plus Google pages for every VIN so buyers find your lot before they even call you."
- "How much?" → "Ninety-nine a month. Founding partner rate — locks forever."
- "Not interested" → "Totally fair. Can I just text you a link so you can see what your lot would look like? Thirty seconds."
- "Who is this?" → "This is Chase from VinLedger — we build free Trust Score pages for independent dealers."
- "Call back later" → "Of course. Can I text you the link in the meantime?"

Goal: Get them to agree to receive the pricing link via text. That is the ONLY goal.

When they agree to the link, say exactly: "Perfect, sending that now." Nothing else.
When they want to end the call say: "No problem, have a great day." Nothing else.
When START_CALL is received, open with: "Hey, is this the owner? Hey, this is Chase calling from VinLedger — quick question for you."`;

export default async function handler(req, res) {
  const { action } = req.query;

  // ── TWIML: Kick off Media Stream ─────────────────────────────────────────
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    const wsUrl = `wss://claw-dialer.vercel.app/api/voice-agent?action=stream&to=${encodeURIComponent(to)}`;
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}"/>
  </Connect>
</Response>`);
  }

  // ── STREAM: Real-time WebSocket handler ──────────────────────────────────
  if (action === 'stream') {
    if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
      return res.status(426).send('WebSocket required');
    }

    const dealerPhone = req.query.to || '';
    const wss = new WebSocket.Server({ noServer: true });

    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), async (ws) => {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

      const conversationHistory = [];
      let streamSid = null;
      let isSpeaking = false;

      // ── Deepgram live STT ──────────────────────────────────────────────────
      const dgConnection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: false,
        endpointing: 500,
        encoding: 'mulaw',
        sample_rate: 8000,
      });

      dgConnection.on(LiveTranscriptionEvents.Transcript, async (data) => {
        const speech = data.channel?.alternatives?.[0]?.transcript?.trim();
        if (!speech || isSpeaking) return;
        console.log('Dealer:', speech);

        conversationHistory.push({ role: 'user', content: speech });
        await respondToDealer(speech);
      });

      // ── Core: Claude → ElevenLabs → Twilio ────────────────────────────────
      async function respondToDealer(trigger) {
        try {
          isSpeaking = true;

          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 120,
            system: SYSTEM_PROMPT,
            messages: conversationHistory,
          });

          const reply = response.content[0].text.trim();
          conversationHistory.push({ role: 'assistant', content: reply });
          console.log('Chase:', reply);

          // Send SMS if they agreed
          if (reply.toLowerCase().includes('sending that now')) {
            fetch(`${BASE}/api/twilio?action=sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: dealerPhone,
                body: `Chase @ VinLedger: Here's your free lot audit link — see what buyers find when they Google your VINs: https://vinledgerai.live/pricing Founding rate $99/mo locks forever. Reply STOP to opt out.`
              })
            }).catch(console.error);
          }

          // ElevenLabs TTS — mulaw 8000hz for Twilio
          const ttsRes = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/stream?output_format=ulaw_8000`,
            {
              method: 'POST',
              headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: reply,
                model_id: 'eleven_turbo_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 1.0 }
              }),
            }
          );

          if (!ttsRes.ok) {
            console.error('ElevenLabs error:', ttsRes.status);
            isSpeaking = false;
            return;
          }

          const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

          if (streamSid && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'media',
              streamSid,
              media: { payload: audioBuffer.toString('base64') }
            }));
          }

          isSpeaking = false;

          // Hang up gracefully if done
          if (reply.toLowerCase().includes('great day') || reply.toLowerCase().includes('sending that now')) {
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) ws.close();
            }, 3000);
          }

        } catch (err) {
          console.error('respondToDealer error:', err.message);
          isSpeaking = false;
        }
      }

      // ── Twilio Media Stream messages ───────────────────────────────────────
      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data);

          if (msg.event === 'start') {
            streamSid = msg.start.streamSid;
            console.log('Stream started:', streamSid, 'calling:', dealerPhone);

            // AI opens the conversation after 300ms
            setTimeout(() => {
              conversationHistory.push({ role: 'user', content: 'START_CALL' });
              respondToDealer('START_CALL');
            }, 300);
          }

          if (msg.event === 'media') {
            const audio = Buffer.from(msg.media.payload, 'base64');
            if (dgConnection.getReadyState() === 1) dgConnection.send(audio);
          }

          if (msg.event === 'stop') {
            dgConnection.finish();
            ws.close();
          }
        } catch (err) {
          console.error('ws message error:', err.message);
        }
      });

      ws.on('close', () => {
        try { dgConnection.finish(); } catch (e) {}
        console.log('Stream closed');
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
      });
    });

    return;
  }

  res.status(400).json({ error: 'Unknown action' });
}
