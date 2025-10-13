import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.7.1';

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

Deno.serve(async (req) => {
  const tid = traceId();

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }

    const body = await req.json().catch(() => ({}));

    // Prefer service-role if env vars are present; otherwise try request-bound client
    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');

    let payload;

    if (appId && serviceToken) {
      // ✅ Service-role path (works without a logged-in user)
      const svc = createClient({ appId, serviceToken });
      const result = await svc.asServiceRole.functions.invoke('getAeTrendsCached', body);
      payload = result?.data ?? result;
    } else {
      // ➜ Non-service path (requires logged-in user/session on the incoming request)
      const base44 = createClientFromRequest(req);
      // Public-friendly: probe auth but don't hard fail
      await base44.auth.me().catch(() => null);
      const result = await base44.functions.invoke('getAeTrendsCached', body);
      payload = result?.data ?? result;
    }

    return Response.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Trace-Id': tid },
    });
  } catch (error) {
