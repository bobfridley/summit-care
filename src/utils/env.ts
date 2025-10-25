// src/utils/env.ts
/* eslint-env browser */

type GlobalLike = {
  Deno?: { env?: { get?: (k: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

const g = globalThis as GlobalLike;

export const env = {
  OPENAI_API_KEY: (g.process?.env?.OPENAI_API_KEY ?? ''),
  OPENFDA_BASE: g.process?.env?.OPENFDA_BASE ?? 'https://api.fda.gov',
  NODE_ENV: g.process?.env?.NODE_ENV ?? 'development',

  // Base44 (optional)
  BASE44_APP_ID: g.process?.env?.BASE44_APP_ID ?? '',
  BASE44_SERVICE_TOKEN: g.process?.env?.BASE44_SERVICE_TOKEN ?? '',
  BASE44_FUNCTION_NAME: g.process?.env?.BASE44_FUNCTION_NAME ?? 'apiContraindicationsCore',
  BASE44_AE_TRENDS_FN: g.process?.env?.BASE44_AE_TRENDS_FN ?? 'getAeTrendsCached',
  BASE44_HEALTH_FN: g.process?.env?.BASE44_HEALTH_FN ?? 'backendHealth',

  // MySQL
  MYSQL_HOST: g.process?.env?.MYSQL_HOST ?? '',
  MYSQL_PORT: Number(g.process?.env?.MYSQL_PORT ?? '3306'),
  MYSQL_USER: g.process?.env?.MYSQL_USER ?? '',
  MYSQL_PASSWORD: g.process?.env?.MYSQL_PASSWORD ?? '',
  MYSQL_DATABASE: g.process?.env?.MYSQL_DATABASE ?? '',

  // SSL toggles (parity with your Deno version)
  MYSQL_SSL_CA: g.process?.env?.MYSQL_SSL_CA ?? '',
  MYSQL_SSL_MODE: (g.process?.env?.MYSQL_SSL_MODE ?? 'insecure').toLowerCase(),
  MYSQL_SSL_REJECT_UNAUTHORIZED: (g.process?.env?.MYSQL_SSL_REJECT_UNAUTHORIZED ?? 'false').toLowerCase(),
  MYSQL_SSL_DISABLE: (g.process?.env?.MYSQL_SSL_DISABLE ?? 'false').toLowerCase() === 'true',
};
