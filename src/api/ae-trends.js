import { query, withConn } from '../lib/db.js';

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

    // 1) Try cache first
    const rows = await query(
      `SELECT bucket_date, count_value AS count
       FROM ae_trends_cache
       WHERE UPPER(drug) = UPPER(?)
       ORDER BY bucket_date DESC
       LIMIT 12`,
      [drug]
    );

    // // 2) OPTIONAL: If cache empty, fetch from OpenFDA and upsert (uncomment to enable)
    // if (rows.length === 0) {
    //   const url = new URL('https://api.fda.gov/drug/event.json');
    //   url.searchParams.set('search', `patient.drug.medicinalproduct:${drug}`);
    //   url.searchParams.set('count', 'receivedate');
    //   url.searchParams.set('limit', '6');
    //   const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    //   if (!r.ok) throw new Error(`openFDA ${r.status}`);
    //   const json = await r.json();
    //   const buckets = (json.results || []).map(b => ({
    //     date: b.time.slice(0, 10), // "YYYYMMDD" or "YYYY-MM-DD" depending on count; adjust if needed
    //     count: Number(b.count || 0),
    //   }));
    //   await withConn(async (conn) => {
    //     await conn.beginTransaction();
    //     try {
    //       for (const b of buckets) {
    //         await conn.execute(
    //           `INSERT INTO ae_trends_cache (drug, bucket_date, count_value)
    //            VALUES (?, ?, ?)
    //            ON DUPLICATE KEY UPDATE count_value=VALUES(count_value), updated_at=CURRENT_TIMESTAMP`,
    //           [drug, b.date, b.count]
    //         );
    //       }
    //       await conn.commit();
    //     } catch (e) {
    //       await conn.rollback();
    //       throw e;
    //     }
    //   });
    //   // read back
    //   const refetched = await query(
    //     `SELECT bucket_date, count_value AS count
    //      FROM ae_trends_cache
    //      WHERE UPPER(drug) = UPPER(?)
    //      ORDER BY bucket_date DESC
    //      LIMIT 12`,
    //     [drug]
    //   );
    //   return res.status(200).json({ ok: true, drug, buckets: refetched });
    // }

    return res.status(200).json({ ok: true, drug, buckets: rows });
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
