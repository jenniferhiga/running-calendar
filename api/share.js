import { kv } from '@vercel/kv';

function generateShareId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (!id || !/^[a-zA-Z0-9_-]{1,32}$/.test(id)) return res.status(400).json({ error: 'Invalid share id' });
      const data = await kv.get(`share:${id}`);
      if (!data) return res.status(404).json({ error: 'Share not found' });
      return res.status(200).json({ items: data });
    }

    if (req.method === 'POST') {
      const { items, existingId } = req.body || {};
      if (!Array.isArray(items)) return res.status(400).json({ error: 'Body must include items array' });
      if (items.length > 1000) return res.status(413).json({ error: 'Too many items' });

      let shareId;
      if (existingId && /^[a-zA-Z0-9_-]{1,32}$/.test(existingId)) {
        shareId = existingId;
      } else {
        shareId = generateShareId();
        let tries = 0;
        while ((await kv.exists(`share:${shareId}`)) && tries < 5) {
          shareId = generateShareId();
          tries++;
        }
      }
      await kv.set(`share:${shareId}`, items);
      return res.status(200).json({ shareId });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || !/^[a-zA-Z0-9_-]{1,32}$/.test(id)) return res.status(400).json({ error: 'Invalid share id' });
      await kv.del(`share:${id}`);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('KV error:', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
