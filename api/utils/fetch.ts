// api/utils/fetch.ts
type JsonOk<T> = { ok: true; data: T; status: number; headers: Headers };
type JsonErr = { ok: false; error: string; status: number; headers: Headers };
type JsonResult<T> = JsonOk<T> | JsonErr;

type FetchOpts = {
  /** If true, parse JSON and return a discriminated result */
  json?: true;
  /** Request init (method, headers, body, etc.) */
  init?: RequestInit;
};

type FetchOptsRaw = {
  /** If falsey or omitted, return the raw Response */
  json?: false;
  init?: RequestInit;
};

/**
 * Wrapper around fetch:
 * - If opts.json === true, returns a typed JSON result object.
 * - Otherwise, returns the raw Response.
 */
export async function httpFetch<T = unknown>(url: string, opts: FetchOpts): Promise<JsonResult<T>>;
export async function httpFetch(url: string, opts?: FetchOptsRaw): Promise<Response>;
export async function httpFetch<T = unknown>(
  url: string,
  opts?: FetchOpts | FetchOptsRaw
): Promise<JsonResult<T> | Response> {
  const init = opts?.init;

  const res = await fetch(url, init);

  if (opts?.json) {
    const headers = new Headers(res.headers);
    const status = res.status;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${status}`, status, headers };
    }

    // We expect JSON here; caller controls <T>
    // @ts-expect-error parse as unknown, caller picks T (API contracts vary by route)
    const data: T = await res.json().catch(() => ({} as unknown as T));
    return { ok: true, data, status, headers };
    //                               ^^^^^ no `any`
  }

  return res; // raw Response
}
