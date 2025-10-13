
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
    throw new Error('Missing one or more required MySQL env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
  }

  const ca = Deno.env.get('MYSQL_SSL_CA');
  const sslMode = (Deno.env.get('MYSQL_SSL_MODE') || 'insecure').toLowerCase(); // default to insecure
  const rejectUnauthorizedEnv = (Deno.env.get('MYSQL_SSL_REJECT_UNAUTHORIZED') || 'false').toLowerCase();
  const disableSsl = (Deno.env.get('MYSQL_SSL_DISABLE') || 'false').toLowerCase() === 'true';

  const forceInsecure = sslMode === 'insecure' || sslMode === 'disable' || rejectUnauthorizedEnv === 'false';

  const commonPoolConfig = {
    host, port, user, password, database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };

  const createSecurePool = () => {
    const ssl = ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true, minVersion: 'TLSv1.2' };
    return mysql.createPool({ ...commonPoolConfig, ssl });
  };
  const createInsecurePool = () => {
    return mysql.createPool({ ...commonPoolConfig, ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' } });
  };
  const createPlainPool = () => {
    // No SSL at all (only if server allows it)
    return mysql.createPool({ ...commonPoolConfig });
  };
