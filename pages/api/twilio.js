import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const CHASE_CELL = '+18503414324';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

// ── SCRIPT FOCUS DIRECTIVES ───────────────────────────────────────────────────
// Injected at the top of each call so Claude leads with ONE product
const SCRIPT_FOCUS = {
  'VINHUNTER': `TODAY'S CAMPAIGN: VINHUNTER DEALERS — $49 CARFAX KILLER.
ONE product, ONE price to start: $49/mo Dealer Reports. That's the door.

YOUR HOOK: "CARFAX charges $40-50 per report. We give you unlimited reports plus a Google-indexed Trust Score page for every single VIN on your lot — overnight. $49 a month. Flat."

OPENING QUESTION: "When a buyer Googles your VINs before calling — what are they finding right now?"

CLOSE SEQUENCE:
- Lead offer: $49/mo unlimited reports + Trust Score pages
- Upsell if warm: $99/mo adds lead capture + custom SEO landing page built free
- Repair shops: $249/mo replaces Tekmetric entirely
- Founding rate locks forever — price never goes up once they're in

STAY ON $49 FIRST. Don't mention $99 or $249 until they're sold on the concept.
Do NOT mention other products unless they explicitly ask. Stay on VinHunter.`,

  'ECONOCLAW': `TODAY'S CAMPAIGN: ECONOCLAW BUSINESS OWNERS.
Lead with EconoClaw. Open by asking if they have anyone handling their business after hours.
Your hook: "21 AI agents running your business 24/7. Customer service, leads, content, research. $99 a month. Agencies charge $5,000 for the same thing."
Target close: Standard at $500 setup + $99/mo. Multi-location: Suite at $249/mo.
Do NOT mention other products unless they explicitly ask. Stay on EconoClaw.`,

  'WHITEGLOVECLAW': `TODAY'S CAMPAIGN: WHITEGLOVECLAW ENTERPRISE.
Lead with WhiteGloveClaw. Open by asking if they're the decision maker for technology.
Your hook: "Full AI infrastructure deployment — SetupClaw's scope, 20% less. Same-day go-live."
Target close: VPS at $2,400. Mac Mini at $4,000. In-person at $4,800.
Do NOT mention other products unless they explicitly ask. Stay on WhiteGloveClaw.`,

  'BUDGETRENTACLAW': `TODAY'S CAMPAIGN: BUDGET RENT-A-CLAW.
Lead with Budget Rent-A-Claw. Open by asking if they've looked into AI for their business.
Your hook: "Think rental car for AI. $49 a week, no contract, no setup fee. All 21 agents. If it doesn't pay for itself, Chase personally refunds you."
Target close: Weekly at $49. Monthly at $149.
Do NOT mention other products unless they explicitly ask. Stay on Budget Rent-A-Claw.`,

  'RETARDCLAW': `TODAY'S CAMPAIGN: RETARDCLAW.
Lead with RetardClaw. Open by asking if they run their own business.
Your hook: "We've got something for people who hate tech. 21 AI agents. You just text it what you need. The lobster handles everything else. $99 a month."
Keep it casual, funny, simple. Never use tech jargon. The lobster does tech. They don't have to.
Target close: $99/mo. Offer the $49/week trial if they hesitate.
Do NOT mention other products unless they explicitly ask. Stay on RetardClaw.`,

  'BUDGETCLAW': `TODAY'S CAMPAIGN: BUDGETCLAW CFO PITCH.
Lead with BUDGETclaw. Open by asking what they're spending on tools like Zapier, HubSpot, or a VA.
Your hook: "Year 1 your way: $6,188+. Year 1 BUDGETclaw: $2,687. Same result. We replace all of it."
Target close: Standard at $299/mo. Show them the math.
Do NOT mention other products unless they explicitly ask. Stay on BUDGETclaw.`,

  'TRANSBID': `TODAY'S CAMPAIGN: TRANSBID CONTRACTORS.
Lead with TransBid. Open by asking if they're a contractor or hire contractors.
Your hook: "Zero upfront. You only pay 0.5% when you WIN a job. HomeAdvisor charges 15-30% hidden. Veterans pay zero forever."
Target close: Get them to post their first project free.
Do NOT mention other products unless they explicitly ask. Stay on TransBid.`,

  'CLAWAWAY': `TODAY'S CAMPAIGN: CLAWAWAY FLEXIBLE.
Lead with ClawAway. Ask what's eating the most time or money in their business right now.
Your hook: "We build AI systems your way. Tell us what you need, tell us how you want to pay. Card, crypto, rev share, barter, IOU. We figure it out."
Target close: Get them talking about their problem, then match a solution and price.
Route to the right product once you understand their situation.`,
};

// ── BASE SYSTEM PROMPT ────────────────────────────────────────────────────────
const BASE_PROMPT = `You are calling on behalf of Chase from VinHunter — VinLedger AI Live. Confident, warm, direct. 1-2 sentences MAX per response. Plain spoken words. No jargon, no markdown, no special characters. Always use contractions. Sound human.

TCPA COMPLIANCE: This call may be recorded. If they ask to be removed from the list, say "Absolutely — removing you right now. Have a great day." then respond ONLY with: HANGUP

IDENTITY: You are an AI. If asked directly — be honest: "Yeah I'm an AI — Chase uses me to reach out first. Want me to have him call you personally?" Never claim to be human.

ALWAYS SAY "VinHunter" or "VinLedger AI Live" — NEVER just "VinLedger" (different company).

── THE PITCH (VinHunter ONLY unless they ask about something else) ──

CARFAX charges dealers forty to fifty dollars per report. Unlimited reports on every VIN in your inventory — plus a Google-indexed Trust Score page on every vehicle overnight — for forty-nine dollars a month flat. Founding rate locks forever.

THAT IS THE HOOK. Lead with CARFAX cost comparison. Land on $49.

Tiers to upsell INTO after they're interested:
- $49/mo: Unlimited reports + Trust Score pages (THE DOOR)
- $99/mo: Everything above + SEO lead capture pages + custom landing page built free
- $249/mo: Full shop CRM — replaces Tekmetric. Repair shops and service depts.
Free tier available to start: NHTSA decodes, recalls, Trust Score.

── OBJECTION CACHE — USE THESE WORD FOR WORD ──
"We already have CARFAX" → "CARFAX charges you per report. We're forty-nine flat for unlimited — plus Google pages on every VIN overnight. CARFAX can't do that."
"How much is CARFAX" → "About forty to fifty dollars per report. We're forty-nine a month for unlimited. Same info plus a lot more."
"Not interested" → "Totally fair — can I send you a two-minute breakdown by text? No commitment."
"Too expensive" → "We've got a free tier right now. And paid plans start at twenty-nine. What's your lot running?"
"We use Tekmetric" → "We replace Tekmetric at two forty-nine a month. Most shops pay four hundred just for Tekmetric alone."
"Who is this" → "VinHunter — we build Trust Score pages and reports for dealers. Quick question before I let you go—"
"Are you a robot" → "Yeah, AI calling for Chase. Want him to follow up personally?"
"Are you AI" → "Yep — Chase has me reach out first. Want me to have him call you?"
"Call me back later" → "Of course. Can I text you the link in the meantime?"
"Send me something" → SEND_LINK
"Remove me" or "stop calling" or "take me off" → HANGUP
"I want to talk to a person" or "get me Chase" → ESCALATE

── BUYING SIGNALS — CLOSE IMMEDIATELY ──
Any of these = go to close NOW: "how does it work", "what's included", "sounds interesting", "tell me more", "how do I sign up", "what does it cost", "send me that", "yeah sure", "go ahead".

CLOSE = name the price → ask one yes/no question → fire signal.
Example: "So it's forty-nine a month, founding rate locked forever — want me to text you the link right now?" → if yes → SEND_LINK
Example: "Want Chase to walk you through it this week — takes fifteen minutes?" → if yes → BOOK_CALL

── SIGNAL WORDS — RESPOND WITH SIGNAL ONLY, NOTHING ELSE ──
SEND_LINK → wants info texted
BOOK_CALL → wants Chase / walkthrough / said yes to next step
ESCALATE → wants Chase live right now
HANGUP → firmly done, remove request, hang up`;

function buildSystemPrompt(script) {
  const focus = SCRIPT_FOCUS[script] || SCRIPT_FOCUS['VINHUNTER'];
  return `${focus}\n\n${BASE_PROMPT}`;
}

// ── OBJECTION CACHE — fires before Claude API, ~100ms response ────────────────
// Keys are lowercase fragments. First match wins. Order matters.
const OBJECTION_CACHE = [
  // Hard stops — fire signal immediately
  { match: ['remove me','take me off','stop calling','do not call','don't call','opt out'],
    reply: null, signal: 'HANGUP' },
  { match: ['want to talk to a person','talk to a real','get me chase','transfer me','speak to chase','speak to someone'],
    reply: null, signal: 'ESCALATE' },
  { match: ['send me','text me','email me','send the link','shoot me','send that over'],
    reply: null, signal: 'SEND_LINK' },

  // CARFAX objections — highest frequency, must be instant
  { match: ['already have carfax','use carfax','got carfax','carfax is fine','carfax works'],
    reply: "CARFAX charges you per report. We're forty-nine flat for unlimited — plus Google pages on every VIN overnight. CARFAX structurally can't do that. Want me to text you a comparison?" },
  { match: ['how much is carfax','carfax cost','carfax price','what does carfax charge'],
    reply: "About forty to fifty dollars per report. We're forty-nine a month for unlimited reports plus Trust Score pages on every VIN. Want me to send you the breakdown?" },

  // Price objections
  { match: ['too expensive','can't afford','too much','out of budget','not in the budget'],
    reply: "We've got a free tier right now — no card needed. Paid plans start at twenty-nine a month. What's your lot running?" },
  { match: ['what does it cost','how much','what's the price','pricing','how much is it'],
    reply: "Forty-nine a month — unlimited reports plus a Google Trust Score page on every VIN overnight. Founding rate locks forever. Want me to text you the link?" },

  // Tech objections
  { match: ['use tekmetric','tekmetric','we have a crm','already have a crm'],
    reply: "We replace Tekmetric at two forty-nine a month. Most shops pay four hundred just for Tekmetric alone. Want me to text you a side by side?" },
  { match: ['not interested','no thank you','no thanks','not right now','maybe later','not for us'],
    reply: "Totally fair — can I text you a two-minute breakdown? No commitment, just read it when you get a sec." },
  { match: ['call back','call me back','try again later','bad time','busy right now'],
    reply: "Of course — can I text you the link in the meantime? Takes two seconds to look at." },
  { match: ['who is this','who's calling','who are you','what company','what is this'],
    reply: "VinHunter — we build Trust Score pages and reports for dealers. CARFAX charges per report, we're forty-nine flat. Quick question before I let you go—" },
  { match: ['are you a robot','are you ai','is this ai','is this a bot','automated','recording'],
    reply: "Yeah, I'm an AI calling for Chase. Want me to have him follow up personally?" },
];

function checkObjectionCache(speech) {
  const lower = (speech || '').toLowerCase();
  for (const entry of OBJECTION_CACHE) {
    if (entry.match.some(phrase => lower.includes(phrase))) {
      return entry; // { reply, signal }
    }
  }
  return null;
}

// ── SESSION STORE: keyed by CallSid — history never touches the URL ─────────
const SESSION_STORE = {};
const SESSION_TTL = 10 * 60 * 1000;

function sessionGet(callSid) {
  const s = SESSION_STORE[callSid];
  if (!s) return { history: [], script: '', to: '', name: '' };
  if (Date.now() - s.ts > SESSION_TTL) { delete SESSION_STORE[callSid]; return { history: [], script: '', to: '', name: '' }; }
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

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function buildGather(sayText, callSid) {
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

// ── SAVE CALL RECORD ──────────────────────────────────────────────────────────
async function saveCallRecord(data) {
  try {
    await fetch(`${BASE}/api/recordings?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error('Failed to save call record:', e.message);
  }
}

// ── CHASE ALERT SMS ───────────────────────────────────────────────────────────
async function alertChase(type, { to, contactName, script, summary }) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msgs = {
      BOOK_CALL: `🔥 BOOK_CALL — ${contactName || to} wants a walkthrough.\nProduct: ${script}\nNumber: ${to}\nCall them back NOW — they said yes to next step.`,
      ESCALATE:  `⚡ ESCALATE — ${contactName || to} wants YOU on the phone.\nProduct: ${script}\nNumber: ${to}\nCall them immediately.`,
      SEND_LINK: `📲 LINK SENT — ${contactName || to} asked for info.\nProduct: ${script}\nNumber: ${to}\nFollow up in 1hr if they don't reply.`,
    };
    const body = msgs[type] || `Call update: ${type} — ${to}`;
    await client.messages.create({ to: CHASE_CELL, from: FROM, body });
  } catch (e) {
    console.error('Chase alert error:', e.message);
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── AI TWIML: Opening line ────────────────────────────────────────────────
  if (action === 'ai-twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';
    const name = req.query.name ? decodeURIComponent(req.query.name) : '';
    const callSid = req.query.CallSid || req.body?.CallSid || `init_${to}_${Date.now()}`;

    const openers = {
      'VINHUNTER':       `Hey — is this the owner or manager? Quick question — what are you paying CARFAX per report right now? This call may be recorded.`,
      'ECONOCLAW':       `Hey — is this the owner? Quick one — do you have anyone handling your business after hours right now? This call may be recorded.`,
      'WHITEGLOVECLAW':  `Good day — is this the decision maker for technology? Quick question for you. This call may be recorded.`,
      'BUDGETRENTACLAW': `Hey — is this the owner? Quick one — have you looked at AI for your business at all? This call may be recorded.`,
      'RETARDCLAW':      `Hey — is this the owner? Quick one for you. This call may be recorded.`,
      'BUDGETCLAW':      `Hey — is this the owner? Quick question — what are you spending on tools like Zapier or HubSpot right now? This call may be recorded.`,
      'TRANSBID':        `Hey — are you a contractor or do you hire contractors for jobs? This call may be recorded.`,
      'CLAWAWAY':        `Hey — is this the owner? Quick question for you. This call may be recorded.`,
    };

    const opener = openers[script] || openers['VINHUNTER'];
    // Seed session store so ai-respond can read context without URL params
    sessionSet(callSid, { history: [], script, to, name });
    return res.status(200).send(buildGather(opener, callSid));
  }

  // ── AI RESPOND: Claude generates next line ────────────────────────────────
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const callSid = req.body?.CallSid || '';

    // Load session — always fall back to Twilio's own request body fields
    // Twilio sends CallSid, To, From on EVERY request, so cold starts are safe
    const sess = sessionGet(callSid);
    const to = sess.to || req.body?.To || req.body?.Called || '';
    const script = sess.script || '';
    const contactName = sess.name || '';
    let history = sess.history || [];

    if (!speech) {
      return res.status(200).send(buildGather(
        "Sorry, didn't catch that — are you the owner?",
        callSid
      ));
    }

    history.push({ role: 'user', content: speech });

    // ── OBJECTION CACHE — instant response, no Claude API call ───────────────
    const cached = speech ? checkObjectionCache(speech) : null;
    if (cached) {
      if (cached.signal === 'HANGUP') {
        await saveCallRecord({ callSid: `hup_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'not-interested', notes: 'Cache: remove/opt-out' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Absolutely — removing you right now. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }
      if (cached.signal === 'ESCALATE') {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await alertChase('ESCALATE', { to, contactName, script });
        try { await client.messages.create({ to, from: FROM, body: `Chase here — on my way. Two minutes. — Chase (850) 341-4324` }); } catch(e) {}
        await saveCallRecord({ callSid: `esc_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'callback', notes: 'Cache: wants Chase' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Texting Chase right now — he'll call you back in just a few minutes.</Say>
  <Hangup/>
</Response>`);
      }
      if (cached.signal === 'SEND_LINK') {
        const linkSms = `Chase @ VinHunter: $49/mo — unlimited VIN reports + Trust Score pages. CARFAX = $40-50/report. Founding rate locks. vinledgerai.live/pricing STOP to optout`;
        try { const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); await client.messages.create({ to, from: FROM, body: linkSms }); } catch(e) {}
        await alertChase('SEND_LINK', { to, contactName, script });
        await saveCallRecord({ callSid: `sl_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'interested', notes: 'Cache: requested link' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sent — reply to that text and Chase gets it directly. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }
      // Standard cached reply — no Claude call, instant response
      history.push({ role: 'assistant', content: cached.reply });
      sessionSet(callSid, { history: trimHistory(history), script, to, name: contactName });
      return res.status(200).send(buildGather(cached.reply, callSid));
    }

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

      // ── BOOK_CALL: prospect said yes to a walkthrough ──
      if (reply.includes('BOOK_CALL')) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await alertChase('BOOK_CALL', { to, contactName, script });
        // Text prospect confirmation
        try {
          await client.messages.create({
            to, from: FROM,
            body: `Chase here — just got the heads up you want to see how this works. I'll call you back within the hour. — Chase (850) 341-4324`,
          });
        } catch(e) {}
        // Log as interested
        await saveCallRecord({ callSid: `bc_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'interested', notes: 'BOOK_CALL — said yes to walkthrough' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Perfect — I'm texting you Chase's number right now and letting him know to call you back within the hour. You're going to like what he shows you. Talk soon.</Say>
  <Hangup/>
</Response>`);
      }

      // ── ESCALATE: wants Chase live right now ──
      if (reply.includes('ESCALATE')) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await alertChase('ESCALATE', { to, contactName, script });
        try {
          await client.messages.create({
            to, from: FROM,
            body: `Chase here — on my way. Give me two minutes and I'll call you right back. — Chase (850) 341-4324`,
          });
        } catch(e) {}
        await saveCallRecord({ callSid: `esc_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'callback', notes: 'ESCALATE — wants Chase personally' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Got it — texting Chase right now. He'll call you back in just a few minutes. Appreciate your time.</Say>
  <Hangup/>
</Response>`);
      }

      // ── SEND_LINK: wants the info ──
      if (reply.includes('SEND_LINK')) {
        const SMS_MAP = {
          'VINHUNTER':       `Chase @ VinHunter: Trust Score + SEO page on every VIN overnight. Free to $249/mo. Founding rate locks. vinledgerai.live/pricing Reply STOP to opt out.`,
          'ECONOCLAW':       `Chase @ EconoClaw: 21 AI agents 24/7. $500 setup + $99/mo. Agencies charge $5K+. econoclaw.vercel.app Reply STOP to opt out.`,
          'WHITEGLOVECLAW':  `Chase @ WhiteGloveClaw: Full AI deploy, same-day go-live. VPS $2,400, Mac Mini $4K. 20% below market. Reply to talk. Reply STOP to opt out.`,
          'BUDGETRENTACLAW': `Chase @ RentAClaw: $49/week, no setup fee. Personal refund if it doesn't pay for itself. econoclaw.vercel.app Reply STOP to opt out.`,
          'RETARDCLAW':      `Chase: RetardClaw — 21 AI agents, you just text it. $99/mo. econoclaw.vercel.app/retardclaw-landing.html Reply STOP to opt out.`,
          'BUDGETCLAW':      `Chase @ BUDGETclaw: Year 1 your way $6,188+. Year 1 BUDGETclaw $2,687. 21 agents from $199/mo. Reply STOP to opt out.`,
          'TRANSBID':        `Chase @ TransBid: Post free. Pay 0.5% only when you WIN. HomeAdvisor charges 15-30% hidden. transbid.live Reply STOP to opt out.`,
          'CLAWAWAY':        `Chase: We build AI your way — card, crypto, rev share, barter, IOU. econoclaw.vercel.app Reply STOP to opt out.`,
        };
        const smsBody = SMS_MAP[script] || SMS_MAP['VINHUNTER'];
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({ to, from: FROM, body: smsBody });
          await alertChase('SEND_LINK', { to, contactName, script });
        } catch(e) { console.error('SMS error:', e.message); }
        await saveCallRecord({ callSid: `sl_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'interested', notes: 'SEND_LINK — requested info' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sent. Take a look when you get a minute — and if you have questions just reply to that text and Chase gets it directly. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      // ── HANGUP ──
      if (reply.includes('HANGUP')) {
        await saveCallRecord({ callSid: `hup_${Date.now()}`, contactPhone: to, contactName, script, outcome: 'not-interested', notes: 'HANGUP signal' });
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">No problem at all. Have a great day.</Say>
  <Hangup/>
</Response>`);
      }

      // Save updated history back to session
      sessionSet(callSid, { history: trimHistory(history), script, to, name: contactName });
      return res.status(200).send(buildGather(reply, callSid));

    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Sorry about that. Have a great day.</Say>
  <Hangup/>
</Response>`);
    }
  }

  // ── TWIML: MP3 flow (manual non-AI calls) ────────────────────────────────
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

  // ── GATHER: press 1 for SMS ───────────────────────────────────────────────
  if (action === 'gather') {
    const digit = req.body?.Digits;
    const customerPhone = req.body?.To || req.body?.Called || req.body?.From;
    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          to: customerPhone, from: FROM,
          body: `Chase @ VinHunter: Free audit shows what buyers find when they Google your VINs. See all plans (free to $249/mo): https://vinledgerai.live/pricing Reply STOP to opt out.`,
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
      const script = req.query.script ? decodeURIComponent(req.query.script) : '';
      // Only drop voicemail if we have the VinHunter MP3 — otherwise just hang up cleanly
      if (!script || script === 'VINHUNTER') {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.calls(CallSid).update({
            twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${PITCH_URL}</Play><Hangup/></Response>`,
          });
        } catch(err) { console.error('Voicemail drop error:', err.message); }
      }
      // Non-VinHunter scripts: just let the call end cleanly, no wrong-product voicemail
    }
    return res.status(200).end();
  }

  // ── STATUS: Twilio calls this on call events ──────────────────────────────
  if (action === 'status') {
    const { CallSid, CallStatus, CallDuration, To } = req.body || {};
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const contactEmail = req.query.contactEmail ? decodeURIComponent(req.query.contactEmail) : '';
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';

    console.log(`Call ${CallSid} → ${CallStatus} (${CallDuration}s)`);

    const terminal = ['completed', 'failed', 'busy', 'no-answer'];
    if (terminal.includes(CallStatus)) {
      const dur = parseInt(CallDuration || 0);
      // Only infer outcome here if it wasn't already saved by a signal (SEND_LINK/BOOK_CALL/etc)
      // Signals save their own records with specific outcomes — this is the fallback
      const outcome = CallStatus === 'completed' && dur >= 20
        ? 'answered'
        : CallStatus === 'no-answer' || (CallStatus === 'completed' && dur < 20)
        ? 'voicemail'
        : CallStatus;

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

      // Only email on explicitly interested disposition — NOT on every answered call
      // (email is triggered by SEND_LINK and BOOK_CALL signals above)
    }

    return res.status(200).end();
  }

  // ── CALLSTATUS: poll from browser ────────────────────────────────────────
  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── INBOX: inbound SMS ────────────────────────────────────────────────────
  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // Fetch messages TO our number (inbound from prospects)
      // Filter out any where the sender is our own number (outbound echoes)
      const messages = await client.messages.list({ to: FROM, limit: 100 });
      const inbound = messages.filter(m => m.from !== FROM && m.direction !== 'outbound-api');
      return res.status(200).json({
        messages: inbound.map(m => ({
          sid: m.sid,
          from: m.from,
          body: m.body,
          dateSent: m.dateSent,
          status: m.status,
          direction: m.direction,
        })),
        total: inbound.length,
      });
    } catch(err) { return res.status(500).json({ error: err.message, messages: [] }); }
  }

  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // ── CALL: initiate outbound call ─────────────────────────────────────────
  if (action === 'call') {
    const { to, contactName, contactEmail, contactId, aiMode, script } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const nameParam = encodeURIComponent(contactName || '');
      const emailParam = encodeURIComponent(contactEmail || '');
      const idParam = encodeURIComponent(contactId || '');
      const scriptParam = encodeURIComponent(script || '');
      const call = await client.calls.create({
        to,
        from: FROM,
        url: aiMode
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}&script=${scriptParam}&name=${nameParam}`
          : `${BASE}/api/twilio?action=twiml`,
        record: true,
        recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook&contactName=${nameParam}&contactEmail=${emailParam}&contactId=${idParam}&script=${scriptParam}`,
        recordingStatusCallbackMethod: 'POST',
        recordingChannels: 'mono',
        statusCallback: `${BASE}/api/twilio?action=status&contactName=${nameParam}&contactEmail=${emailParam}&contactId=${idParam}&script=${scriptParam}`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactName=${nameParam}&script=${scriptParam}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // ── SMS: manual send ──────────────────────────────────────────────────────
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
