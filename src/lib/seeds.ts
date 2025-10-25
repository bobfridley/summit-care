/**
 * seed.ts — quick script to populate local MySQL/MariaDB tables
 *
 * Run with:
 *   npx ts-node src/lib/seed.ts
 *
 * Requires .env.local (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
 */

import "dotenv/config";
import { pool } from "./db";

async function seed() {
  console.log("🌱 Seeding database...");

  // --- MEDICATIONS ----------------------------------------------------------
  await pool.query("DELETE FROM medications");
  await pool.query(
    `INSERT INTO medications
      (user_id, name, dose, route, frequency, started_on, stopped_on, notes)
     VALUES
      ('u_123', 'Phenelzine', '15 mg', 'oral', '2x daily', '2025-01-10', NULL, 'Full dosage'),
      ('u_123', 'Tiotropium', '2.5 mcg', 'inhaler', 'daily', '2025-01-10', NULL, 'COPD maintenance')`
  );

  // --- CLIMBS ---------------------------------------------------------------
  await pool.query("DELETE FROM climbs");
  await pool.query(
    `INSERT INTO climbs
      (user_id, name, location, date, elevation_gain_m, duration_hr, notes)
     VALUES
      ('u_123', 'Mt. Hood', 'Oregon', '2023-05-27', 1600, 8.5, 'Summit via South Side'),
      ('u_123', 'Mount St. Helens', 'Washington', '2022-08-15', 1400, 6.2, 'Clear skies, great pace')`
  );

  // --- WORKOUTS -------------------------------------------------------------
  await pool.query("DELETE FROM workouts");
  await pool.query(
    `INSERT INTO workouts
      (user_id, name, type, date, duration_min, sets, reps, weight_kg, notes)
     VALUES
      ('u_123', 'Leg Day', 'strength', '2025-10-21', 60, 5, 5, 80.0, 'Felt strong'),
      ('u_123', 'Cardio Intervals', 'conditioning', '2025-10-20', 45, NULL, NULL, NULL, '3x10min uphill treadmill')`
  );

  console.log("✅ Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
