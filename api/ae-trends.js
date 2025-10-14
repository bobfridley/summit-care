// api/ae-trends.js
import { getAeTrends, upsertAeTrends } from './functions/medicationHelpers.js';

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.setEncoding('utf8');
    req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d || '{}'));
  });
}

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
    const body =
      typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(await readBody(req));

    const drug = String(body?.drug || 'PHENELZINE').toUpperCase();

    // optional upsert if client provided fresh buckets
    if (Array.isArray(body?.buckets) && body.buckets.length) {
      await upsertAeTrends({ drug, buckets: body.buckets });
    }

    const buckets = await getAeTrends({ drug, limit: Number(body?.limit || 12) });

    return res.status(200).json({ ok: true, drug, buckets });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
