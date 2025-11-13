import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import mysql from 'npm:mysql2@3.9.7/promise';

let pool;

async function getPool() {
  if (pool) return pool;

  const host = Deno.env.get('MYSQL_HOST');
  const port = Number(Deno.env.get('MYSQL_PORT') || '3306');
  const user = Deno.env.get('MYSQL_USER');
  const password = Deno.env.get('MYSQL_PASSWORD');
  const database = Deno.env.get('MYSQL_DATABASE');

  if (!host || !user || !password || !database) {
    throw new Error('Missing required MySQL env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
  }

  const ca = Deno.env.get('MYSQL_SSL_CA');
  const sslRejectUnauthorized = Deno.env.get('MYSQL_SSL_REJECT_UNAUTHORIZED');

  const poolConfig = {
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 30000,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };

  // Use SSL if CA certificate is available (server verification only, no client certs)
  if (ca) {
    poolConfig.ssl = {
      ca,
      rejectUnauthorized: sslRejectUnauthorized !== 'false'
    };
  }

  pool = mysql.createPool(poolConfig);

  // Test connection
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }

  return pool;
}

const CLIMB_FIELDS = [
  'mountain_name','elevation','location','planned_start_date','duration_days',
  'difficulty_level','climbing_style','group_size','emergency_contact','weather_concerns',
  'special_equipment','backpack_name','base_pack_weight_kg','status','notes'
];

function pick(obj, fields) {
  const out = {};
  for (const k of fields) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
