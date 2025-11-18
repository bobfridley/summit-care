// src/api/functions.js
// Tiny client for your local dev API

// @ts-check

const API = import.meta.env.VITE_API_BASE || ""; // "" => same-origin during prod/preview
// TEMP DEBUG
console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE, "=> API =", API);
// If you always want explicit host in dev, keep API as "http://localhost:3000"

// ---------- Error types ----------

/**
 * Generic API error with extra metadata.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, url?: string, context?: string, cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    /** @type {number | undefined} */
    this.status = options.status;
    /** @type {string | undefined} */
    this.url = options.url;
    /** @type {string | undefined} */
    this.context = options.context;
    // @ts-ignore
    this.cause = options.cause;
  }
}

/**
 * Timeout error for fetch calls.
 */
export class TimeoutError extends Error {
  /**
   * @param {string} message
   * @param {{ url?: string, timeoutMs?: number, context?: string }} [options]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = "TimeoutError";
    /** @type {string | undefined} */
    this.url = options.url;
    /** @type {number | undefined} */
    this.timeoutMs = options.timeoutMs;
    /** @type {string | undefined} */
    this.context = options.context;
  }
}

// ---------- Internal helpers ----------

/**
 * Sleep helper (ms).
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout + retry + basic backoff.
 *
 * - Retries on:
 *   - network errors
 *   - Abort (timeout)
 *   - HTTP 5xx responses
 *
 * @param {string} url
 * @param {RequestInit} init
 * @param {{ timeoutMs?: number, retries?: number, retryDelayMs?: number, context?: string }} [options]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeoutAndRetry(url, init, options = {}) {
  const {
    timeoutMs = 30000,
    retries = 2,
    retryDelayMs = 500,
    context,
  } = options;

  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timerId);

            // Retry on 5xx
      if (res.status >= 500 && res.status <= 599 && attempt < retries) {
        attempt += 1;
        await delay(retryDelayMs * attempt);
        continue;
      }

      if (!res.ok) {
        let errorBody = null;
        let message = `Request failed with status ${res.status}`;

        try {
          const text = await res.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              errorBody = json;
              if (json && typeof json.error === "string") {
                message = json.error;
              }
            } catch {
              // not JSON, keep as text
              errorBody = { raw: text };
            }
          }
        } catch {
          // ignore body parsing errors
        }

        throw new ApiError(message, {
          status: res.status,
          url,
          context,
          cause: errorBody,
        });
      }

      return res;

    } catch (err) {
      clearTimeout(timerId);

      // Timeout
      if (err && typeof err === "object" && /** @type any */ (err).name === "AbortError") {
        if (attempt < retries) {
          attempt += 1;
          await delay(retryDelayMs * attempt);
          continue;
        }
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms`, {
          url,
          timeoutMs,
          context,
        });
      }

      // Network or other errors
      if (attempt < retries) {
        attempt += 1;
        await delay(retryDelayMs * attempt);
        continue;
      }

      if (err instanceof ApiError || err instanceof TimeoutError) {
        err.context = context;
        throw err;
      }

      throw new ApiError(
        err instanceof Error ? err.message : "Unknown fetch error",
        { url, context, cause: err }
      );
    }
  }
}

/**
 * Attach/augment context on an error and rethrow.
 *
 * @param {unknown} err
 * @param {string} context
 * @returns {never}
 */
function rethrowWithContext(err, context) {
  if (err instanceof ApiError || err instanceof TimeoutError) {
    err.context = context;
    throw err;
  }
  throw new ApiError(
    err instanceof Error ? err.message : "Unknown error",
    { context, cause: err }
  );
}

/**
 * JSON fetch helper using API base, timeout, retries, and unified error handling.
 *
 * Returns `{ data, status }` like your original version.
 *
 * @param {string} path
 * @param {{ method?: string, body?: any, headers?: Record<string,string> }} [options]
 * @returns {Promise<{ data: any, status: number }>}
 */
async function jfetch(path, { method = "GET", body, headers } = {}) {
  const url = `${API}${path}`;

  try {
    const res = await fetchWithTimeoutAndRetry(
      url,
      {
        method,
        headers: { "Content-Type": "application/json", ...(headers || {}) },
        body: body
          ? typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
        credentials: "include",
      },
      {
        timeoutMs: 30000,
        retries: 2,
        retryDelayMs: 500,
        context: `jfetch ${path}`,
      }
    );

    const text = await res.text().catch(() => "");
    const data = text ? JSON.parse(text) : null;

    return { data, status: res.status };
  } catch (err) {
    rethrowWithContext(err, `jfetch ${path}`);
  }
}

// ---- Medications
export function mysqlMedications({ action, ...payload }) {
  if (action === "list")   return jfetch("/api/medications", { method: "GET" });
  if (action === "create") return jfetch("/api/medications", { method: "POST", body: payload });
  if (action === "update") return jfetch(`/api/medications/${payload.id}`, { method: "PUT", body: payload });
  if (action === "delete") return jfetch(`/api/medications/${payload.id}`, { method: "DELETE" });
  throw new Error(`Unknown action for mysqlMedications: ${action}`);
}

// Generic helper for climbs CRUD, used by My Climbs page
export async function mysqlClimbs(params = {}) {
  const {
    action,
    id,
    order,
    dir,
    limit,
    include_gear, // currently ignored, but kept for future
    ...rest
  } = params;

  // LIST
  if (action === "list") {
    const qs = new URLSearchParams();
    if (order) qs.set("order", order);
    if (dir) qs.set("dir", dir);
    if (limit) qs.set("limit", String(limit));

    const query = qs.toString();
    return jfetch(`/api/climbs${query ? `?${query}` : ""}`);
  }

  // CREATE
  if (action === "create") {
    return jfetch("/api/climbs", {
      method: "POST",
      body: rest,
    });
  }

  // UPDATE
  if (action === "update") {
    if (!id) throw new Error("mysqlClimbs: update requires id");
    return jfetch(`/api/climbs/${id}`, {
      method: "PATCH",
      body: rest,
    });
  }

  // DELETE
  if (action === "delete") {
    if (!id) throw new Error("mysqlClimbs: delete requires id");
    return jfetch(`/api/climbs/${id}`, {
      method: "DELETE",
    });
  }

  throw new Error(`mysqlClimbs: unknown action "${String(action)}"`);
}

// ---- Medication DB (optional)
export function mysqlMedicationDatabase({ q = "", limit = 25 } = {}) {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  return jfetch(`/api/medication-db?${qs.toString()}`, { method: "GET" });
}

// ---- Medication info enrichment (optional)
export function getMedicationInfo({ medicationName = "" } = {}) {
  const qs = new URLSearchParams({ name: medicationName });
  return jfetch(`/api/medication-info?${qs.toString()}`, { method: "GET" });
}

// ---- Gear helpers
export function listGear(climbId) {
  if (!climbId) throw new Error("listGear: climbId is required");
  return jfetch(`/api/climbs/${encodeURIComponent(climbId)}/gear`, {
    method: "GET",
  });
}

export function createGear(climbId, item) {
  if (!climbId) throw new Error("createGear: climbId is required");
  return jfetch(`/api/climbs/${encodeURIComponent(climbId)}/gear`, {
    method: "POST",
    body: item || {},
  });
}

export function updateGear(climbId, id, patch) {
  if (!climbId || !id) {
    throw new Error("updateGear: climbId and id are required");
  }
  return jfetch(
    `/api/climbs/${encodeURIComponent(climbId)}/gear/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: patch || {},
    },
  );
}

export async function deleteGear(climbId, id) {
  if (!climbId || !id) {
    throw new Error("deleteGear: climbId and id are required");
  }
  await jfetch(
    `/api/climbs/${encodeURIComponent(climbId)}/gear/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
  return { ok: true };
}

export function togglePacked(climbId, id, packed) {
  return updateGear(climbId, id, { packed: !!packed });
}

// --- AI chat ---

/**
 * Call the OpenAI-backed chat route with robust timeout/retry handling.
 *
 * @param {{
 *   messages: Array<{role:"system"|"user"|"assistant", content:string}>,
 *   model?: string,
 *   stream?: boolean,
 *   temperature?: number,
 *   max_tokens?: number,
 *   system?: string,
 * }} payload
 * @returns {Promise<any>} server response JSON
 */
export async function openaiChat(payload) {
  const url = `${API}/api/openai/chat`;

  try {
    const res = await fetchWithTimeoutAndRetry(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      {
        timeoutMs: 45000,
        retries: 2,
        retryDelayMs: 600,
        context: "openaiChat",
      }
    );

    return res.json();
  } catch (err) {
    rethrowWithContext(err, "openaiChat");
  }
}
