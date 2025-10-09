/*// Simple health check for Base44
// - Verifies OPENFDA_API_KEY is present
// - Tries a lightweight DB upsert/read on ae_trends_cache (optional)

export default async function health() {
  const hasKey = !!process.env.OPENFDA_API_KEY;

  const payload: Record<string, any> = {
    ok: true,
    hasKey,
    timestamp: new Date().toISOString(),
  };

  // Optional DB check (safe to keep — it’s wrapped in try/catch)
  try {
    const id = `health:${Date.now()}`;
    await db.upsert("ae_trends_cache", {
      id,
      drug_query: "PING",
      start_date: "20240101",
      end_date: "20240101",
      country: null,
      serious: null,
      top_n: 0,
      top_reactions: [],
      timeseries: [],
      fetched_at: new Date().toISOString(),
    });
    const rows = await db.select("ae_trends_cache", { id__in: [id] });
    payload.db = rows?.length === 1 ? "ok" : "missing";
  } catch (e: any) {
    payload.db = "error";
    payload.db_error = String(e?.message ?? e).slice(0, 200);
  }

  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
  });
}*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Optional auth check (doesn't block public health checks)
    await base44.auth.me().catch(() => null);

    const now = new Date();
    return Response.json({
      status: "ok",
      service: "backendHealth",
      time: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000)
    });
  } catch (error) {
    return Response.json({ status: "error", error: error.message }, { status: 500 });
  }
});