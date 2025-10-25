// api/functions/ae-trends.ts
export const runtime = 'edge';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const preferredRegion = ['iad1', 'sfo1'];

import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { z } from 'zod';

function traceId(): string {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const BodySchema = z
  .object({
    drug: z.string().min(1).optional(),
    window: z.enum(['7d', '30d', '90d', '1y']).optional(),
    start: z.string().optional(), // ISO date string
    end: z.string().optional(),
    limit: z.number().int().positive().max(1000).optional(),
  })
  .passthrough();

type UnknownPayload = unknown;

Deno.serve((req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const tid = traceId();

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { ...CORS_HEADERS, Allow: 'POST', 'X-Trace-Id': tid },
      });
    }

    // ✅ ensure we actually await something (and validate body)
    const raw = (await req.json().catch(() => ({}))) as unknown;
    const body = BodySchema.parse(raw);

    // Prefer service-role if available; otherwise request-bound client
    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');

    let payload: UnknownPayload;

    if (appId && serviceToken) {
      const svc = createClient({ appId, serviceToken });
      const result: unknown = await svc.asServiceRole.functions.invoke('getAeTrendsCached', body);
      payload =
        typeof result === 'object' &&
        result !== null &&
        'data' in (result as Record<string, unknown>)
          ? (result as Record<string, unknown>).data
          : result;
    } else {
      const b44 = createClientFromRequest(req);
      await b44.auth.me().catch(() => null); // soft probe
      const result: unknown = await b44.functions.invoke('getAeTrendsCached', body);
      payload =
        typeof result === 'object' &&
        result !== null &&
        'data' in (result as Record<string, unknown>)
          ? (result as Record<string, unknown>).data
          : result;
    }

    return Response.json(payload, {
      status: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
    });
  } catch (error) {
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error);

    return Response.json(
      { status: 'error', error: message, traceId: tid },
      { status: 500, headers: { ...CORS_HEADERS, 'X-Trace-Id': tid } }
    );
  }
});
