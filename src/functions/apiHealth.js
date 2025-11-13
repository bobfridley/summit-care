import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.7.1';

/** Build a small trace id for cross-referencing logs */
function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

Deno.serve(async (req) => {
  const tid = traceId();

  try {
    if (req.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { 'Allow': 'GET' },
      });
    }

    // Prefer service-role if available; otherwise try request-bound client
    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');

    let payload;

    if (appId && serviceToken) {
      // ✅ Service-role path (recommended)
      const svc = createClient({ appId, serviceToken });
      const result = await svc.asServiceRole.functions.invoke('backendHealth', {});
      payload = result?.data ?? result;
    } else {
      // ➜ Non-service path (requires a logged-in user/session)
      const base44 = createClientFromRequest(req);
      // Public endpoint: try to identify user, but don't require it
      await base44.auth.me().catch(() => null);
      const result = await base44.functions.invoke('backendHealth', {});
      payload = result?.data ?? result;
    }

    return Response.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
    });
  } catch (error) {
    // Surface the most useful error details
    const status = error?.response?.status ?? 500;
    const data = error?.response?.data ?? null;
    const message =
      (typeof data === 'string' ? data : data?.message) ??
      error?.message ??
      String(error);

    console.error('apiHealth error', { tid, status, message, data });

    return Response.json(
      {
        status: 'error',
        error: message,
        statusCode: status,
        traceId: tid,
        hint:
          'If this endpoint should work without a logged-in user, set BASE44_APP_ID and BASE44_SERVICE_TOKEN in the Base44 function environment.',
      },
      { status: 502 }
    );
  }
});
