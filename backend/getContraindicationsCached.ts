// backend/getContraindicationsCached.ts
import type { Pool, RowDataPacket } from 'mysql2/promise';

export interface ContraParams {
  drugs: string[]; // at least one drug
  includeWarnings?: boolean; // include lower severities
  limit?: number; // default 500
}

interface ContraRow extends RowDataPacket {
  drug: string; // from schema
  contraindication: string; // from schema
  level: string; // e.g. 'major', 'moderate', 'minor'
  note: string | null;
}

export interface ContraPair {
  a: string;
  b: string;
  severity: string;
  note?: string | null;
}

export interface ContraResult {
  count: number;
  pairs: ContraPair[];
}

export default async function getContraindicationsCached(
  db: Pool,
  params: ContraParams
): Promise<ContraResult> {
  const drugs = (params.drugs ?? []).map((s) => s.trim()).filter(Boolean);
  if (drugs.length === 0) {
    throw new Error('getContraindicationsCached: `drugs` must contain at least one value.');
  }

  const includeWarnings = !!params.includeWarnings;
  const limit = clampInt(params.limit, 1, 5000, 500);

  // If you only want high-severity when includeWarnings=false, tune this list:
  const severityFilter = includeWarnings ? '' : "AND `level` IN ('contraindicated','major')";

  const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(',');

  // Match either direction:
  // (drug ∈ set AND contraindication ∈ set) OR (contraindication ∈ set AND drug ∈ set)
  const inA = placeholders(drugs.length);
  const inB = placeholders(drugs.length);

  const sql = `
    SELECT drug, contraindication, \`level\` AS level, note
    FROM contraindications
    WHERE (
      drug IN (${inA}) AND contraindication IN (${inB})
    ) OR (
      contraindication IN (${inA}) AND drug IN (${inB})
    )
    ${severityFilter}
    LIMIT ?
  `;

  const args = [...drugs, ...drugs, ...drugs, ...drugs, limit];
  const [rows] = await db.query<ContraRow[]>(sql, args);

  // Normalize symmetric pairs so (A,B) and (B,A) collapse
  const seen = new Set<string>();
  const pairs: ContraPair[] = [];

  for (const r of rows) {
    const [x, y] =
      r.drug.localeCompare(r.contraindication) <= 0
        ? [r.drug, r.contraindication]
        : [r.contraindication, r.drug];
    const key = `${x}::${y}::${r.level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ a: x, b: y, severity: r.level, note: r.note ?? null });
  }

  return { count: pairs.length, pairs };
}

/* ------------------------- helpers ------------------------- */
function clampInt(n: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
