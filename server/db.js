// server/db.js
// Simple MySQL helper (ESM) with explicit env loading

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

// Load env from server/.env first, then fallback to project .env if present
const here = path.dirname(url.fileURLToPath(import.meta.url));
const serverEnv = path.join(here, ".env");
if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
} else {
  dotenv.config(); // fallback to root .env if you use it
}

// Read MYSQL_* (only)
const {
  MYSQL_HOST = "127.0.0.1",
  MYSQL_PORT = "3306",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "",
  MYSQL_DATABASE = "summitcare",
  MYSQL_SSL = "false",
} = process.env;

// One global pool per process
let poolPromise;
export async function getPool() {
  if (!globalThis.__dbPool) {
    globalThis.__dbPool = mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "summitcare",
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }
  return globalThis.__dbPool;
}

export async function q(sql, params = {}) {
  const pool = await getPool();
  const [rows] = await pool.query(sql, params);
  return rows;
}
