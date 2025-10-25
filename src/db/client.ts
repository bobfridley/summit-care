// src/db/client.ts
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema'; // <-- important

export const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  port: Number(process.env.DB_PORT ?? 3306),
  connectionLimit: 10,
});

// Pass { schema } so db.query.userMedications exists
export const db = drizzle(pool, { schema, mode: 'default' });
