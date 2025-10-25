// scripts/test-db.ts
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../src/db/schema';

async function main() {
  // create a short-lived connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: Number(process.env.DB_PORT ?? 3306),
    connectionLimit: 5,
    waitForConnections: true,
  });

  // drizzle instance wired with schema + default mode
  const db = drizzle(pool, { schema, mode: 'default' });

  // run a quick query
  const meds = await db.query.userMedications.findMany();
  console.log('rows:', meds.length);
  console.dir(meds, { depth: 2 });

  // close the pool so the process exits cleanly
  await pool.end();
}

void main().catch((err) => {
  console.error('❌ Error running test-db:', err);
  process.exit(1);
});
