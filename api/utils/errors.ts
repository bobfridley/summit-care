// api/utils/errors.ts
export class HttpError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export function errMsg(e: unknown): string {
  return typeof e === 'object' && e && 'message' in e
    ? String((e as { message?: unknown }).message)
    : String(e);
}

function mergeHeaders(
  base: HeadersInit | undefined,
  extra: Record<string, string>
): Headers {
  const h = new Headers(base);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

export function sendJSON(
  status: number,
  payload: unknown,
  extraHeaders: Record<string, string> = {}
): Response {
  const headers = mergeHeaders(
    { 'content-type': 'application/json' },
    extraHeaders
  );
  return new Response(JSON.stringify(payload), { status, headers });
}

export function handleError(e: unknown, extraHeaders: Record<string, string> = {}): Response {
  if (e instanceof HttpError) {
    return sendJSON(
      e.status,
      { error: e.message, detail: e.detail ?? null },
      extraHeaders
    );
  }
  const msg = errMsg(e);
  return sendJSON(500, { error: msg }, extraHeaders);
}
