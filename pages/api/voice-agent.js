import Anthropic from '@anthropic-ai/sdk';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';

const SYSTEM_PROMPT = `You are Chase, calling from VinLedger. Friendly, confident, straight-talking. Keep every response to 1-2 sentences MAX. Never ramble. Do not use any special characters, asterisks, or markdown — plain spoken words only.

Your pitch: VinLedger puts a Trust Score on every vehicle on their lot and creates Google-indexed pages for every VIN overnight. 99 dollars a month founding partner rate — locks forever. CARFAX charges 99 to 300 a month just for reports. We give unlimited reports, SEO pages, lead capture, and a free branded landing page.

Handle objections:
- "We already have CARFAX" → "CARFAX gives you reports. We give you reports plus Google pages for every VIN so buyers find your lot before they even call you."
- "How much?" → "Ninety-nine a month. Founding partner rate — locks forever."
- "Not interested" → "Totally fair. Can I just text you a link so you can see what your lot would look like? Thirty seconds."
- "Who is this?" → "This is Chase from VinLedger — we build free Trust Score pages for independent dealers."
- "Call back later" → "Of course. Can I text you the link in the meantime?"
- "Send me the link" or "yes" or "sure" or "okay" → Respond with exactly the word: SEND_LINK
- "goodbye" or "not interested" firmly or "stop calling" or "take me off" → Respond with exactly the word: HANGUP

Goal: Get them to agree to receive the pricing link via text. That is the ONLY goal.
When they agree say only: SEND_LINK
When they firmly want to end say only: HANGUP`;

export default async function handler(req, res) {
  const { action } = req.query;
  res.setHeader('Content-Type', 'text/xml');

  // ── TWIML: Opening line ───────────────────────────────────────────────────
  if (action === 'twiml') {
    const opening = "Hey, is this the owner? This is Chase calling from VinLedger — quick question for you.";
    return res.status(200).send(buildGather(opening, [], req.query.to || ''));
  }

  // ── RESPOND: Process what dealer said, generate next line ─────────────────
  if (action === 'respond') {
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || req.body?.To || '';
    let history = [];

    try {
      history = JSON.parse(decodeURIComponent(req.query.history || '[]'));
    } catch (e) {
      history = [];
    }

    if (speech) history.push({ role: 'user', content: speech });

    if (!speech) {
      return res.status(200).send(buildGather(
        "Sorry, I didn't catch that. Quick question — are you the owner of the dealership?",
        history, to
      ));
    }

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: SYSTEM_PROMPT,
        messages: history,
      });

      const reply = response.content[0].text.trim();
      history.push({ role: 'assistant', content: reply });

      // Send SMS and hang up
      if (reply === 'SEND_LINK' || reply.includes('SEND_LINK')) {
        if (to) {
          await fetch(`${BASE}/api/twilio?action=sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to,
              body: `Chase @ VinLedger: Here's your free lot audit — see what buyers find when they Google your VINs: https://vinledgerai.live/pricing Founding rate $99/mo locks forever. Reply STOP to opt out.`
            })
          }).catch(console.error);
        }
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Perfect, sending that to you now. Talk soon.</Say>
  <Hangup/>
</Response>`);
      }

      // Hang up gracefully
      if (reply === 'HANGUP' || reply.includes('HANGUP')) {
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">No problem at all. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      // Continue conversation
      return res.status(200).send(buildGather(reply, history, to));

    } catch (err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Sorry about that. I'll follow up another time. Have a great day.</Say>
  <Hangup/>
</Response>`);
    }
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(400).json({ error: 'Unknown action' });
}

function buildGather(sayText, history, to) {
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const respondUrl = `${BASE}/api/voice-agent?action=respond&to=${encodeURIComponent(to)}&history=${historyParam}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${respondUrl}" method="POST" speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="8">
    <Say voice="Polly.Matthew">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="Polly.Matthew">I didn't catch that. No problem, have a great day.</Say>
  <Hangup/>
</Response>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
