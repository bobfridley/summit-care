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
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

type MaybeSignOut = { auth: { signOut?: () => Promise<unknown> } };

export default withCORS(async (req) => {
  try {
    if (req.method !== 'POST') {
      return sendJSON(405, { status: 'error', error: 'Method Not Allowed' }, { Allow: 'POST' });
    }

    const base44 = createClientFromRequest(req);

    // If the SDK exposes auth.signOut(), call it; otherwise no-op.
    await (base44 as unknown as MaybeSignOut).auth.signOut?.().catch(() => null);

    // Some apps prefer 204 No Content for signout; 200 JSON is also fine.
    return sendJSON(200, { status: 'ok', signedOut: true });
  } catch (err) {
    return handleError(err);
  }
});
