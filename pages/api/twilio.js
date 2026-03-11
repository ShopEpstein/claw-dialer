import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const CHASE_CELL = '+18503414324';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

// ── SCRIPT-SPECIFIC OPENERS ───────────────────────────────────────────────────
const SCRIPT_OPENERS = {
  'VINHUNTER':       `Hey — is this the owner or manager? Quick question — what are you paying CARFAX per report right now? This call may be recorded.`,
  'ECONOCLAW':       `Hey — is this the owner? Quick one — do you have anyone handling your business after hours right now? This call may be recorded.`,
  'WHITEGLOVECLAW':  `Good day — are you the decision maker for technology there? Quick question. This call may be recorded.`,
  'BUDGETRENTACLAW': `Hey — is this the owner? Quick one — have you looked at AI for your business at all? This call may be recorded.`,
  'RETARDCLAW':      `Hey — is this the owner? Quick one for you. This call may be recorded.`,
  'BUDGETCLAW':      `Hey — is this the owner? Quick question — what are you spending on tools like Zapier or HubSpot right now? This call may be recorded.`,
  'TRANSBID':        `Hey — are you a contractor or do you hire contractors for jobs? This call may be recorded.`,
  'CLAWAWAY':        `Hey — is this the owner? Quick question for you. This call may be recorded.`,
};

const SCRIPT_FOCUS = {
  'VINHUNTER': `TODAY: VINHUNTER DEALERS.
HOOK: "CARFAX charges forty to fifty dollars per report. We give unlimited reports plus a Google Trust Score page on every VIN overnight — forty-nine a month flat."
LEAD WITH $49. Upsell to $99 (SEO + lead capture) once interested. Repair shops: $249 replaces Tekmetric. Founding rate locks forever.
Stay on VinHunter unless they ask about something else.`,

  'ECONOCLAW': `TODAY: ECONOCLAW.
HOOK: "21 AI agents running your business 24/7. Customer service, leads, content, research. $99 a month. Agencies charge $5,000 for the same thing."
Close: $500 setup + $99/mo. Stay on EconoClaw unless they ask about something else.`,

  'WHITEGLOVECLAW': `TODAY: WHITEGLOVECLAW.
HOOK: "Full AI infrastructure deployment — SetupClaw's scope, 20% less. Same-day go-live."
Close: VPS $2,400. Mac Mini $4,000. In-person $4,800. Stay on WhiteGloveClaw unless they ask about something else.`,

  'BUDGETRENTACLAW': `TODAY: BUDGET RENT-A-CLAW.
HOOK: "Think rental car for AI. $49 a week, no contract, no setup fee. All 21 agents. If it doesn't pay for itself, Chase personally refunds you."
Close: weekly $49. Stay on Rent-A-Claw unless they ask about something else.`,

  'RETARDCLAW': `TODAY: RETARDCLAW.
HOOK: "21 AI agents for people who hate tech. You just text it what you need. The lobster handles everything else. $99 a month."
Keep it casual and simple. Close: $99/mo or $49/week trial.`,

  'BUDGETCLAW': `TODAY: BUDGETCLAW.
HOOK: "Year 1 your way: $6,188 plus. Year 1 BUDGETclaw: $2,687. Same result. Replaces Zapier, HubSpot, ChatGPT, your VA."
Close: Standard $299/mo.`,

  'TRANSBID': `TODAY: TRANSBID.
HOOK: "Zero upfront. You only pay half a percent when you WIN a job. HomeAdvisor charges 15 to 30 percent hidden. Veterans pay zero forever."
Close: get them to post their first project free.`,

  'CLAWAWAY': `TODAY: CLAWAWAY.
HOOK: "We build AI systems your way. Tell us what you need, tell us how you want to pay. Card, crypto, rev share, barter, IOU."
Ask what's eating the most time or money, then match a product.`,
};

const BASE_PROMPT = `You are an AI calling on behalf of Chase. Confident, warm, direct. 1-2 sentences MAX per response. Plain spoken words only — no jargon, no markdown, no special characters. Use contractions. Sound human.

IDENTITY: You are an AI. If asked — be honest: "Yeah I'm an AI — Chase uses me to reach out first. Want me to have him call you personally?"
NEVER say "Solana Solar Solutions" — dead company name, never use it.
ALWAYS say "VinHunter" or "VinLedger AI Live" — NEVER just "VinLedger" (different company).

TCPA: If they ask to be removed, say "Absolutely — removing you right now. Have a great day." then respond ONLY with: HANGUP

── OBJECTION HANDLERS ──
"We already have CARFAX" → "CARFAX charges you per report. We're forty-nine flat for unlimited — plus Google pages on every VIN overnight. CARFAX structurally can't do that."
"How much is CARFAX" → "About forty to fifty per report. We're forty-nine a month for unlimited. Same info plus a lot more."
"Too expensive" → "We've got a free tier right now. And paid plans start at forty-nine. What's your lot running?"
"We use Tekmetric" → "We replace Tekmetric at two forty-nine a month. Most shops pay four hundred just for Tekmetric alone."
"Not interested" → "Totally fair — can I send you a two-minute breakdown by text? No commitment."
"Call me back later" → "Of course. Can I text you the link in the meantime?"
"Who is this" → "VinHunter — we build Trust Score pages and reports for dealers. Quick question before I let you go—"
"Are you AI / robot" → "Yeah, AI calling for Chase. Want him to follow up personally?"
"Remove me / stop calling / do not call" → HANGUP
"I want to talk to Chase / a person / someone real" → ESCALATE
"Call me back / book a call / let's talk" → BOOK_CALL

── BUYING SIGNALS — CLOSE IMMEDIATELY ──
"how does it work" / "what's included" / "sounds interesting" / "tell me more" / "how do I sign up" / "send me that" / "yeah sure" → name the price → ask yes/no → fire SEND_LINK.

── SIGNAL WORDS — RESPOND WITH SIGNAL ONLY, NOTHING ELSE ──
SEND_LINK → they want info texted
BOOK_CALL → they want a walkthrough or said yes to next step
ESCALATE → they want Chase live right now
HANGUP → firmly done, remove request, opt-out`;

function buildSystemPrompt(script) {
  const focus = SCRIPT_FOCUS[script] || SCRIPT_FOCUS['VINHUNTER'];
  return `${focus}\n\n${BASE_PROMPT}`;
}

// ── OBJECTION CACHE ───────────────────────────────────────────────────────────
const OBJECTION_CACHE = [
  { match: ['remove me','take me off','stop calling','do not call','don\'t call','opt out','not call'],
    signal: 'HANGUP' },
  { match: ['want to talk to a person','talk to a real','get me chase','transfer me','speak to chase','speak to someone real','real person'],
    signal: 'ESCALATE' },
  { match: ['send me','text me','email me','send the link','shoot me that','send that over','send it'],
    signal: 'SEND_LINK' },
  { match: ['book a call','schedule a call','set up a call','let\'s talk','call me back to discuss'],
    signal: 'BOOK_CALL' },
  { match: ['already have carfax','use carfax','got carfax','carfax is fine','carfax works'],
    reply: "CARFAX charges you per report. We're forty-nine flat for unlimited — plus Google pages on every VIN overnight. CARFAX structurally can't do that. Want me to text you a comparison?" },
  { match: ['how much is carfax','carfax cost','carfax price','what does carfax charge'],
    reply: "About forty to fifty dollars per report. We're forty-nine a month for unlimited reports plus Trust Score pages on every VIN. Want me to send you the breakdown?" },
  { match: ['too expensive','can\'t afford','too much','out of budget','not in the budget'],
    reply: "We've got a free tier right now — no card needed. Paid plans start at forty-nine a month. What's your lot running?" },
  { match: ['what does it cost','how much','what\'s the price','what\'s pricing','how much is it','what do you charge'],
    reply: "Forty-nine a month — unlimited reports plus a Google Trust Score page on every VIN overnight. Founding rate locks forever. Want me to text you the link?" },
  { match: ['use tekmetric','got tekmetric','we have a crm','already have a crm'],
    reply: "We replace Tekmetric at two forty-nine a month. Most shops pay four hundred just for Tekmetric alone. Want me to text you a side by side?" },
  { match: ['not interested','no thank you','no thanks','not right now','not for us'],
    reply: "Totally fair — can I text you a two-minute breakdown? No commitment, just read it when you get a sec." },
  { match: ['call back','call me back later','bad time','busy right now','try again'],
    reply: "Of course — can I text you the link in the meantime? Takes two seconds to look at." },
  { match: ['who is this','who\'s calling','who are you','what company','what is this'],
    reply: "VinHunter — we build Trust Score pages and reports for dealers. CARFAX charges per report, we're forty-nine flat. Quick question before I let you go—" },
  { match: ['are you a robot','are you ai','is this ai','is this a bot','automated','are you real'],
    reply: "Yeah, I'm an AI calling for Chase. Want me to have him follow up personally?" },
];

function checkObjectionCache(speech) {
  const lower = (speech || '').toLowerCase();
  for (const entry of OBJECTION_CACHE) {
    if (entry.match.some(phrase => lower.includes(phrase))) return entry;
  }
  return null;
}

// ── SESSION STORE ─────────────────────────────────────────────────────────────
const SESSION_STORE = {};
const SESSION_TTL = 10 * 60 * 1000;

function sessionGet(callSid) {
  const s = SESSION_STORE[callSid];
  if (!s) return { history: [], script: 'VINHUNTER', to: '', name: '' };
  if (Date.now() - s.ts > SESSION_TTL) { delete SESSION_STORE[callSid]; return { history: [], script: 'VINHUNTER', to: '', name: '' }; }
  return s;
}

function sessionSet(callSid, data) {
  SESSION_STORE[callSid] = { ...data, ts: Date.now() };
  const now = Date.now();
  for (const k of Object.keys(SESSION_STORE)) {
    if (now - SESSION_STORE[k].ts > SESSION_TTL) delete SESSION_STORE[k];
  }
}

function trimHistory(history) {
  return history.slice(-12).map(h => ({ role: h.role, content: (h.content || '').slice(0, 400) }));
}

// ── SIGNAL OUTCOME STORE — prevents status callback overwriting AI dispositions
const SIGNAL_OUTCOMES = {};

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// History lives in SESSION_STORE — action URL stays clean and short
function buildGather(sayText) {
  const url = `${BASE}/api/twilio?action=ai-respond`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${url}" method="POST" speechTimeout="3" speechModel="phone_call" enhanced="true" timeout="10">
    <Say voice="Polly.Matthew-Neural">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="Polly.Matthew-Neural">I didn't catch that. I'll have Chase follow up — have a great day.</Say>
  <Hangup/>
</Response>`;
}

async function saveCallRecord(data) {
  try {
    await fetch(`${BASE}/api/recordings?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error('saveCallRecord error:', e.message);
  }
}

async function alertChase(type, { to, contactName, script }) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msgs = {
      BOOK_CALL: `🔥 BOOK_CALL\n${contactName || to}\n${script}\n${to}\nCall them back NOW — said yes to walkthrough.`,
      ESCALATE:  `⚡ ESCALATE\n${contactName || to}\n${script}\n${to}\nCall immediately — wants you live.`,
      SEND_LINK: `📲 LINK SENT\n${contactName || to}\n${script}\n${to}\nFollow up in 1hr if no reply.`,
    };
    await client.messages.create({ to: CHASE_CELL, from: FROM, body: msgs[type] || `${type} — ${to}` });
  } catch (e) {
    console.error('alertChase error:', e.message);
  }
}

const SMS_MAP = {
  'VINHUNTER':       `Chase @ VinHunter: $49/mo — unlimited VIN reports + Trust Score pages overnight. CARFAX = $40-50/report. Founding rate locks. vinledgerai.live/pricing Reply STOP to opt out.`,
  'ECONOCLAW':       `Chase @ EconoClaw: 21 AI agents 24/7. $500 setup + $99/mo. Agencies charge $5K+. econoclaw.vercel.app Reply STOP to opt out.`,
  'WHITEGLOVECLAW':  `Chase @ WhiteGloveClaw: Full AI deploy, same-day go-live. VPS $2,400, Mac Mini $4K. 20% below market. Reply to talk. Reply STOP to opt out.`,
  'BUDGETRENTACLAW': `Chase @ RentAClaw: $49/week, no setup, no contract. Personal refund if it doesn't pay for itself. econoclaw.vercel.app Reply STOP to opt out.`,
  'RETARDCLAW':      `Chase 🦞 RetardClaw: 21 AI agents, just text it what you need. $99/mo. econoclaw.vercel.app/retardclaw-landing.html Reply STOP to opt out.`,
  'BUDGETCLAW':      `Chase @ BUDGETclaw: Year 1 your way = $6,188+. Year 1 ours = $2,687. 21 agents from $199/mo. Reply STOP to opt out.`,
  'TRANSBID':        `Chase @ TransBid: Post free, pay 0.5% only when you WIN. HomeAdvisor charges 15-30% hidden. transbid.live Reply STOP to opt out.`,
  'CLAWAWAY':        `Chase: We build AI your way — card, crypto, rev share, barter, IOU. econoclaw.vercel.app Reply STOP to opt out.`,
};

async function handleSignal(signal, { callSid, to, contactName, script, res, cacheNote }) {
  if (signal === 'HANGUP') {
    SIGNAL_OUTCOMES[callSid] = 'not-interested';
    await saveCallRecord({ callSid, contactPhone: to, contactName, script, outcome: 'not-interested', notes: cacheNote || 'HANGUP' });
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Absolutely — removing you right now. Have a great day.</Say>
  <Hangup/>
</Response>`);
  }

  if (signal === 'ESCALATE') {
    SIGNAL_OUTCOMES[callSid] = 'callback';
    await alertChase('ESCALATE', { to, contactName, script });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ to, from: FROM, body: `Chase here — on my way. Give me two minutes and I'll call you right back. — Chase (850) 341-4324` });
    } catch(e) {}
    await saveCallRecord({ callSid, contactPhone: to, contactName, script, outcome: 'callback', notes: cacheNote || 'ESCALATE — wants Chase personally' });
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Texting Chase right now — he'll call you back in just a few minutes.</Say>
  <Hangup/>
</Response>`);
  }

  if (signal === 'SEND_LINK') {
    SIGNAL_OUTCOMES[callSid] = 'interested';
    const smsBody = SMS_MAP[script] || SMS_MAP['VINHUNTER'];
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ to, from: FROM, body: smsBody });
    } catch(e) {}
    await alertChase('SEND_LINK', { to, contactName, script });
    await saveCallRecord({ callSid, contactPhone: to, contactName, script, outcome: 'interested', notes: cacheNote || 'SEND_LINK' });
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sent. Take a look when you get a minute — reply to that text and Chase gets it directly. Have a great day.</Say>
  <Hangup/>
</Response>`);
  }

  if (signal === 'BOOK_CALL') {
    SIGNAL_OUTCOMES[callSid] = 'interested';
    await alertChase('BOOK_CALL', { to, contactName, script });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ to, from: FROM, body: `Chase here — just got the heads up you want to see how this works. I'll call you back within the hour. — Chase (850) 341-4324` });
    } catch(e) {}
    await saveCallRecord({ callSid, contactPhone: to, contactName, script, outcome: 'interested', notes: cacheNote || 'BOOK_CALL' });
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Perfect — texting you Chase's number now. He'll call you back within the hour. Talk soon.</Say>
  <Hangup/>
</Response>`);
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── AI-TWIML: Opening line ────────────────────────────────────────────────
  if (action === 'ai-twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : 'VINHUNTER';
    const name = req.query.name ? decodeURIComponent(req.query.name) : '';
    const callSid = req.body?.CallSid || req.query.CallSid || `init_${to}_${Date.now()}`;
    sessionSet(callSid, { history: [], script, to, name });
    const opener = SCRIPT_OPENERS[script] || SCRIPT_OPENERS['VINHUNTER'];
    return res.status(200).send(buildGather(opener));
  }

  // ── AI-RESPOND: Claude generates next line ────────────────────────────────
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const callSid = req.body?.CallSid || '';

    const sess = sessionGet(callSid);
    const to = sess.to || req.body?.To || req.body?.Called || '';
    const script = sess.script || 'VINHUNTER';
    const contactName = sess.name || '';
    let history = sess.history || [];

    if (!speech) {
      return res.status(200).send(buildGather("Sorry, didn't catch that — are you the owner?"));
    }

    history.push({ role: 'user', content: speech });

    // Check objection cache first
    const cached = checkObjectionCache(speech);
    if (cached) {
      if (cached.signal) {
        return handleSignal(cached.signal, { callSid, to, contactName, script, res, cacheNote: `Cache: ${cached.signal}` });
      }
      history.push({ role: 'assistant', content: cached.reply });
      sessionSet(callSid, { history: trimHistory(history), script, to, name: contactName });
      return res.status(200).send(buildGather(cached.reply));
    }

    // Claude API
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: buildSystemPrompt(script),
        messages: trimHistory(history),
      });

      const reply = response.content[0].text.trim();
      history.push({ role: 'assistant', content: reply });

      for (const sig of ['BOOK_CALL', 'ESCALATE', 'SEND_LINK', 'HANGUP']) {
        if (reply.includes(sig)) {
          return handleSignal(sig, { callSid, to, contactName, script, res });
        }
      }

      sessionSet(callSid, { history: trimHistory(history), script, to, name: contactName });
      return res.status(200).send(buildGather(reply));

    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sorry about that. Have a great day.</Say>
  <Hangup/>
</Response>`);
    }
  }

  // ── TWIML: MP3 flow ───────────────────────────────────────────────────────
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${PITCH_URL}</Play>
  <Gather numDigits="1" action="${BASE}/api/twilio?action=gather" method="POST" timeout="8">
    <Play>${PITCH_URL}</Play>
  </Gather>
  <Say voice="Polly.Matthew-Neural">No problem. Have a great day.</Say>
  <Hangup/>
</Response>`);
  }

  // ── GATHER: press 1 ───────────────────────────────────────────────────────
  if (action === 'gather') {
    const digit = req.body?.Digits;
    const customerPhone = req.body?.To || req.body?.Called || req.body?.From;
    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          to: customerPhone, from: FROM,
          body: `Chase @ VinHunter: Free audit shows what buyers find when they Google your VINs. Plans from free to $249/mo: https://vinledgerai.live/pricing Reply STOP to opt out.`,
        });
      } catch(err) { console.error('SMS error:', err.message); }
    }
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">${digit === '1' ? 'Perfect. Check your texts in just a moment. Talk soon.' : 'No problem. Have a great day.'}</Say>
  <Hangup/>
</Response>`);
  }

  // ── AMD: Voicemail drop ───────────────────────────────────────────────────
  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    if (AnsweredBy === 'machine_end_beep' || AnsweredBy === 'machine_end_silence' || AnsweredBy === 'machine_end_other') {
      const script = req.query.script ? decodeURIComponent(req.query.script) : 'VINHUNTER';
      if (!script || script === 'VINHUNTER') {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.calls(CallSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${PITCH_URL}</Play><Hangup/></Response>`,
          });
        } catch(err) { console.error('VM drop error:', err.message); }
      }
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio completion callback ───────────────────────────────────
  if (action === 'status') {
    const { CallSid, CallStatus, CallDuration, To } = req.body || {};
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const contactEmail = req.query.contactEmail ? decodeURIComponent(req.query.contactEmail) : '';
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';

    const terminal = ['completed', 'failed', 'busy', 'no-answer'];
    if (terminal.includes(CallStatus)) {
      // DEDUP: if signal already saved a meaningful outcome, skip
      if (!SIGNAL_OUTCOMES[CallSid]) {
        const dur = parseInt(CallDuration || 0);
        const outcome = CallStatus === 'completed' && dur >= 20 ? 'answered'
          : CallStatus === 'no-answer' ? 'no-answer'
          : CallStatus === 'busy' ? 'busy'
          : 'voicemail';
        await saveCallRecord({
          callSid: CallSid,
          contactName,
          contactPhone: To,
          contactEmail,
          contactId,
          script,
          outcome,
          duration: CallDuration,
          notes: `Auto: ${CallStatus} ${dur}s`,
        });
      }
      delete SIGNAL_OUTCOMES[CallSid];
    }
    return res.status(200).end();
  }

  // ── CALLSTATUS: browser poll ──────────────────────────────────────────────
  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── INBOX: inbound SMS replies ────────────────────────────────────────────
  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const messages = await client.messages.list({ to: FROM, limit: 100 });
      const inbound = messages.filter(m => m.direction !== 'outbound-api');
      return res.status(200).json({
        messages: inbound.map(m => ({ sid: m.sid, from: m.from, body: m.body, dateSent: m.dateSent, status: m.status })),
        total: inbound.length,
      });
    } catch(err) { return res.status(500).json({ error: err.message, messages: [] }); }
  }

  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // ── CALL ──────────────────────────────────────────────────────────────────
  if (action === 'call') {
    const { to, contactName, contactEmail, contactId, aiMode, script } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const nameParam = encodeURIComponent(contactName || '');
      const emailParam = encodeURIComponent(contactEmail || '');
      const idParam = encodeURIComponent(contactId || '');
      const scriptParam = encodeURIComponent(script || 'VINHUNTER');
      const call = await client.calls.create({
        to,
        from: FROM,
        url: aiMode
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}&script=${scriptParam}&name=${nameParam}`
          : `${BASE}/api/twilio?action=twiml`,
        record: true,
        recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
        recordingStatusCallbackMethod: 'POST',
        recordingChannels: 'mono',
        statusCallback: `${BASE}/api/twilio?action=status&contactName=${nameParam}&contactEmail=${emailParam}&contactId=${idParam}&script=${scriptParam}`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&script=${scriptParam}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── SMS ───────────────────────────────────────────────────────────────────
  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({ to, from: FROM, body: smsBody });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
