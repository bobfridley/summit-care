export const runtime = 'edge';
export const preferredRegion = ['iad1', 'sfo1'];

// --- CORS header block (auto-added) ---
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
// --- end CORS block ---

import { traceId as makeTraceId } from '../base44Client';

// --------- Handler ---------
Deno.serve((req: Request) => {
  const tid = makeTraceId();

  // ✅ CORS preflight handled WITHIN the request scope
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS, 'X-Trace-Id': tid } });
  }

  try {
    // (optional) restrict allowed methods for this endpoint
    // e.g., only POST for auth-me:
    // if (req.method !== 'POST') {
    //   return new Response('Method Not Allowed', {
    //     status: 405,
    //     headers: { ...CORS_HEADERS, Allow: 'POST', 'X-Trace-Id': tid },
    //   });
    // }

    // Example of using the Base44 client safely
    // import { getBase44Client } from '../base44Client';  // adjust relative path
    // const b44 = getBase44Client(req);
    // const me = await b44.auth.me();

    // TODO: implement the endpoint logic...
    const payload = { ok: true, traceId: tid }; // replace with real result

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Trace-Id': tid,
      },
    });
  } catch (e: unknown) {
    // Centralized safe error string (import from your utils)
    // import { errMsg } from '../utils/errors';
    const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

    // Log as a single string to avoid lint complaints
    console.error(`endpoint error [${tid}]: ${msg}`);

    return new Response(JSON.stringify({ status: 'error', error: msg, traceId: tid }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Trace-Id': tid,
      },
    });
  }
});

import { withCORS } from '../utils/cors';
import { sendJSON, handleError } from '../utils/errors';
import { okFetch } from '../utils/fetch';
import type { BackendHealth } from '../../backend/health';

export default withCORS(async (req) => {
  try {
    // Preflight / HEAD
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }

    if (req.method !== 'GET') {
      return sendJSON(
        405,
        { status: 'error', error: 'Method Not Allowed' },
        { Allow: 'GET, HEAD, OPTIONS' }
      );
    }

    // Build absolute URL to the backend-health endpoint on the same origin.
    // This avoids relying on Node's `process` in the Edge/Deno runtime.
    const origin = new URL(req.url).origin;
    const url = `${origin}/api/backend-health`;

    // Proxy the richer backend health payload
    const payload = await okFetch<BackendHealth>(url, { json: true });

    // Pass through status based on payload.status for better monitoring
    const status = payload.status === 'ok' ? 200 : 502;
    return sendJSON(status, payload);
  } catch (err) {
    return handleError(err);
  }
});
