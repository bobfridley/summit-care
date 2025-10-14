import mysql, { Pool, PoolOptions } from "mysql2/promise";
import { env } from "./env";

let pool: Pool | undefined;

function buildPoolOptions(): PoolOptions {
  const {
    MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE,
    MYSQL_SSL_CA, MYSQL_SSL_MODE, MYSQL_SSL_REJECT_UNAUTHORIZED, MYSQL_SSL_DISABLE,
  } = env;

  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error("Missing one or more required MySQL env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE");
  }

  const common: PoolOptions = {
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };

  const rejectUnauthorized = MYSQL_SSL_REJECT_UNAUTHORIZED === "true";
  const forceInsecure = MYSQL_SSL_MODE === "insecure" || MYSQL_SSL_MODE === "disable" || !rejectUnauthorized;

  if (MYSQL_SSL_DISABLE || MYSQL_SSL_MODE === "disable") {
    return { ...common }; // plain (no SSL)
  }

  if (forceInsecure) {
    return { ...common, ssl: { rejectUnauthorized: false, minVersion: "TLSv1.2" } };
  }

  const ssl = MYSQL_SSL_CA
    ? { rejectUnauthorized: true, ca: MYSQL_SSL_CA }
    : { rejectUnauthorized: true, minVersion: "TLSv1.2" };

  return { ...common, ssl };
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const opts = buildPoolOptions();
  const newPool = mysql.createPool(opts);
  const conn = await newPool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
  pool = newPool;
  return pool;
}

export async function pingDb(): Promise<number> {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    await conn.ping();
    return 1;
  } finally {
    conn.release();
  }
}

export async function tableCount(table: string): Promise<number> {
  const p = await getPool();
  const [rows] = await p.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  const r = Array.isArray(rows) ? (rows[0] as any) : (rows as any);
  return Number(r?.c ?? 0);
}
