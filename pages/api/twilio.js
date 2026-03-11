import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const CHASE_CELL = '+18503414324';
const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

// ── SCRIPT FOCUS DIRECTIVES ───────────────────────────────────────────────────
// Injected at the top of each call so Claude leads with ONE product
const SCRIPT_FOCUS = {
  'VINHUNTER': `TODAY'S CAMPAIGN: VINHUNTER DEALERS ONLY.
Lead with VinHunter. Open by asking if they're the owner or decision maker.
Your hook: "When a buyer Googles one of your VINs before calling — what do they find? We put a Trust Score page on every vehicle overnight. CARFAX can't do that."
Target close: Dealer Marketing at $99/mo. Repair shops: Dealer Pro at $249/mo.
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
const BASE_PROMPT = `You are an AI calling on Chase's behalf. Friendly, confident, direct. Keep every response to 1-2 sentences MAX. Plain spoken words only — no special characters, no markdown. Contractions always. Short punchy sentences.

CRITICAL IDENTITY RULE: You are an AI, not a human. If asked — be honest: "I'm an AI calling on Chase's behalf — want me to have him follow up personally?" Never claim to be human.

IMPORTANT: Always say "VinLedger AI Live" or "VinHunter" for the VIN product — NEVER just "VinLedger".

── PRODUCT KNOWLEDGE ──

VINHUNTER: Free CARFAX alternative + Google-indexed Trust Score pages for every VIN overnight + full shop CRM.
Pricing: Free tier · $29/mo Verified · $49/mo Reports · $99/mo Marketing (SEO pages + lead capture) · $249/mo Pro (full CRM, replaces Tekmetric). Founding rate locks forever.

ECONOCLAW: 21 Claude AI agents deployed to any business. 24/7 customer service, content, research, outreach, analytics.
Pricing: $500 setup + $99/mo (Standard) · $1,500 + $249/mo (Suite, 5 locations) · $2,500 + $499/mo (Penthouse, white label). Agencies charge $5,000+ setup and $1,500/mo.

WHITEGLOVECLAW: Full white-glove AI infrastructure. Same as SetupClaw at 20% less.
Pricing: VPS $2,400 · Mac Mini $4,000 · In-person $4,800. Same-day go-live.

BUDGET RENT-A-CLAW: Rent all 21 agents. No setup fee, no contract.
Pricing: $9/day · $49/week · $149/month · $999/year. Personal refund guarantee. Counts toward EconoClaw setup.

RETARDCLAW: Same 21 agents, built for people who hate tech. You just text it. The lobster handles everything.
Pricing: $99/mo. $49/week trial available.

BUDGETCLAW: 21 agents on budget tiers. Replaces Zapier + HubSpot + VA.
Pricing: Micro $199/mo · Standard $299/mo · Pro $499/mo.

TRANSBID: Public contract exchange. Zero upfront. 0.5% only when you win. Veterans 0% forever.

CLAWAWAY: Fully flexible. Build anything, pay anything — card, Zelle, crypto, rev share, barter, IOU.

── CLOSING SEQUENCE ──
This is the most important part of every call. When you detect interest or curiosity:
1. Name the specific product and price: "So the Dealer Marketing plan is ninety-nine a month—"
2. Ask for micro-commitment: "Does that work for your budget?" or "Want me to have Chase walk you through it this week?"
3. If YES to a call with Chase → respond ONLY with: BOOK_CALL
4. If YES to a link/info → respond ONLY with: SEND_LINK
5. If they want Chase personally right now → respond ONLY with: ESCALATE

Buying signals to close on: "how does it work", "what's included", "that sounds interesting", "tell me more", "how do I sign up", "send me that", "yeah go ahead", any price question after your pitch.

── OBJECTION RESPONSES (use these EXACTLY) ──
"We already have CARFAX" → "CARFAX gives you reports. We give you reports plus a Google page for every VIN — stuff CARFAX structurally can't check. Free tier available right now."
"We use Tekmetric" → "We replace Tekmetric. Full shop CRM, two forty-nine a month. Most shops pay four hundred just for Tekmetric."
"Too expensive" → "We've got a free tier and plans from twenty-nine a month. What's your lot size?"
"Not interested" → "Totally fair — can I text you a two-minute breakdown? No commitment, just read it when you have a sec."
"Already have AI tools" → "What are you paying for them? We probably replace all of them for less than you're paying for one."
"I don't do tech" → "That's exactly who RetardClaw is for. You text it what you need, the lobster handles it. Ninety-nine a month."
"Who is this?" → "I'm an AI calling on Chase's behalf — we build free Trust Score pages for dealers and AI systems for businesses. Quick question before I let you go—"
"Are you a robot?" → "Yeah, I'm an AI — Chase had me reach out first. Want me to have him follow up personally?"
"Call back later" → "Of course — can I text you the link in the meantime?"
"How does it work" → CLOSING SEQUENCE — this is a buying signal, go to close.
"What's the price" → Give the price, then immediately ask "Does that work for you?"

── SIGNAL WORDS (respond ONLY with the signal, nothing else) ──
SEND_LINK → they want info/link texted to them
BOOK_CALL → they want Chase to call them / they want a walkthrough / they said yes to next step
ESCALATE → they want Chase on the phone RIGHT NOW
HANGUP → they firmly want to end the call, not interested, told you to stop calling`;

function buildSystemPrompt(script) {
  const focus = SCRIPT_FOCUS[script] || SCRIPT_FOCUS['VINHUNTER'];
  return `${focus}\n\n${BASE_PROMPT}`;
}

// ── HISTORY MANAGEMENT ────────────────────────────────────────────────────────
// Keep last 10 turns, truncate each to 300 chars to prevent URL overflow
function trimHistory(history) {
  return history
    .slice(-10)
    .map(h => ({ role: h.role, content: (h.content || '').slice(0, 300) }));
}

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function buildGather(sayText, history, to, script) {
  const trimmed = trimHistory(history);
  const historyParam = encodeURIComponent(JSON.stringify(trimmed));
  const scriptParam = encodeURIComponent(script || '');
  const url = `${BASE}/api/twilio?action=ai-respond&amp;to=${encodeURIComponent(to)}&amp;history=${historyParam}&amp;script=${scriptParam}`;
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

    const openers = {
      'VINHUNTER':       `Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf from VinHunter${name ? ` — is this ${name.split(' ')[0]}` : ''} — quick question for you.`,
      'ECONOCLAW':       `Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf from EconoClaw${name ? ` — is this ${name.split(' ')[0]}` : ''} — quick question for you.`,
      'WHITEGLOVECLAW':  `Good day — is this the decision maker? This call may be recorded. I'm an AI calling on Chase's behalf from WhiteGloveClaw — one quick question.`,
      'BUDGETRENTACLAW': `Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf about Budget Rent-A-Claw${name ? ` — is this ${name.split(' ')[0]}` : ''} — quick question.`,
      'RETARDCLAW':      `Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf — quick one for you.`,
      'BUDGETCLAW':      `Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf from BUDGETclaw — quick one for you.`,
      'TRANSBID':        `Hey — are you a contractor or do you hire contractors? This call may be recorded. I'm an AI calling on Chase's behalf about TransBid — quick question.`,
      'CLAWAWAY':        `Hey — is this the owner? This call may be recorded. I'm an AI calling on Chase's behalf — quick question for you.`,
    };

    const opener = openers[script] || openers['VINHUNTER'];
    return res.status(200).send(buildGather(opener, [], to, script));
  }

  // ── AI RESPOND: Claude generates next line ────────────────────────────────
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';
    const contactName = req.query.name ? decodeURIComponent(req.query.name) : '';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}

    if (!speech) {
      return res.status(200).send(buildGather(
        "Sorry, didn't catch that — are you the owner?",
        history, to, script
      ));
    }

    history.push({ role: 'user', content: speech });

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
          'VINHUNTER':       `Chase @ VinHunter: Free lot audit + Trust Score pages for every VIN overnight. See plans (free to $249/mo): https://vinledgerai.live/pricing — Founding rate locks forever. Reply STOP to opt out.`,
          'ECONOCLAW':       `Chase @ EconoClaw: 21 AI agents, your biz, 24/7. $500 setup + $99/mo. Agencies charge $5K+ for the same. econoclaw.vercel.app/econoclaw-landing.html — Reply STOP to opt out.`,
          'WHITEGLOVECLAW':  `Chase @ WhiteGloveClaw: Full AI deployment. SetupClaw scope, 20% less. VPS $2,400 · Mac Mini $4K · In-person $4,800. Same-day go-live. Reply to talk. Reply STOP to opt out.`,
          'BUDGETRENTACLAW': `Chase @ Rent-A-Claw: $49/week, no contract, no setup fee. Personal refund if it doesn't pay for itself. econoclaw.vercel.app/budgetrentaclaw-landing.html — Reply STOP to opt out.`,
          'RETARDCLAW':      `Chase: RetardClaw — 21 AI agents for people who hate tech. You just text it. 🦞 $99/mo. econoclaw.vercel.app/retardclaw-landing.html — Reply STOP to opt out.`,
          'BUDGETCLAW':      `Chase @ BUDGETclaw: Year 1 your way = $6,188+. Year 1 BUDGETclaw = $2,687. 21 agents from $199/mo. Reply STOP to opt out.`,
          'TRANSBID':        `Chase @ TransBid: Post projects free. Pay 0.5% only when you WIN. HomeAdvisor charges 15-30% hidden. transbid.live — Reply STOP to opt out.`,
          'CLAWAWAY':        `Chase: We build AI systems your way — card, crypto, rev share, barter, IOU. econoclaw.vercel.app/econoclaw-landing.html — Reply STOP to opt out.`,
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

      return res.status(200).send(buildGather(reply, history, to, script));

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
        recordingChannels: 'dual',
        transcribe: true,
        transcribeCallback: `${BASE}/api/recordings?action=transcript-webhook&contactName=${nameParam}&contactEmail=${emailParam}&contactId=${idParam}&script=${scriptParam}`,
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
