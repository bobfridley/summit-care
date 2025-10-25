export type EdgeHandler = (req: Request) => Promise<Response> | Response;

const g = globalThis as unknown as {
  Deno?: { env?: { get?: (k: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

const ALLOW_ORIGIN = g?.Deno?.env?.get?.('CORS_ALLOW_ORIGIN') ?? g?.process?.env?.CORS_ALLOW_ORIGIN ?? '*';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function mergeHeaders(base: HeadersInit | undefined, extra: Record<string, string>) {
  const h = new Headers(base);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

export function withCORS(handler: EdgeHandler): EdgeHandler {
  return async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const res = await handler(req);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: mergeHeaders(res.headers, CORS_HEADERS),
    });
  };
}
