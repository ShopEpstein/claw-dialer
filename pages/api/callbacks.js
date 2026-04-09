// pages/api/callbacks.js
// Manages scheduled callbacks: schedule, list, fire due ones, cancel.
//
//   POST /api/callbacks?action=schedule  — save a new scheduled callback + notify admin
//   GET  /api/callbacks?action=list      — list all pending callbacks
//   GET  /api/callbacks?action=check     — cron: fire callbacks whose time has arrived
//   POST /api/callbacks?action=cancel    — remove a pending callback by id

import twilio from 'twilio';

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const BASE     = process.env.NEXT_PUBLIC_BASE_URL || 'https://claw-dialer.vercel.app';
const ADMIN_PHONE = '+18503414324';
const FROM     = '+18559600110';

// TTL for callback records: 90 days
const CALLBACK_TTL = 60 * 60 * 24 * 90;

async function kv(cmd, ...args) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args]),
  });
  const d = await r.json();
  return d.result;
}

async function getAllCallbacks() {
  const ids = await kv('LRANGE', 'callbacks:ids', '0', '-1');
  if (!ids || ids.length === 0) return [];
  const records = await Promise.all(ids.map(id => kv('GET', `callback:${id}`)));
  return records
    .map(r => { try { return JSON.parse(r); } catch { return null; } })
    .filter(Boolean);
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── SCHEDULE ──────────────────────────────────────────────────────────────
  if (action === 'schedule' && req.method === 'POST') {
    try {
      const {
        contactId, contactName, contactPhone, contactType,
        callbackAt, repId, repName, notes, script,
      } = req.body || {};

      if (!contactPhone || !callbackAt) {
        return res.status(400).json({ error: 'contactPhone and callbackAt are required' });
      }

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const record = {
        id, contactId, contactName, contactPhone,
        contactType: contactType || 'b2b',
        callbackAt,     // ISO string — when to fire the call
        repId, repName, notes,
        script: script || 'CareCircle',
        scheduledAt: new Date().toISOString(),
        status: 'pending',
      };

      // Store individual record + add id to index list
      await kv('SET', `callback:${id}`, JSON.stringify(record));
      await kv('EXPIRE', `callback:${id}`, String(CALLBACK_TTL));
      await kv('LPUSH', 'callbacks:ids', id);

      // Notify admin via SMS
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const when = new Date(callbackAt).toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        const lines = [
          `📅 CALLBACK SCHEDULED`,
          contactName ? `👤 ${contactName}` : null,
          `📞 ${contactPhone}`,
          `🕐 ${when} CT`,
          repName ? `Rep: ${repName}` : null,
          notes ? `Notes: ${notes.slice(0, 100)}` : null,
        ].filter(Boolean);
        await client.messages.create({ to: ADMIN_PHONE, from: FROM, body: lines.join('\n') });
      } catch (e) {
        console.error('Admin SMS error:', e.message);
        // Don't fail the request — notification is best-effort
      }

      return res.status(200).json({ ok: true, id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── LIST ──────────────────────────────────────────────────────────────────
  if (action === 'list' && req.method === 'GET') {
    try {
      const all = await getAllCallbacks();
      const callbacks = all
        .filter(cb => cb.status === 'pending')
        .sort((a, b) => new Date(a.callbackAt) - new Date(b.callbackAt));
      return res.status(200).json({ callbacks });
    } catch (e) {
      return res.status(500).json({ callbacks: [], error: e.message });
    }
  }

  // ── CHECK (cron) ──────────────────────────────────────────────────────────
  // Called every minute by the Vercel cron job.
  // Fires any callbacks whose callbackAt time has passed.
  if (action === 'check') {
    try {
      const all = await getAllCallbacks();
      const now = Date.now();
      const due = all.filter(cb => cb.status === 'pending' && new Date(cb.callbackAt).getTime() <= now);

      if (due.length === 0) return res.status(200).json({ ok: true, fired: 0 });

      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      let fired = 0;

      for (const cb of due) {
        try {
          const scriptParam  = encodeURIComponent(cb.script || 'CareCircle');
          const nameParam    = encodeURIComponent(cb.contactName || '');
          const idParam      = encodeURIComponent(cb.contactId || '');
          const ctParam      = cb.contactType || 'b2b';

          await client.calls.create({
            to:   cb.contactPhone,
            from: FROM,
            url:  `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(cb.contactPhone)}&script=${scriptParam}&name=${nameParam}&contactType=${ctParam}`,
            record: true,
            recordingStatusCallback:       `${BASE}/api/recordings?action=transcript-webhook`,
            recordingStatusCallbackMethod: 'POST',
            statusCallback:       `${BASE}/api/twilio?action=status&contactId=${idParam}&contactName=${nameParam}&script=${scriptParam}`,
            statusCallbackMethod: 'POST',
            statusCallbackEvent:  ['completed', 'failed', 'busy', 'no-answer'],
            machineDetection:     'DetectMessageEnd',
            asyncAmdStatusCallback:       `${BASE}/api/twilio?action=amd&script=${scriptParam}&contactType=${ctParam}`,
            asyncAmdStatusCallbackMethod: 'POST',
          });

          // Mark as fired
          const updated = { ...cb, status: 'fired', firedAt: new Date().toISOString() };
          await kv('SET', `callback:${cb.id}`, JSON.stringify(updated));
          await kv('EXPIRE', `callback:${cb.id}`, String(CALLBACK_TTL));
          fired++;
        } catch (e) {
          console.error(`Failed to fire callback ${cb.id} for ${cb.contactPhone}:`, e.message);
        }
      }

      return res.status(200).json({ ok: true, fired });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── CANCEL ────────────────────────────────────────────────────────────────
  if (action === 'cancel' && req.method === 'POST') {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });

      const raw = await kv('GET', `callback:${id}`);
      if (!raw) return res.status(404).json({ error: 'Callback not found' });

      const record = JSON.parse(raw);
      if (record.status !== 'pending') {
        return res.status(400).json({ error: `Cannot cancel — status is '${record.status}'` });
      }

      const updated = { ...record, status: 'cancelled', cancelledAt: new Date().toISOString() };
      await kv('SET', `callback:${id}`, JSON.stringify(updated));
      await kv('EXPIRE', `callback:${id}`, String(CALLBACK_TTL));

      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
