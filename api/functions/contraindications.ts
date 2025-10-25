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

import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { z } from 'zod';

/** Request body schema (tune to your real inputs) */
const BodySchema = z
  .object({
    patientId: z.string().min(1).optional(),
    meds: z.array(z.string().min(1)).optional(),
    includeWarnings: z.boolean().optional(),
    // allow extra keys without making them `any`
  })
  .passthrough();

/** If/when you know the exact response type, define it and swap in below */
type ContraPayload = unknown;

Deno.serve((req: Request) => {
  const tid = makeTraceId();

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST', 'X-Trace-Id': tid },
      });
    }

    // Parse & validate body without using `any`
    const raw = (await req.json().catch(() => ({}))) as unknown;
    const body = BodySchema.parse(raw);

    // Prefer service role if credentials exist; otherwise use request-bound client
    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');

    let payload: ContraPayload;

    if (appId && serviceToken) {
      const svc = createClient({ appId, serviceToken });
      const result: unknown = await svc.asServiceRole.functions.invoke(
        'getContraindicationsCached',
        body
      );

      // unwrap `{ data }` shape if present, without `any`
      payload =
        typeof result === 'object' &&
        result !== null &&
        'data' in (result as Record<string, unknown>)
          ? (result as Record<string, unknown>).data
          : result;
    } else {
      const b44 = createClientFromRequest(req);
      // Probe auth (non-fatal for public-friendly endpoint)
      await b44.auth.me().catch(() => null);

      const result: unknown = await b44.functions.invoke('getContraindicationsCached', body);

      payload =
        typeof result === 'object' &&
        result !== null &&
        'data' in (result as Record<string, unknown>)
          ? (result as Record<string, unknown>).data
          : result;
    }

    return Response.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
    });
  } catch (error: unknown) {
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error);

    return Response.json(
      {
        status: 'error',
        error: message,
        traceId: tid,
        hint: 'If this endpoint should work without a logged-in user, set BASE44_APP_ID and BASE44_SERVICE_TOKEN in the environment.',
      },
      { status: 500, headers: { 'X-Trace-Id': tid } }
    );
  }
});
