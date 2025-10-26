import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@/db/schema'; // moved from ../../drizzle/schema.ts

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 3306), // ✅ include this here too
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema, mode: 'default' });
export { schema };
