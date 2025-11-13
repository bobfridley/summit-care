// src/lib/logError.js
// @ts-check

import { ApiError, TimeoutError } from "../api/functions";

/**
 * Convert an error to a serializable object.
 *
 * @param {unknown} err
 * @returns {Record<string, any>}
 */
function serializeError(err) {
  if (!err) return { message: "Unknown error", type: "Unknown" };

  if (err instanceof ApiError) {
    return {
      type: "ApiError",
      name: err.name,
      message: err.message,
      status: err.status,
      url: err.url,
      context: err.context,
      stack: err.stack,
    };
  }

  if (err instanceof TimeoutError) {
    return {
      type: "TimeoutError",
      name: err.name,
      message: err.message,
      url: err.url,
      timeoutMs: err.timeoutMs,
      context: err.context,
      stack: err.stack,
    };
  }

  if (err instanceof Error) {
    return {
      type: "Error",
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    type: "NonError",
    value: String(err),
  };
}

/**
 * Best-effort client error logger.
 *
 * @param {unknown} error
 * @param {Record<string, any>} [extra]
 * @returns {Promise<void>}
 */
export async function logClientError(error, extra = {}) {
  const payload = {
    error: serializeError(error),
    extra,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // ok for unload scenarios
    });
  } catch {
    // Swallow logging errors – logging should never break the UI
  }
}
