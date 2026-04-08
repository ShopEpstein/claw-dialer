const BASE_URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

// Raise body limit — 5K contacts can be ~2MB of JSON
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

async function kv(cmd, ...args) {
  const r = await fetch(BASE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args]),
  });
  const d = await r.json();
  return d.result;
}

export async function getPhoneAssignments() {
  const raw = await kv('GET', 'phone:assignments');
  return raw ? JSON.parse(raw) : null;
}

export async function setPhoneAssignments(assignments) {
  await kv('SET', 'phone:assignments', JSON.stringify(assignments));
}

export async function saveCall(record) {
  const s = JSON.stringify(record);
  await Promise.all([
    kv('LPUSH', 'calls:all', s),
    kv('LPUSH', `calls:${record.repId}`, s),
  ]);
}

// ─── Chunked contacts helpers ──────────────────────────────────────────────────
// Splits large contact lists into 500-contact chunks so each KV value stays
// well under the 1MB per-key limit.
const CHUNK_SIZE = 500;

async function loadContactsFromKV(pool) {
  // Try chunked format first (contacts:{pool}:meta + contacts:{pool}:N)
  const metaRaw = await kv('GET', `contacts:${pool}:meta`);
  if (metaRaw) {
    const meta = JSON.parse(metaRaw);
    const chunks = await Promise.all(
      Array.from({ length: meta.chunks }, (_, i) => kv('GET', `contacts:${pool}:${i}`))
    );
    return chunks.flatMap(raw => (raw ? JSON.parse(raw) : []));
  }
  // Fall back to legacy single-key format
  const raw = await kv('GET', `contacts:${pool}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveContactsToKV(pool, contacts) {
  const chunks = [];
  for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
    chunks.push(contacts.slice(i, i + CHUNK_SIZE));
  }
  await Promise.all(chunks.map((chunk, i) =>
    kv('SET', `contacts:${pool}:${i}`, JSON.stringify(chunk))
  ));
  await kv('SET', `contacts:${pool}:meta`, JSON.stringify({ chunks: chunks.length, total: contacts.length }));
}

// ─── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const { action, repId } = req.query;

  if (action === 'save') {
    try {
      await saveCall(req.body);
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'rep') {
    try {
      const raw = await kv('LRANGE', `calls:${repId}`, '0', '199');
      const calls = (raw || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ calls });
    } catch(e) { return res.status(500).json({ calls: [], error: e.message }); }
  }

  if (action === 'all') {
    try {
      const raw = await kv('LRANGE', 'calls:all', '0', '499');
      const calls = (raw || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ calls });
    } catch(e) { return res.status(500).json({ calls: [], error: e.message }); }
  }

  if (action === 'contacts') {
    try {
      const pool = req.query.pool || 'b2b';
      const contacts = await loadContactsFromKV(pool);
      return res.status(200).json({ contacts });
    } catch(e) { return res.status(500).json({ contacts: [], error: e.message }); }
  }

  if (action === 'contacts-save') {
    try {
      const pool = req.query.pool || 'b2b';
      const contacts = req.body.contacts || [];
      await saveContactsToKV(pool, contacts);
      return res.status(200).json({ ok: true, total: contacts.length });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'rep-online') {
    try {
      const { repId, repName } = req.body;
      await kv('SET', `presence:${repId}`, JSON.stringify({ repId, repName, lastSeen: Date.now() }));
      await kv('EXPIRE', `presence:${repId}`, '150');
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'rep-offline') {
    try {
      const { repId } = req.body;
      await kv('DEL', `presence:${repId}`);
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'presence') {
    try {
      const ids = (req.query.repIds || '').split(',').filter(Boolean);
      const results = await Promise.all(ids.map(id => kv('GET', `presence:${id}`)));
      const online = results.map(r => r ? JSON.parse(r) : null).filter(Boolean);
      return res.status(200).json({ online });
    } catch(e) { return res.status(500).json({ online: [], error: e.message }); }
  }

  if (action === 'contact-delete') {
    try {
      const pool = req.query.pool || 'b2b';
      const { id } = req.body;
      const contacts = await loadContactsFromKV(pool);
      await saveContactsToKV(pool, contacts.filter(c => c.id !== id));
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'contact-update') {
    try {
      const pool = req.query.pool || 'b2b';
      const { id, updates } = req.body;
      const contacts = await loadContactsFromKV(pool);
      await saveContactsToKV(pool, contacts.map(c => c.id === id ? { ...c, ...updates } : c));
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'migrate-outcomes') {
    try {
      const repIds = req.body?.repIds || [];
      let fixed = 0;

      // Patch calls:all in place using LSET
      const allRaw = await kv('LRANGE', 'calls:all', '0', '-1');
      for (let i = 0; i < (allRaw || []).length; i++) {
        try {
          const rec = JSON.parse(allRaw[i]);
          if (rec.outcome === 'interested') {
            rec.outcome = 'booked';
            await kv('LSET', 'calls:all', String(i), JSON.stringify(rec));
            fixed++;
          }
        } catch {}
      }

      // Patch per-rep lists
      for (const repId of repIds) {
        const repRaw = await kv('LRANGE', `calls:${repId}`, '0', '-1');
        for (let i = 0; i < (repRaw || []).length; i++) {
          try {
            const rec = JSON.parse(repRaw[i]);
            if (rec.outcome === 'interested') {
              rec.outcome = 'booked';
              await kv('LSET', `calls:${repId}`, String(i), JSON.stringify(rec));
            }
          } catch {}
        }
      }

      // Patch contact statuses in both pools
      for (const pool of ['b2b', 'b2c']) {
        const contacts = await loadContactsFromKV(pool);
        const updated = contacts.map(c => c.status === 'interested' ? { ...c, status: 'booked' } : c);
        if (updated.some((c, i) => c.status !== contacts[i].status)) {
          await saveContactsToKV(pool, updated);
        }
      }

      return res.status(200).json({ ok: true, fixed });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'chat-send') {
    try {
      const { fromId, fromName, fromRole, to, toName, text } = req.body;
      const msg = JSON.stringify({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        fromId, fromName, fromRole, to, toName, text, ts: Date.now(),
      });
      await kv('LPUSH', 'chat:messages', msg);
      await kv('LTRIM', 'chat:messages', '0', '299');
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (action === 'chat-fetch') {
    try {
      const raw = await kv('LRANGE', 'chat:messages', '0', '99');
      const messages = (raw || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ messages });
    } catch(e) { return res.status(500).json({ messages: [], error: e.message }); }
  }

  if (action === 'chat-lastread') {
    try {
      if (req.method === 'POST') {
        const { repId, ts } = req.body;
        await kv('SET', `chat:read:${repId}`, String(ts));
        return res.status(200).json({ ok: true });
      }
      const ts = await kv('GET', `chat:read:${req.query.repId}`);
      return res.status(200).json({ ts: ts ? Number(ts) : 0 });
    } catch(e) { return res.status(500).json({ ts: 0, error: e.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
