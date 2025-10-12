import { query } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://healthandhiking.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(await readBody(req));

    const drug = String(body?.drug || 'PHENELZINE').toUpperCase();

    const rows = await query(
      `SELECT contraindication, level, note
       FROM contraindications
       WHERE UPPER(drug) = UPPER(?)
       ORDER BY FIELD(level,'major','moderate','minor'), id DESC
       LIMIT 100`,
      [drug]
    );

    return res.status(200).json({ ok: true, drug, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.setEncoding('utf8');
    req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d || '{}'));
  });
}
