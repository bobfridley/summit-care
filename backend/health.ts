// backend/health.ts
import type { Pool, RowDataPacket } from 'mysql2/promise';

export type CheckStatus = 'ok' | 'fail';
export interface HealthChecks {
  database: string; // e.g. "ok (12ms)" or "fail (message)"
  tables: Record<string, string>; // per-table "ok"/"fail" notes
}

export interface BackendHealth {
  status: 'ok' | 'degraded';
  service: 'backendHealth';
  time: string; // ISO
  unix: number; // epoch seconds
  checks: HealthChecks;
}

/** Simple timer wrapper with typing */
type TimerOk<T> = { ok: true; ms: number; res: T };
type TimerErr = { ok: false; ms: number; error: string };
type TimerResult<T> = TimerOk<T> | TimerErr;

async function timer<T>(fn: () => Promise<T>): Promise<TimerResult<T>> {
  const start = Date.now();
  try {
    const res = await fn();
    return { ok: true, ms: Date.now() - start, res };
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' && e && 'message' in e
        ? String((e as { message?: unknown }).message)
        : String(e);
    return { ok: false, ms: Date.now() - start, error: msg };
  }
}

/** Fast DB connectivity + table presence checks against your schema */
export async function dbQuickCheck(pool: Pool): Promise<HealthChecks> {
  // 1) ping / SELECT 1
  const ping = await timer(async () => {
    const conn = await pool.getConnection();
    try {
      await conn.ping();
      await conn.query('SELECT 1');
    } finally {
      conn.release();
    }
  });

  const checks: HealthChecks = {
    database: ping.ok ? `ok (${ping.ms}ms)` : `fail (${ping.error})`,
    tables: {},
  };

  // 2) Confirm key tables exist (adjust list if needed)
  const requiredTables = [
    'ae_trends_cache',
    'contraindications',
    'medications',
    'medication_database',
    'climbs',
  ];

  for (const t of requiredTables) {
    const exists = await timer(async () => {
      // INFORMATION_SCHEMA check avoids errors if table missing
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        `,
        [t]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(`missing`);
      }
    });
    checks.tables[t] = exists.ok ? `ok (${exists.ms}ms)` : `fail (${exists.error})`;
  }

  return checks;
}

/** High-level health payload your API can return */
export async function backendHealth(pool: Pool): Promise<BackendHealth> {
  const checks = await dbQuickCheck(pool);
  const overallOk =
    checks.database.startsWith('ok') &&
    Object.values(checks.tables).every((v) => v.startsWith('ok'));

  const now = new Date();
  return {
    status: overallOk ? 'ok' : 'degraded',
    service: 'backendHealth',
    time: now.toISOString(),
    unix: Math.floor(now.getTime() / 1000),
    checks,
  };
}

export default backendHealth;
