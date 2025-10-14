// api/contraindications.js
import { getContraindications } from './functions/medicationHelpers.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    let drug, level, q, page, pageSize;

    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x');
      drug = (url.searchParams.get('drug') || 'PHENELZINE').toUpperCase();
      level = (url.searchParams.get('level') || '').toLowerCase();
      q = url.searchParams.get('q') || '';
      page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '25', 10)));
    } else {
      const body =
        typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(await readBody(req));
      drug = String(body?.drug || 'PHENELZINE').toUpperCase();
      level = String(body?.level || '').toLowerCase();
      q = String(body?.q || '');
      page = Math.max(1, parseInt(body?.page || '1', 10));
      pageSize = Math.min(100, Math.max(1, parseInt(body?.pageSize || '25', 10)));
    }

    const { rows, total, pages } = await getContraindications({ drug, level, q, page, pageSize });

    return res.status(200).json({
      ok: true,
      drug,
      level: level || null,
      q: q || null,
      pagination: { page, pageSize, total, pages },
      data: rows
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
