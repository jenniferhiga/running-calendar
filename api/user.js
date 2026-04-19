import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const key = `user:${id}`;

  try {
    if (req.method === 'GET') {
      const data = await kv.get(key);
      return res.status(200).json({ items: data || [] });
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const items = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ error: 'Body must be a JSON array' });
      if (items.length > 1000) return res.status(413).json({ error: 'Too many items (max 1000)' });
      await kv.set(key, items);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await kv.del(key);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('KV error:', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
