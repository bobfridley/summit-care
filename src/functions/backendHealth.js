import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

// simple timer
function timer(fn) {
  const start = Date.now();
  return fn()
    .then((res) => ({ ok: true, ms: Date.now() - start, res }))
    .catch((e) => ({ ok: false, ms: Date.now() - start, error: e?.message || String(e) }));
}

Deno.serve(async (req) => {
  const tid = traceId();

  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { 'Allow': 'GET, HEAD, OPTIONS' },
      });
    }
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { 'X-Trace-Id': tid } });
    }
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store', 'X-Trace-Id': tid } });
    }

    /* ------------------------------------------------------------------
       Health checks
       ------------------------------------------------------------------ */

    const checks = {};

    // ✅ Base44 SDK connectivity
    const bCheck = await timer(async () => {
      const b = createClientFromRequest(req);
      await b.auth.me().catch(() => null); // safe probe
    });
    checks.base44 = bCheck.ok ? `ok (${bCheck.ms}ms)` : `fail (${bCheck.error})`;

    // 🧩 Placeholder for future database check
    // When your DB is ready, replace this with an actual connection test.
    const dbCheck = await timer(async () => {
      // Example (pseudo):
      // const conn = await myDb.connect();
      // await conn.query('SELECT 1');
      // conn.close();
      await new Promise((r) => setTimeout(r, 20)); // placeholder
    });
    checks.database = dbCheck.ok ? `ok (${dbCheck.ms}ms)` : `fail (${dbCheck.error})`;

    // more checks can be added here (cache, external API, etc.)

    /* ------------------------------------------------------------------
       Response
       ------------------------------------------------------------------ */

    const now = new Date();
    const overallOk = Object.values(checks).every((v) => v.startsWith('ok'));

    const payload = {
      status: overallOk ? 'ok' : 'degraded',
      service: 'backendHealth',
      time: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      traceId: tid,
      checks,
    };

    return Response.json(payload, {
      status: overallOk ? 200 : 502,
      headers: { 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
    });
  } catch (error) {
    const message =
      error?.response?.data?.message ??
      error?.response?.data ??
      error?.message ??
      String(error);

    console.error('backendHealth error', { tid, message });
    return Response.json(
      { status: 'error', error: message, traceId: tid },
      { status: 502 }
    );
  }
});
