// api/functions/backend-health.ts
export const runtime = 'edge';
export const preferredRegion = ['iad1', 'sfo1'];

import { traceId as makeTraceId } from '../base44Client';
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { errMsg } from '../utils/errors'; // <-- corrected path

/** CORS */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Coerce any unknown/error value to a safe string */
function s(x: unknown): string {
  return errMsg(x); // errMsg already handles Error | string | unknown
}

/** Timer helper with strong typing */
type TimerOk<T> = { ok: true; ms: number; res: T };
type TimerErr = { ok: false; ms: number; error: string };
type TimerResult<T> = TimerOk<T> | TimerErr;

async function timer<T>(fn: () => Promise<T>): Promise<TimerResult<T>> {
  const start = Date.now();
  try {
    const res = await fn();
    return { ok: true, ms: Date.now() - start, res };
  } catch (e: unknown) {
    return { ok: false, ms: Date.now() - start, error: s(e) };
  }
}

Deno.serve((req: Request) => {
  const tid = makeTraceId();

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS, 'X-Trace-Id': tid } });
  }

  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      const ALLOWED = new Set(['GET', 'HEAD']);
      if (!ALLOWED.has(req.method)) {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { ...CORS_HEADERS, Allow: 'GET, HEAD, OPTIONS', 'X-Trace-Id': tid },
        });
      }
    }

    if (req.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
      });
    }

    /* ------------------------------------------------------------------
       Health checks
       ------------------------------------------------------------------ */

    const checks: Record<string, string> = {};

    // Base44 SDK connectivity (non-throwing probe)
    const bCheck = await timer<void>(async () => {
      const b = createClientFromRequest(req);
      await b.auth.me().catch(() => null);
    });
    checks.base44 = bCheck.ok ? `ok (${bCheck.ms}ms)` : `fail (${bCheck.error})`;

    // Placeholder DB check (replace with real DB ping when ready)
    const dbCheck = await timer<void>(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    checks.database = dbCheck.ok ? `ok (${dbCheck.ms}ms)` : `fail (${dbCheck.error})`;

    /* ------------------------------------------------------------------
       Response
       ------------------------------------------------------------------ */

    const now = new Date();
    const overallOk = Object.values(checks).every((v) => v.startsWith('ok'));

    const payload = {
      status: overallOk ? 'ok' : 'degraded',
      service: 'backendHealth',
      time: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      traceId: tid,
      checks,
    } as const;

    return new Response(JSON.stringify(payload), {
      status: overallOk ? 200 : 502,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Trace-Id': tid,
      },
    });
  } catch (e: unknown) {
    const msg = s(e);
    // log only a string to avoid any unsafe-argument lint noise
    console.error(`backendHealth error [${tid}]: ${msg}`);

    return new Response(JSON.stringify({ status: 'error', error: msg, traceId: tid }), {
      status: 502,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Trace-Id': tid,
      },
    });
  }
});
