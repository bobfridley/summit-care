// api/lib/db.ts
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let readyPromise: Promise<void> | null = null;
let shuttingDown = false;

type SSLMode = 'secure' | 'insecure' | 'disable';

function getEnv(key: string): string | undefined {
  // Access via globalThis so ESLint/TS don't complain in Node builds
  const g = globalThis as unknown as {
    Deno?: { env?: { get?: (k: string) => string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };

  try {
    if (g?.Deno?.env?.get) return g.Deno.env.get(key) ?? undefined;
  } catch {
    // swallow if Deno isn't available at runtime
    void 0; // satisfy no-empty
  }

  if (g?.process?.env) return g.process.env[key];
  return undefined;
}

export function getPool(): Promise<mysql.Pool> {
  if (pool) return Promise.resolve(pool);

  const host = getEnv('MYSQL_HOST');
  const port = Number(getEnv('MYSQL_PORT') || '3306');
  const user = getEnv('MYSQL_USER');
  const password = getEnv('MYSQL_PASSWORD');
  const database = getEnv('MYSQL_DATABASE');

  if (!host || !user || !password || !database) {
    throw new Error(
      'Missing required MySQL env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE'
    );
  }

  const ca = getEnv('MYSQL_SSL_CA');
  const sslMode = (getEnv('MYSQL_SSL_MODE') || 'insecure').toLowerCase() as SSLMode;
  const rejectUnauthorizedEnv = (getEnv('MYSQL_SSL_REJECT_UNAUTHORIZED') || 'false').toLowerCase();
  const disableSsl = (getEnv('MYSQL_SSL_DISABLE') || 'false').toLowerCase() === 'true';

  const forceInsecure =
    sslMode === 'insecure' || sslMode === 'disable' || rejectUnauthorizedEnv === 'false';

  const common = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };

  const createSecurePool = () => {
    const ssl = ca
      ? { rejectUnauthorized: true, ca }
      : { rejectUnauthorized: true, minVersion: 'TLSv1.2' };
    return mysql.createPool({ ...common, ssl });
  };
  const createInsecurePool = () =>
    mysql.createPool({ ...common, ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' } });
  const createPlainPool = () => mysql.createPool({ ...common });

  // Selection
  if (disableSsl) {
    pool = createPlainPool();
  } else if (forceInsecure) {
    pool = createInsecurePool();
  } else {
    pool = createSecurePool();
  }

  return Promise.resolve(pool);
}

/**
 * Warm-up / health probe.
 * - Ensures a pool exists
 * - Pings once (SELECT 1) so the first real request isn’t paying connection setup
 */
export async function ensureReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const p = await getPool();
    const conn = await p.getConnection();
    try {
      await conn.query('SELECT 1');
    } finally {
      conn.release();
    }
  }) ();

  try {
    await readyPromise;
  } catch (e) {
    // Reset so we can retry on the next call if warm-up failed
    readyPromise = null;
    throw e;
  }
}

// Low-level: mirrors mysql2 .query()
export async function query<
  T extends
    | mysql.RowDataPacket[]
    | mysql.RowDataPacket[][]
    | mysql.OkPacket
    | mysql.OkPacket[]
    | mysql.ResultSetHeader,
>(sql: string, params?: unknown[]): Promise<[T, mysql.FieldPacket[]]> {
  await ensureReady();
  const p = await getPool();
  return p.query<T>(sql, params);
}

// High-level: SELECT helper that returns just rows
export async function rows<T extends mysql.RowDataPacket = mysql.RowDataPacket>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  await ensureReady();
  const p = await getPool();
  const [r] = await p.query<mysql.RowDataPacket[]>(sql, params);
  return r as T[];
}

// Exec helper: INSERT/UPDATE/DELETE
export async function exec(sql: string, params?: unknown[]): Promise<mysql.ResultSetHeader> {
  await ensureReady();
  const p = await getPool();
  const [res] = await p.execute<mysql.ResultSetHeader>(sql, params);
  return res;
}

/** Explicit close — useful for tests / scripts. */
export async function closePool(): Promise<void> {
  if (pool && !shuttingDown) {
    shuttingDown = true;
    try {
      await pool.end();
    } finally {
      pool = null;
      readyPromise = null;
      shuttingDown = false;
    }
  }
}

// -------------------------------------------------------------
// Graceful shutdown wiring (Node + best-effort Edge/Deno)
// -------------------------------------------------------------
type ProcessOn = { on: (event: string, handler: () => void) => void };

export function registerShutdown(): void {
  // Node (Vercel Node Functions / local scripts)
  try {
    const maybeProc = (globalThis as unknown as { process?: unknown }).process;
    if (
      maybeProc &&
      typeof maybeProc === 'object' &&
      'on' in maybeProc &&
      typeof (maybeProc as ProcessOn).on === 'function'
    ) {
      const p = maybeProc as ProcessOn;
      const handler = async () => {
        try {
          await closePool();
        } catch {
          /* noop */
        }
      };
      p.on('SIGTERM', handler);
      p.on('SIGINT', handler);
      p.on('beforeExit', handler);
      p.on('exit', handler);
    }
  } catch {
    /* ignore */
  }

  // Deno / Edge-like (best-effort)
  try {
    const g = globalThis as unknown as {
      addEventListener?: (type: string, cb: () => void) => void;
    };
    if (typeof g.addEventListener === 'function') {
      g.addEventListener('unload', () => {
        void closePool();
      });
    }
  } catch {
    /* ignore */
  }
}

// Optional: eagerly register shutdown hooks at module load (safe in all runtimes)
registerShutdown();
