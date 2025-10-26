// backend/getAeTrendsCached.ts
import type { Pool, RowDataPacket } from 'mysql2/promise';

/** Input params this function accepts */
export interface AeTrendsParams {
  drugs: string[]; // required: one or more drug names
  start?: string; // optional: YYYY-MM-DD (inclusive)
  end?: string; // optional: YYYY-MM-DD (inclusive)
  limitDays?: number; // fallback window if no start/end (default 180)
}

/** One row from ae_trends_cache */
export interface AeTrendRow extends RowDataPacket {
  drug: string; // VARCHAR / TEXT (indexed in PK)
  bucket_date: string; // DATE as 'YYYY-MM-DD'
  count_value: number; // unsigned int
}

/** Output for a single drug */
export interface AeTrendSeries {
  drug: string;
  points: Array<{ date: string; count: number }>;
}

/** Output for a multi-drug request */
export interface AeTrendsResult {
  range: { start: string; end: string };
  series: AeTrendSeries[];
}

/**
 * Fetch cached AE trend points for one or more drugs.
 * Matches the schema:
 *   - columns: drug, bucket_date (DATE), count_value, updated_at
 *   - PK: (drug, bucket_date)
 */
export default async function getAeTrendsCached(
  pool: Pool,
  params: AeTrendsParams
): Promise<AeTrendsResult> {
  // Sanitize drug inputs (no String(...) coercion needed; already string[])
  const drugs = params.drugs.map((d) => d.trim()).filter(Boolean);
  if (drugs.length === 0) {
    throw new Error('getAeTrendsCached: `drugs` must contain at least one value.');
  }

  // Resolve date range
  const today = new Date();
  const end = params.end ?? toYMD(today);
  const start =
    params.start ??
    toYMD(new Date(today.getTime() - (params.limitDays ?? 180) * 24 * 60 * 60 * 1000));

  // Single SQL for all drugs using IN (...) for the drug filter.
  // Keep the date filter sargable to use your (drug, bucket_date) PK.
  const sql = `
    SELECT drug, bucket_date, count_value
    FROM ae_trends_cache
    WHERE drug IN (?) AND bucket_date BETWEEN ? AND ?
    ORDER BY drug ASC, bucket_date ASC
  `;

  // rows is AeTrendRow[] — fully typed (no any)
  const [rows] = await pool.query<AeTrendRow[]>(sql, [drugs, start, end]);

  // Group rows by drug (seed with requested drugs to preserve order & include empties)
  const byDrug = new Map<string, AeTrendSeries>();
  for (const d of drugs) {
    byDrug.set(d, { drug: d, points: [] });
  }

  for (const r of rows) {
    const series = byDrug.get(r.drug);
    if (!series) continue;
    series.points.push({ date: r.bucket_date, count: r.count_value });
  }

  return {
    range: { start, end },
    series: Array.from(byDrug.values()),
  };
}

/** Helpers */
function toYMD(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
