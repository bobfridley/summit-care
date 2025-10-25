// api/functions/openai-chat.ts
export const runtime = 'edge';
export const preferredRegion = ['iad1', 'sfo1'];

import { env } from '../utils/env';

/** CORS headers */
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type EdgeHandler = (req: Request) => Promise<Response>;

function withCORS(handler: EdgeHandler): EdgeHandler {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    const res = await handler(req);
    const h = new Headers(res.headers);
    for (const [k, v] of Object.entries(CORS)) h.set(k, v);
    return new Response(res.body, { status: res.status, headers: h });
  };
}

function makeTraceId(): string {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

Deno.serve(
  withCORS(async (req: Request) => {
    const tid = makeTraceId();

    const ALLOWED = new Set(['POST', 'HEAD']);
    if (!ALLOWED.has(req.method)) {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { ...CORS, Allow: 'POST, HEAD' },
      });
    }
    if (req.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: { ...CORS, 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
      });
    }

    try {
      const apiKey = env('OPENAI_API_KEY');
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY', traceId: tid }), {
          status: 500,
          headers: { 'content-type': 'application/json', 'X-Trace-Id': tid },
        });
      }

      const rawBody: unknown = await req.json().catch(() => ({}));
      const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as {
        prompt?: unknown;
        model?: unknown;
        messages?: unknown;
      };

      const model = typeof body.model === 'string' ? body.model : 'gpt-4o-mini';

      // Normalize prompt to a safe string (fixes no-base-to-string)
      const prompt =
        typeof body.prompt === 'string'
          ? body.prompt
          : 'Hello! (No prompt provided — this is a default message.)';

      const messages = Array.isArray(body.messages)
        ? (body.messages as Array<{ role: string; content: string }>)
        : [{ role: 'user', content: prompt }];

      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages }),
      });

      if (!upstream.ok) {
        const errText = await upstream.text().catch(() => '');
        return new Response(
          JSON.stringify({
            error: `OpenAI upstream ${upstream.status} ${upstream.statusText}`,
            detail: errText,
            traceId: tid,
          }),
          {
            status: 502,
            headers: { 'content-type': 'application/json', 'X-Trace-Id': tid },
          }
        );
      }

      const data = await upstream.json();
      return new Response(JSON.stringify({ traceId: tid, ...data }), {
        status: 200,
        headers: {
          ...CORS,
          'content-type': 'application/json',
          'cache-control': 'no-store',
          'X-Trace-Id': tid,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`openai-chat error [${tid}]: ${msg}`);
      return new Response(JSON.stringify({ error: msg, traceId: tid }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'X-Trace-Id': tid },
      });
    }
  })
);
