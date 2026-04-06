const BASE_URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(cmd, ...args) {
  const r = await fetch(BASE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args]),
  });
  const d = await r.json();
  return d.result;
}

export async function saveCall(record) {
  const s = JSON.stringify(record);
  await Promise.all([
    kv('LPUSH', 'calls:all', s),
    kv('LPUSH', `calls:${record.repId}`, s),
  ]);
}

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
      const raw = await kv('GET', `contacts:${pool}`);
      const contacts = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ contacts });
    } catch(e) { return res.status(500).json({ contacts: [], error: e.message }); }
  }
  if (action === 'contacts-save') {
    try {
      const pool = req.query.pool || 'b2b';
      await kv('SET', `contacts:${pool}`, JSON.stringify(req.body.contacts || []));
      return res.status(200).json({ ok: true });
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
      const online = results.map((r, i) => r ? JSON.parse(r) : null).filter(Boolean);
      return res.status(200).json({ online });
    } catch(e) { return res.status(500).json({ online: [], error: e.message }); }
  }
  if (action === 'contact-delete') {
    try {
      const pool = req.query.pool || 'b2b';
      const { id } = req.body;
      const raw = await kv('GET', `contacts:${pool}`);
      const contacts = raw ? JSON.parse(raw) : [];
      await kv('SET', `contacts:${pool}`, JSON.stringify(contacts.filter(c => c.id !== id)));
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }
  if (action === 'contact-update') {
    try {
      const pool = req.query.pool || 'b2b';
      const { id, updates } = req.body;
      const raw = await kv('GET', `contacts:${pool}`);
      const contacts = raw ? JSON.parse(raw) : [];
      const updated = contacts.map(c => c.id === id ? { ...c, ...updates } : c);
      await kv('SET', `contacts:${pool}`, JSON.stringify(updated));
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }
  return res.status(400).json({ error: 'Unknown action' });
}
