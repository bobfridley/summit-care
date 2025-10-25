// api/base44Client.ts
// Safe Base44 client helpers for Edge (Deno) + Node.
// - Prefer request-aware client (logged-in user) when possible
// - Fallback to service-role client (APP_ID + SERVICE_TOKEN) when configured
// - No anonymous createClient({}) fallback (prevents type + runtime errors)

import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/** Deno/Node env getter */
function getEnv(key: string): string | undefined {
  const g = globalThis as unknown as {
    Deno?: { env?: { get?: (k: string) => string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };
  return g?.Deno?.env?.get?.(key) ?? g?.process?.env?.[key];
}

function hasServiceCreds(): boolean {
  return Boolean(getEnv('BASE44_APP_ID') && getEnv('BASE44_SERVICE_TOKEN'));
}

/** Lazily-created singleton service client */
let _serviceClient: ReturnType<typeof createClient> | null = null;

export function getServiceClient() {
  if (_serviceClient) return _serviceClient;

  const appId = getEnv('BASE44_APP_ID');
  const serviceToken = getEnv('BASE44_SERVICE_TOKEN');
  if (!appId || !serviceToken) {
    throw new Error(
      'Missing BASE44_APP_ID or BASE44_SERVICE_TOKEN. Set these in your function/project env to enable service-role access.'
    );
  }
  _serviceClient = createClient({ appId, serviceToken });
  return _serviceClient;
}

/**
 * Best-available client:
 * - If `req` provided → try request-bound client (non-throwing probe)
 * - Else if service creds exist → return service client
 * - Else → throw (no valid way to create a client)
 */
export async function getBase44Client(req?: Request) {
  if (req) {
    try {
      const c = createClientFromRequest(req);
      // Probe session; ignore failure (client still usable for public funcs)
      await c.auth.me().catch(() => null);
      return c;
    } catch {
      // fall through to service client if available
    }
  }
  if (hasServiceCreds()) return getServiceClient();

  throw new Error(
    'Base44 client requires either a Request (for request-bound auth) or env creds (BASE44_APP_ID + BASE44_SERVICE_TOKEN).'
  );
}

/** Back-compat alias (if other files already import this name) */
export async function clientFromRequestOrService(req?: Request) {
  return getBase44Client(req);
}

/** Convenience: assert an authed user from a request-bound client */
export async function requireBase44User(req: Request) {
  const c = createClientFromRequest(req);
  const me = await c.auth.me(); // throws if not authed
  return { client: c, user: me };
}

/** Optional: small trace id for logs */
export function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
