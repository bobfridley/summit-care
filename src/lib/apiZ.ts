import { z } from "zod";

type ReadSchema<T> = z.ZodType<T>;
type WriteSchema<T> = z.ZodType<T>;

type ApiZOptions<T, TCreate = unknown, TUpdate = unknown> = {
  /** e.g. "/api" */
  baseUrl: string;
  /** e.g. "medications" -> "/api/medications" */
  resource: string;
  /** Validate server responses (single & list). Required. */
  readSchema: ReadSchema<T>;
  /** Validate POST payload (client → server). Optional. */
  createSchema?: WriteSchema<TCreate>;
  /** Validate PUT payload (client → server). Optional. */
  updateSchema?: WriteSchema<TUpdate>;
  /** Optional fetch init defaults (headers, credentials, etc.) */
  fetchInit?: Omit<RequestInit, "method" | "body">;
};

type Id = string | number;

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function fetchJson<TResp>(
  url: string,
  init: RequestInit
): Promise<TResp> {
  const res = await fetch(url, init);
  if (!res.ok) {
    // try to surface server error payload if available
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw {
      status: res.status,
      statusText: res.statusText,
      detail,
      url,
    };
  }
  // 204/empty
  if (res.status === 204) return undefined as unknown as TResp;
  return (await res.json()) as TResp;
}

/**
 * Build a typed CRUD client with Zod validation on reads (and optionally writes).
 *
 * Example:
 *   const meds = apiZ<Medication, NewMedication, UpdateMedication>({
 *     baseUrl: "/api",
 *     resource: "medications",
 *     readSchema: MedicationSchema,
 *     createSchema: NewMedicationSchema,
 *     updateSchema: UpdateMedicationSchema,
 *   })
 */
export function apiZ<T, TCreate = unknown, TUpdate = unknown>(
  opts: ApiZOptions<T, TCreate, TUpdate>
) {
  const {
    baseUrl,
    resource,
    readSchema,
    createSchema,
    updateSchema,
    fetchInit,
  } = opts;

  const listSchema = z.array(readSchema);

  const base = joinUrl(baseUrl, resource);

  return {
  /**
   * GET collection or single record.
   * - get() -> T[]
   * - get(id) -> T
   * - get({ query }) -> T[] with query string (e.g., pagination, filters)
   */
    async get(
      arg?: Id | { id?: Id; query?: Record<string, string | number | boolean | undefined> }
    ): Promise<T | T[]> {
      let url = base;
      let expectList = true;

      if (typeof arg === "number" || typeof arg === "string") {
        url = joinUrl(base, String(arg));
        expectList = false;
      } else if (arg && typeof arg === "object") {
        const { id, query } = arg;
        if (id !== undefined) {
          url = joinUrl(base, String(id));
          expectList = false;
        }
        if (query) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(query)) {
            if (v !== undefined && v !== null) qs.set(k, String(v));
          }
          if ([...qs.keys()].length) url += `?${qs.toString()}`;
        }
      }

      const data = await fetchJson<unknown>(url, {
        method: "GET",
        ...(fetchInit ?? {}),
      });

      // Validate reads; return RAW data on success
      if (expectList) return z.array(readSchema).parse(data);
      return readSchema.parse(data);
    },

    /**
     * POST create -> returns created record (T)
     * Payload is validated client-side if createSchema is provided.
     */
    async post(body: TCreate): Promise<T> {
      if (createSchema) {
        body = createSchema.parse(body);
      }

      const data = await fetchJson<unknown>(base, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(fetchInit?.headers ?? {}) },
        body: JSON.stringify(body),
        ...fetchInit,
      });

      return readSchema.parse(data);
    },

    /**
     * PUT update -> returns updated record (T)
     * Payload is validated client-side if updateSchema is provided.
     */
    async put(id: Id, body: TUpdate): Promise<T> {
      if (updateSchema) {
        body = updateSchema.parse(body);
      }

      const url = joinUrl(base, String(id));
      const data = await fetchJson<unknown>(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(fetchInit?.headers ?? {}) },
        body: JSON.stringify(body),
        ...fetchInit,
      });

      return readSchema.parse(data);
    },

    /**
     * DELETE -> returns void (your API may return {} or 204; both are handled)
     */
    async delete(id: Id): Promise<void> {
      const url = joinUrl(base, String(id));
      await fetchJson<unknown>(url, {
        method: "DELETE",
        ...(fetchInit ?? {}),
      });
    },
  };
}