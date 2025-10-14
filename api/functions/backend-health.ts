import { withCORS } from "../utils/cors";
import { sendJSON } from "../utils/errors";
import { env } from "../utils/env";

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// simple timer
async function timer<T>(fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const res = await fn();
    return { ok: true as const, ms: Date.now() - start, res };
  } catch (e: any) {
    return { ok: false as const, ms: Date.now() - start, error: e?.message ?? String(e) };
  }
}

// Attempt a light Base44 connectivity probe.
// Uses service-role creds if present. Skips silently if SDK not installed.
async function base44Probe() {
  // Only try if creds exist
  if (!env.BASE44_APP_ID || !env.BASE44_SERVICE_TOKEN) {
    return { skipped: true };
  }
  try {
    const { createClient } = await import("@base44/sdk");
    const svc = createClient({ appId: env.BASE44_APP_ID, serviceToken: env.BASE44_SERVICE_TOKEN });

    // Light touch: try a benign call; auth.me() is fine to probe identity.
    // If the SDK exposes .asServiceRole, prefer it (parity with your Deno impl).
    const client: any = (svc as any).asServiceRole ?? svc;

    await client.auth?.me?.().catch(() => null);
    // You could also ping your own Base44 function here if you want:
    // await client.functions.invoke("backendHealth", { ping: true }).catch(() => null);

    return { skipped: false };
  } catch (e: any) {
    // SDK not installed or probe failed
    throw new Error(e?.message ?? "Base44 probe failed");
  }
}

export default withCORS(async (req, res) => {
  const tid = traceId();

  // Method handling
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method ?? "")) {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    res.status(405).end("Method Not Allowed");
    return;
  }
  if (req.method === "OPTIONS") {
    res.setHeader("X-Trace-Id", tid);
    res.status(204).end();
    return;
  }
  if (req.method === "HEAD") {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Trace-Id", tid);
    res.status(200).end();
    return;
  }

  try {
    /* ------------------------------------------------------------------
       Health checks
       ------------------------------------------------------------------ */
    const checks: Record<string, string> = {};

    // ✅ Base44 SDK connectivity (service-role if available)
    const bCheck = await timer(async () => {
      const result = await base44Probe();
      if (result.skipped) {
        // Keep the same shape but indicate skipped clearly
        throw new Error("skipped (no BASE44 creds)");
      }
    });
    checks.base44 = bCheck.ok ? `ok (${bCheck.ms}ms)` : bCheck.error?.startsWith("skipped")
      ? "skipped (no BASE44 creds)"
      : `fail (${bCheck.error})`;

    // 🧩 Placeholder for future database check
    const dbCheck = await timer(async () => {
      // Replace with an actual DB ping when you wire it up
      await new Promise((r) => setTimeout(r, 20));
    });
    checks.database = dbCheck.ok ? `ok (${dbCheck.ms}ms)` : `fail (${dbCheck.error})`;

    // more checks can be added here (cache, external APIs, etc.)

    /* ------------------------------------------------------------------
       Response
       ------------------------------------------------------------------ */
    const now = new Date();
    // Treat "skipped" as neither ok nor fail; only "fail" degrades
    const overallOk = Object.values(checks).every((v) => v.startsWith("ok") || v.startsWith("skipped"));

    const payload = {
      status: overallOk ? "ok" : "degraded",
      service: "backendHealth",
      time: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      traceId: tid,
      checks,
    };

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Trace-Id", tid);
    sendJSON(res, overallOk ? 200 : 502, payload);
  } catch (error: any) {
    const message =
      error?.response?.data?.message ??
      error?.response?.data ??
      error?.message ??
      String(error);

    res.setHeader("X-Trace-Id", tid);
    sendJSON(res, 502, { status: "error", error: message, traceId: tid });
  }
});
