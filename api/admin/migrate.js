import { withConn } from '../../lib/db.js';

const SQL = {
  CREATE_CONTRA: `
    CREATE TABLE IF NOT EXISTS contraindications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      drug VARCHAR(128) NOT NULL,
      contraindication VARCHAR(255) NOT NULL,
      level VARCHAR(24) NOT NULL DEFAULT 'major',
      note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_contra_drug (drug),
      KEY idx_contra_drug_level (drug, level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  CREATE_AE_TRENDS: `
    CREATE TABLE IF NOT EXISTS ae_trends_cache (
      drug VARCHAR(128) NOT NULL,
      bucket_date DATE NOT NULL,
      count_value INT UNSIGNED NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (drug, bucket_date),
      KEY idx_ae_bucket (bucket_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  UPSERT_AE: `
    INSERT INTO ae_trends_cache (drug, bucket_date, count_value)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE count_value = VALUES(count_value), updated_at = CURRENT_TIMESTAMP;
  `,
  INSERT_CONTRA: `
    INSERT INTO contraindications (drug, contraindication, level, note)
    VALUES (?, ?, ?, ?);
  `,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://healthandhiking.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','POST'].includes(req.method)) {
    res.setHeader('Allow','GET,POST,OPTIONS');
    return res.status(405).json({ ok:false, error:'Method Not Allowed' });
  }

  const token = req.headers['x-admin-token'] || new URL(req.url,'http://x').searchParams.get('token');
  if (!process.env.ADMIN_MIGRATE_TOKEN || token !== process.env.ADMIN_MIGRATE_TOKEN) {
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  try {
    const seed = new URL(req.url,'http://x').searchParams.get('seed') === '1';

    await withConn(async (conn) => {
      await conn.execute(SQL.CREATE_CONTRA);
      await conn.execute(SQL.CREATE_AE_TRENDS);
    });

    let seeded = 0;
    if (seed) {
      const contraRows = [
        ['PHENELZINE','MAOIs with SSRIs','major','Risk of serotonin syndrome'],
        ['PHENELZINE','Tyramine-rich foods','moderate','Hypertensive crisis risk'],
        ['IBUPROFEN','Warfarin','major','Enhanced bleeding risk'],
      ];
      await withConn(async (conn) => {
        for (const row of contraRows) await conn.execute(SQL.INSERT_CONTRA, row);
      });
      const today = new Date();
      const yday = new Date(Date.now() - 24*3600*1000);
      const fmt = (d) => d.toISOString().slice(0,10);
      await withConn(async (conn) => {
        await conn.execute(SQL.UPSERT_AE, ['PHENELZINE', fmt(today), 12]);
        await conn.execute(SQL.UPSERT_AE, ['PHENELZINE', fmt(yday), 9]);
      });
      seeded = contraRows.length + 2;
    }

    return res.status(200).json({ ok:true, migrated:true, seeded });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
