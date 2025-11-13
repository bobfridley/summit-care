// src/hooks/useAgent.js
// @ts-check

import { useCallback, useState } from "react";
import { ApiError, TimeoutError } from "../api/functions";
import { logClientError } from "../lib/logError";

/**
 * Generic hook for calling an async "agent-like" function with retry & logging.
 *
 * @template TPayload
 * @template TResult
 *
 * @param {(payload: TPayload) => Promise<TResult>} agentFn
 * @param {string} [name] optional logical name for logging (e.g. "mountaineering-agent")
 */
export function useAgent(agentFn, name) {
  // @ts-ignore - generic initial state
  const [data, setData] = useState(null);
  // @ts-ignore
  const [loading, setLoading] = useState(false);
  // @ts-ignore
  const [error, setError] = useState(null);
  // @ts-ignore
  const [lastPayload, setLastPayload] = useState(null);

  const label = name || agentFn.name || "anonymous-agent";

  /**
   * Run the agent with the given payload.
   *
   * @param {TPayload} payload
   * @returns {Promise<TResult>}
   */
  const run = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      // @ts-ignore
      setLastPayload(payload);

      try {
        const result = await agentFn(payload);
        setData(result);
        return result;
      } catch (err) {
        let normalizedError;

        if (err instanceof ApiError || err instanceof TimeoutError || err instanceof Error) {
          normalizedError = err;
        } else {
          normalizedError = new ApiError("Unknown error in useAgent", {
            context: label,
            cause: err,
          });
        }

        // Save to state so UI can render it
        // @ts-ignore
        setError(normalizedError);

        // Fire-and-forget logging
        logClientError(normalizedError, { agent: label, payload }).catch(() => {});

        throw normalizedError;
      } finally {
        setLoading(false);
      }
    },
    [agentFn, label]
  );

  /**
   * Retry using the last payload (if any).
   *
   * @returns {Promise<TResult>}
   */
  const retry = useCallback(async () => {
    if (lastPayload == null) {
      throw new Error(`useAgent(${label}): no lastPayload to retry`);
    }
    // @ts-ignore
    return run(lastPayload);
  }, [lastPayload, run, label]);

  return { run, retry, data, loading, error, lastPayload };
}
