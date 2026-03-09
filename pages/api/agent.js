// ─── SERVER-SIDE AGENT ────────────────────────────────────────────────────────
// Runs the call queue independently of the browser.
// Browser just monitors status — closing it doesn't stop anything.
//
// Endpoints:
//   POST /api/agent?action=start    — load contacts + start dialing
//   POST /api/agent?action=stop     — stop the agent
//   POST /api/agent?action=pause    — pause between calls
//   POST /api/agent?action=resume   — resume
//   GET  /api/agent?action=status   — current state + progress
//   POST /api/agent?action=result   — Twilio status callback posts here

import twilio from 'twilio';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const VINLEDGER_API = 'https://vinledgerai.live';

const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

const SMS_BODY = 'Chase @ VinLedger: Free audit shows what buyers find when they Google your VINs. See plans: https://vinledgerai.live/pricing Reply STOP to opt out.';

// ─── IN-MEMORY STATE (persists for lifetime of Vercel function instance) ──────
// Note: Vercel serverless functions are stateless between requests.
// We use a global object as a best-effort store. For true persistence,
// this would need a DB — but for a single-session agent this works fine.
let agentState = {
  status: 'idle',       // idle | running | paused | done
  queue: [],            // contacts yet to call
  current: null,        // contact being called right now
  currentSid: null,     // Twilio call SID
  called: [],           // completed call log
  startedAt: null,
  stateFilter: 'FL',
  total: 0,
  paused: false,
};

// TCPA area code timezone map (abbreviated — full map in index.jsx)
const AREA_TZ = {
  '850':'-6','904':'-5','813':'-5','727':'-5','407':'-5','305':'-5','786':'-5',
  '954':'-5','561':'-5','321':'-5','386':'-5','352':'-5','239':'-5','863':'-5',
  '772':'-5','941':'-5','754':'-5','689':'-5','656':'-5',
  // Expand as needed — defaults to Central (-6) if not found
};

function isTCPAAllowed(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  const area = digits.startsWith('1') ? digits.slice(1,4) : digits.slice(0,3);
  const offset = parseInt(AREA_TZ[area] || '-6');
  const localHour = (new Date().getUTCHours() + 24 + offset) % 24;
  return localHour >= 8 && localHour < 21;
}

async function fetchDealers(state) {
  const url = `${VINLEDGER_API}/api/dealers/export?has_phone=true&limit=500${state ? `&state=${state}` : ''}`;
  const r = await fetch(url);
  const data = await r.json();
  return (data.dealers || data || []).filter(d => d.phone);
}

async function dialNext() {
  if (agentState.status !== 'running' || agentState.paused) return;
  if (agentState.queue.length === 0) {
    agentState.status = 'done';
    agentState.current = null;
    return;
  }

  const contact = agentState.queue.shift();
  agentState.current = contact;

  // TCPA check
  if (!isTCPAAllowed(contact.phone)) {
    agentState.called.push({ ...contact, outcome: 'tcpa-skip', calledAt: new Date().toISOString() });
    agentState.current = null;
    setTimeout(dialNext, 500);
    return;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      to: contact.phone,
      from: FROM,
      url: `${BASE}/api/twilio?action=twiml`,
      statusCallback: `${BASE}/api/agent?action=result`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
      machineDetection: 'DetectMessageEnd',
      asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd`,
      asyncAmdStatusCallbackMethod: 'POST',
    });
    agentState.currentSid = call.sid;
    contact.callSid = call.sid;
  } catch (err) {
    agentState.called.push({ ...contact, outcome: 'failed', error: err.message, calledAt: new Date().toISOString() });
    agentState.current = null;
    agentState.currentSid = null;
    setTimeout(dialNext, 2000);
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ── STATUS ────────────────────────────────────────────────────────────────
  if (action === 'status') {
    return res.status(200).json({
      status: agentState.status,
      paused: agentState.paused,
      queue: agentState.queue.length,
      called: agentState.called.length,
      total: agentState.total,
      current: agentState.current ? { name: agentState.current.name, phone: agentState.current.phone, business: agentState.current.name } : null,
      recentCalls: agentState.called.slice(-10).reverse(),
      interested: agentState.called.filter(c => c.outcome === 'interested').length,
      startedAt: agentState.startedAt,
    });
  }

  // ── START ─────────────────────────────────────────────────────────────────
  if (action === 'start' && req.method === 'POST') {
    if (agentState.status === 'running') return res.status(200).json({ ok: true, message: 'Already running' });
    const { state, contacts } = req.body || {};

    try {
      let queue = [];
      if (contacts && contacts.length > 0) {
        // Use provided contacts
        queue = contacts;
      } else {
        // Fetch from VinLedger
        queue = await fetchDealers(state || 'FL');
      }

      agentState = {
        status: 'running',
        queue,
        current: null,
        currentSid: null,
        called: [],
        startedAt: new Date().toISOString(),
        stateFilter: state || 'FL',
        total: queue.length,
        paused: false,
      };

      // Kick off first call async — don't await
      setTimeout(dialNext, 1000);

      return res.status(200).json({ ok: true, queued: queue.length, message: `Agent started — ${queue.length} dealers queued` });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── STOP ──────────────────────────────────────────────────────────────────
  if (action === 'stop' && req.method === 'POST') {
    agentState.status = 'idle';
    agentState.queue = [];
    agentState.current = null;
    agentState.currentSid = null;
    return res.status(200).json({ ok: true, called: agentState.called.length });
  }

  // ── PAUSE ─────────────────────────────────────────────────────────────────
  if (action === 'pause' && req.method === 'POST') {
    agentState.paused = true;
    return res.status(200).json({ ok: true });
  }

  // ── RESUME ────────────────────────────────────────────────────────────────
  if (action === 'resume' && req.method === 'POST') {
    agentState.paused = false;
    if (agentState.status === 'running') setTimeout(dialNext, 500);
    return res.status(200).json({ ok: true });
  }

  // ── RESULT: Twilio posts call outcome here ────────────────────────────────
  if (action === 'result') {
    const { CallSid, CallStatus, CallDuration } = req.body || {};
    if (agentState.current && agentState.current.callSid === CallSid) {
      const dur = parseInt(CallDuration || 0);
      let outcome;
      if (CallStatus === 'no-answer' || CallStatus === 'failed' || CallStatus === 'busy') outcome = 'voicemail';
      else if (CallStatus === 'completed' && dur >= 15) outcome = 'answered';
      else outcome = 'voicemail';

      const contact = agentState.current;

      // Send SMS if answered (potential press-1 — twilio gather handles actual press-1 SMS)
      // Sync outcome back to VinLedger
      if (contact.id) {
        fetch(`${VINLEDGER_API}/api/dealers/${contact.id}/call-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome, notes: '', called_at: new Date().toISOString() })
        }).catch(() => {});
      }

      agentState.called.push({ ...contact, outcome, duration: dur, calledAt: new Date().toISOString() });
      agentState.current = null;
      agentState.currentSid = null;

      // Dial next after 2s gap
      if (agentState.status === 'running' && !agentState.paused) {
        setTimeout(dialNext, 2000);
      }
    }
    return res.status(200).end();
  }

  return res.status(400).json({ error: 'Unknown action' });
}
