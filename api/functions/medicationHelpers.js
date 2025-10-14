// api/functions/medicationHelpers.js
import { query, withConn } from './dbHelpers.js';

/** Read contraindications with optional filters + pagination */
export async function getContraindications({ drug, level, q, page = 1, pageSize = 25 }) {
  const params = [drug];
  let where = `WHERE UPPER(drug) = UPPER(?)`;

  if (level && ['major', 'moderate', 'minor'].includes(level.toLowerCase())) {
    where += ` AND level = ?`;
    params.push(level.toLowerCase());
  }
  if (q) {
    where += ` AND (contraindication LIKE ? OR note LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM contraindications ${where}`, params);
  const pages = Math.ceil(Number(total || 0) / pageSize);
  const offset = (page - 1) * pageSize;

  const rows = await query(
    `
    SELECT contraindication, level, note
    FROM contraindications
    ${where}
    ORDER BY FIELD(level,'major','moderate','minor'), id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset]
  );

  return { total, pages, page, pageSize, rows };
}

/** Read last N buckets from ae_trends_cache */
export async function getAeTrends({ drug, limit = 12 }) {
  const rows = await query(
    `SELECT bucket_date, count_value AS count
     FROM ae_trends_cache
     WHERE UPPER(drug) = UPPER(?)
     ORDER BY bucket_date DESC
     LIMIT ?`,
    [drug, limit]
  );
  return rows;
}

/** Upsert trend buckets (date: YYYY-MM-DD, count: number) */
export async function upsertAeTrends({ drug, buckets = [] }) {
  return withConn(async (conn) => {
    await conn.beginTransaction();
    try {
      for (const b of buckets) {
        await conn.execute(
          `INSERT INTO ae_trends_cache (drug, bucket_date, count_value)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE count_value = VALUES(count_value), updated_at = CURRENT_TIMESTAMP`,
          [drug, b.date, b.count]
        );
      }
      await conn.commit();
      return { ok: true, upserted: buckets.length };
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  });
}
