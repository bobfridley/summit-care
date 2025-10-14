import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export default withCORS(async (req, res) => {
  const tid = traceId();
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      throw new HttpError(405, "Use GET");
    }

    // Always proxy to the richer backend-health handler
    const r = await fetch(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/backend-health`, {
      method: "GET",
      headers: { "x-internal-health-proxy": "1" },
    }).catch(() => null);

    if (r && r.ok) {
      const data = await r.json();
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, data);
      return;
    }

    // ultra-minimal last-resort
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Trace-Id", tid);
    sendJSON(res, 200, { status: "ok", service: "api", mode: "fallback", at: new Date().toISOString() });
  } catch (err) {
    res.setHeader("X-Trace-Id", tid);
    handleError(res, err);
  }
});
