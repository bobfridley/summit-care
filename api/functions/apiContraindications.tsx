// Base44 function (Deno runtime) — JavaScript version
import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.7.1';

/** @param {Request} req */
async function getBase44Client(req) {
  // Try request-bound auth first (logged-in user)
  const reqClient = createClientFromRequest(req);
  const authed = await reqClient.auth.me().then(() => true).catch(() => false);
  if (authed) return reqClient;

  // Fallback to service-role using env vars (set these in Base44 env)
  const appId = Deno.env.get('BASE44_APP_ID');
  const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');
  if (!appId || !serviceToken) {
    throw new Error('Missing BASE44_APP_ID or BASE44_SERVICE_TOKEN in Base44 env');
  }
  return createClient({ appId, serviceToken });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
    }

    const body = await req.json().catch(() => ({}));

    // ✅ Auth-aware client (user if logged in; otherwise service role)
    const base44 = await getBase44Client(req);

    // Your existing logic here, e.g.:
    // const result = await base44.functions.invoke('apiContraindicationsCore', body);
    // const payload = result?.data ?? result;

    // For now, echo to confirm it runs:
    const payload = { ok: true, route: 'apiContraindications', input: body, at: new Date().toISOString() };

    return Response.json(payload, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const msg = e?.message ?? String(e);
    console.error('apiContraindications error:', msg);
    return Response.json({ status: 'error', error: msg }, { status: 500 });
  }
});
