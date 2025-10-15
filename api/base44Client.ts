import { createClient, createClientFromRequest } from "npm:@base44/sdk@0.7.1";

function getEnv(key: string): string | undefined {
  try { if (typeof Deno !== "undefined" && Deno?.env?.get) return Deno.env.get(key) ?? undefined; } catch {}
  if (typeof process !== "undefined" && process.env) return process.env[key];
  return undefined;
}

export function getServiceClient() {
  const appId = getEnv("BASE44_APP_ID");
  const serviceToken = getEnv("BASE44_SERVICE_TOKEN");
  if (!appId || !serviceToken) {
    throw new Error("Missing BASE44_APP_ID or BASE44_SERVICE_TOKEN in environment");
  }
  return createClient({ appId, serviceToken });
}

export function fromRequest(req: Request) {
  return createClientFromRequest(req);
}
