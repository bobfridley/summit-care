/* eslint-env node */
import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    const {
      MYSQL_HOST,
      MYSQL_PORT = '3306',
      MYSQL_USER,
      MYSQL_PASSWORD,
      MYSQL_DATABASE,
      MYSQL_SSL,
    } = process.env;

    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
      throw new Error('Missing MySQL env vars (MYSQL_HOST, USER, PASSWORD, DATABASE)');
    }

    // Some shared hosts don’t support TLS. Enable only if MYSQL_SSL === 'true'
    const ssl =
      String(MYSQL_SSL).toLowerCase() === 'true'
        ? { rejectUnauthorized: true } // adjust if Hostinger provides CA bundle
        : undefined;

    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 4,
      queueLimit: 0,
      ssl,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const p = getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

export async function withConn(fn) {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}
