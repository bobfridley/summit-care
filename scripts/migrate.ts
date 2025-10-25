// scripts/migrate.ts
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: Number(process.env.DB_PORT ?? 3306),
    connectionLimit: 5,
  });

  const db = drizzle(pool, { logger: true });

  // Migrate using the SQL files in ./drizzle
  await migrate(db, { migrationsFolder: 'drizzle' });

  await pool.end();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
