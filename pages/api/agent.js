// pages/api/agent.js
// Server-side autonomous dialing agent.
// Browser monitors status only — closing browser doesn't stop dialing.
//
// Endpoints:
//   POST /api/agent?action=start    — load contacts + start dialing
//   POST /api/agent?action=stop     — stop agent
//   POST /api/agent?action=pause    — pause between calls
//   POST /api/agent?action=resume   — resume
//   GET  /api/agent?action=status   — current state + progress
//   POST /api/agent?action=result   — Twilio status callback
//   GET  /api/agent?action=outcomes — browser polls this to sync contact statuses

import twilio from 'twilio';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const VINLEDGER_API = 'https://vinledgerai.live';

const PITCH_URL = 'https://vinhunter-9518.twil.io/VinHunter.mp3';

// ── IN-MEMORY STATE ───────────────────────────────────────────────────────────
let agentState = {
  status: 'idle',
  queue: [],
  current: null,
  currentSid: null,
  called: [],
  startedAt: null,
  stateFilter: 'FL',
  total: 0,
  paused: false,
  script: 'VINHUNTER',
  aiMode: true,
  // outcome updates keyed by contactId — browser polls this to sync localStorage
  outcomeUpdates: [],
};

// TCPA area code → UTC offset
const AREA_TZ = {
  '850':'-6','904':'-5','813':'-5','727':'-5','407':'-5','305':'-5','786':'-5',
  '954':'-5','561':'-5','321':'-5','386':'-5','352':'-5','239':'-5','863':'-5',
  '772':'-5','941':'-5','754':'-5','689':'-5','656':'-5',
};

function isTCPAAllowed(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  const area = digits.startsWith('1') ? digits.slice(1, 4) : digits.slice(0, 3);
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

  if (!isTCPAAllowed(contact.phone)) {
    agentState.called.push({ ...contact, outcome: 'tcpa-skip', calledAt: new Date().toISOString() });
    if (contact.id) {
      agentState.outcomeUpdates.push({ contactId: contact.id, outcome: 'tcpa-skip', calledAt: new Date().toISOString() });
    }
    agentState.current = null;
    setTimeout(dialNext, 500);
    return;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const nameParam = encodeURIComponent(contact.name || '');
    const scriptParam = encodeURIComponent(agentState.script || 'VINHUNTER');
    const idParam = encodeURIComponent(contact.id || '');

    const call = await client.calls.create({
      to: contact.phone,
      from: FROM,
      // Always use AI mode — that's the whole point of the agent
      url: agentState.aiMode
        ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(contact.phone)}&script=${scriptParam}&name=${nameParam}`
        : `${BASE}/api/twilio?action=twiml`,
      record: true,
      recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
      recordingStatusCallbackMethod: 'POST',
      recordingChannels: 'mono',
      // Route status callback back here so agent advances the queue
      // Also routes to twilio.js status handler for recordings.js save
      statusCallback: `${BASE}/api/agent?action=result&contactId=${idParam}&contactName=${nameParam}&script=${scriptParam}`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
      machineDetection: 'DetectMessageEnd',
      asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&script=${scriptParam}`,
      asyncAmdStatusCallbackMethod: 'POST',
    });

    agentState.currentSid = call.sid;
    contact.callSid = call.sid;
  } catch (err) {
    console.error('Agent dial error:', err.message);
    agentState.called.push({ ...contact, outcome: 'failed', error: err.message, calledAt: new Date().toISOString() });
    if (contact.id) {
      agentState.outcomeUpdates.push({ contactId: contact.id, outcome: 'voicemail', calledAt: new Date().toISOString() });
    }
    agentState.current = null;
    agentState.currentSid = null;
    setTimeout(dialNext, 2000);
  }
}

export default async function handler(req, res) {
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
      current: agentState.current
        ? { name: agentState.current.name, phone: agentState.current.phone, business: agentState.current.business_name || agentState.current.name }
        : null,
      recentCalls: agentState.called.slice(-10).reverse(),
      interested: agentState.called.filter(c => c.outcome === 'interested').length,
      startedAt: agentState.startedAt,
      script: agentState.script,
      aiMode: agentState.aiMode,
    });
  }

  // ── OUTCOMES: browser polls this to sync contact statuses in localStorage ─
  // Returns any new outcomes since the last poll, keyed by contactId
  if (action === 'outcomes') {
    const since = req.query.since ? parseInt(req.query.since) : 0;
    const updates = agentState.outcomeUpdates.filter(u => new Date(u.calledAt).getTime() > since);
    return res.status(200).json({ updates, ts: Date.now() });
  }

  // ── START ─────────────────────────────────────────────────────────────────
  if (action === 'start' && req.method === 'POST') {
    if (agentState.status === 'running') return res.status(200).json({ ok: true, message: 'Already running' });
    const { state, contacts, script, aiMode } = req.body || {};

    try {
      let queue = [];
      if (contacts && contacts.length > 0) {
        queue = contacts;
      } else {
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
        script: script || 'VINHUNTER',
        aiMode: aiMode !== false, // default true
        outcomeUpdates: [],
      };

      setTimeout(dialNext, 1000);
      return res.status(200).json({ ok: true, queued: queue.length, message: `Agent started — ${queue.length} contacts queued` });
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

  // ── RESULT: Twilio status callback ───────────────────────────────────────
  // Advances the queue and saves to recordings.js store
  if (action === 'result') {
    const { CallSid, CallStatus, CallDuration } = req.body || {};
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : agentState.script || 'VINHUNTER';

    if (agentState.current && (agentState.current.callSid === CallSid || agentState.currentSid === CallSid)) {
      const dur = parseInt(CallDuration || 0);
      let outcome;
      if (CallStatus === 'no-answer') outcome = 'no-answer';
      else if (CallStatus === 'busy') outcome = 'busy';
      else if (CallStatus === 'failed') outcome = 'failed';
      else if (CallStatus === 'completed' && dur >= 20) outcome = 'answered';
      else outcome = 'voicemail';

      const contact = agentState.current;

      // Save to recordings store — same store as manual calls
      try {
        await fetch(`${BASE}/api/recordings?action=save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callSid: CallSid,
            contactId: contact.id || contactId,
            contactName: contact.name || contactName,
            contactPhone: contact.phone,
            script,
            outcome,
            duration: dur,
            notes: `Agent: ${CallStatus} ${dur}s`,
          }),
        });
      } catch(e) { console.error('Agent save error:', e.message); }

      // Sync outcome back to VinLedger if it has an ID
      if (contact.id) {
        fetch(`${VINLEDGER_API}/api/dealers/${contact.id}/call-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome, called_at: new Date().toISOString() }),
        }).catch(() => {});
      }

      agentState.called.push({ ...contact, outcome, duration: dur, calledAt: new Date().toISOString() });

      // Push to outcomes so browser can sync contact status
      if (contact.id || contactId) {
        agentState.outcomeUpdates.push({
          contactId: contact.id || contactId,
          contactPhone: contact.phone,
          outcome,
          duration: dur,
          calledAt: new Date().toISOString(),
        });
        // Keep outcomeUpdates from growing unbounded
        if (agentState.outcomeUpdates.length > 1000) {
          agentState.outcomeUpdates = agentState.outcomeUpdates.slice(-500);
        }
      }

      agentState.current = null;
      agentState.currentSid = null;

      if (agentState.status === 'running' && !agentState.paused) {
        setTimeout(dialNext, 2000);
      }
    }

    return res.status(200).end();
  }

  return res.status(400).json({ error: 'Unknown action' });
}
