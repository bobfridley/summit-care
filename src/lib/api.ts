// src/lib/api.ts
/* eslint-env browser */
import type { ZodType, ZodTypeAny } from 'zod';

/** ──────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */
type Primitive = string | number | boolean | Date | null | undefined;

export type QueryPrimitive = string | number | boolean | Date;
export type QueryValue = QueryPrimitive | ReadonlyArray<QueryPrimitive>;

// Helper to detect Zod schema-ish objects
function isZodSchema(x: unknown): x is ZodTypeAny {
  return !!x && typeof x === 'object' && typeof (x as any).parse === 'function';
}

export interface ApiOptions {
  /** Query string params (strict primitives or arrays thereof) */
  params?: Readonly<Record<string, QueryValue>>;
  /** JSON body (will be JSON.stringified) */
  json?: unknown;
  /** Extra headers to merge */
  headers?: Readonly<Record<string, string>>;
  /** Abort support */
  signal?: AbortSignal;
}

/** ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */
function encodePrimitive(v: QueryPrimitive): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function toSearchParams(params?: Readonly<Record<string, QueryValue>>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      for (const item of raw as ReadonlyArray<QueryPrimitive>) {
        sp.append(k, encodePrimitive(item));
      }
    } else {
      const v = raw as QueryPrimitive;
      sp.set(k, encodePrimitive(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function baseHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const token = hasDevToken();
  if (token) h['x-dev-auth'] = token;
  return h;
}

export function hasDevToken(): string | null {
  try {
    // Works in browser (has localStorage) and no-DOM server (no localStorage)
    const g = globalThis as unknown as { localStorage?: { getItem?: (k: string) => string | null } };
    const getItem = g?.localStorage?.getItem;
    if (typeof getItem !== 'function') return null;
    return getItem('dev-auth-token');
  } catch {
    return null;
  }
}

/** Core fetcher used by the verbs */
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  opts: ApiOptions = {}
): Promise<T> {
  const { params, json, headers, signal } = opts;

  const fullUrl = `${url}${toSearchParams(params)}`;
  const finalHeaders: Record<string, string> = { ...baseHeaders(), ...(headers ?? {}) };
  const init: RequestInit = { method, headers: finalHeaders, signal };

  if (json !== undefined) {
    finalHeaders['content-type'] = finalHeaders['content-type'] ?? 'application/json';
    init.body = JSON.stringify(json);
  }

  const res = await fetch(fullUrl, init);
  const ctype = res.headers.get('content-type') ?? '';
  const isJson = ctype.includes('application/json');

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = isJson ? await res.json() : await res.text();
    } catch {
      detail = undefined;
    }
    const msg =
      typeof detail === 'string'
        ? detail
        : (detail && typeof detail === 'object' && 'error' in detail && typeof (detail as any).error === 'string')
          ? (detail as any).error
          : `HTTP ${res.status}`;

    throw Object.assign(new Error(msg), { status: res.status, detail });
  }

  if (res.status === 204) return undefined as unknown as T;
  if (isJson) return (await res.json()) as unknown as T;
  return (await res.text()) as unknown as T;
}

/** ──────────────────────────────────────────────────────────────────────────
 * Public API (unvalidated)
 * ────────────────────────────────────────────────────────────────────────── */
export const api = {
  get<T = unknown>(url: string, opts?: ApiOptions) {
    return request<T>('GET', url, opts);
  },
  post<T = unknown>(url: string, opts?: ApiOptions) {
    return request<T>('POST', url, opts);
  },
  put<T = unknown>(url: string, opts?: ApiOptions) {
    return request<T>('PUT', url, opts);
  },
  delete<T = unknown>(url: string, opts?: ApiOptions) {
    return request<T>('DELETE', url, opts);
  },
};

/** ──────────────────────────────────────────────────────────────────────────
 * Zod-validated variants
 * Call with a schema and get a fully-typed, parsed result.
 * ────────────────────────────────────────────────────────────────────────── */
async function parseWith<T>(data: unknown, schema: ZodType<T> | ZodTypeAny): Promise<T> {
  return schema.parse(data) as T;
}

/** Accept BOTH orders:
 *   1) get(url, schema, opts?)
 *   2) get(url, opts, schema)
 */
async function getImpl<T>(
  url: string,
  a?: ApiOptions | ZodTypeAny,
  b?: ApiOptions | ZodTypeAny
): Promise<T> {
  let schema: ZodTypeAny | undefined;
  let opts: ApiOptions | undefined;

  if (isZodSchema(a)) {
    schema = a;
    opts = (b as ApiOptions | undefined);
  } else if (isZodSchema(b)) {
    schema = b;
    opts = (a);
  } else {
    throw new Error('apiZ.get: a Zod schema is required as either the 2nd or 3rd argument');
  }
  const data = await api.get<unknown>(url, opts);
  return schema.parse(data) as T;
}

export const apiZ = {
  get: getImpl, // <-- named generic impl assigned here
  async post<T>(url: string, schema: ZodType<T> | ZodTypeAny, opts?: ApiOptions): Promise<T> {
    const data = await api.post<unknown>(url, opts);
    return parseWith<T>(data, schema);
  },
  async put<T>(url: string, schema: ZodType<T> | ZodTypeAny, opts?: ApiOptions): Promise<T> {
    const data = await api.put<unknown>(url, opts);
    return parseWith<T>(data, schema);
  },
  async delete<T>(url: string, schema: ZodType<T> | ZodTypeAny, opts?: ApiOptions): Promise<T> {
    const data = await api.delete<unknown>(url, opts);
    return parseWith<T>(data, schema);
  },
};