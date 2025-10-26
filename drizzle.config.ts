// drizzle.config.ts
import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts', // Drizzle reads this
  out: './src/db', // Drizzle writes generated files *here only*
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: Number(process.env.DB_PORT ?? 3306),
  },
  strict: true,
  verbose: true,
} satisfies Config;
