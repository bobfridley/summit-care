import { withCORS } from "../utils/cors";
import { env } from "../utils/env";
import { okFetch } from "../utils/fetch";
import { sendJSON, handleError, HttpError } from "../utils/errors";

// Lazy import so deployments without Base44 still work
async function getBase44Client() {
  if (!env.BASE44_APP_ID || !env.BASE44_SERVICE_TOKEN) return null;
  const { createClient } = await import("@base44/sdk");
  return createClient({
    appId: env.BASE44_APP_ID,
    serviceToken: env.BASE44_SERVICE_TOKEN,
  });
}

async function runViaBase44(body: any) {
  const client = await getBase44Client();
  if (!client) return null;

  // Mirror your Deno call:
  // const result = await base44.functions.invoke('apiContraindicationsCore', body);
  const fnName = env.BASE44_FUNCTION_NAME;
  const result = await client.functions.invoke(fnName, body);
  // Base44 may wrap outputs under .data
  const payload = (result as any)?.data ?? result;
  return { source: "base44", payload };
}

async function runViaOpenFDA(body: any) {
  const drugRaw = body?.drug ?? body?.name ?? body?.query ?? "";
  const drug = String(drugRaw ?? "").trim();
  if (!drug) throw new HttpError(400, "Missing 'drug' in request body");

  const url = `${env.OPENFDA_BASE}/drug/label.json?search=openfda.brand_name:("${encodeURIComponent(
    drug
  )}")&limit=3`;

  const r = await okFetch(url);
  const data = await r.json();

  const hits = data?.results ?? [];
  const contraindications: string[] = hits
    .flatMap((d: any) => d?.contraindications ?? [])
    .slice(0, 5);

  return {
    source: "openfda",
    payload: {
      drug,
      contraindications,
      count: contraindications.length,
    },
  };
}

export default withCORS(async (req, res) => {
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST");

    const body = req.body ?? {};
    // 1) Try Base44 (service role) if creds are present
    const viaB44 = await runViaBase44(body);
    if (viaB44) {
      sendJSON(res, 200, { ok: true, route: "apiContraindications", ...viaB44, at: new Date().toISOString() });
      return;
    }

    // 2) Fallback to public openFDA
    const viaFDA = await runViaOpenFDA(body);
    sendJSON(res, 200, { ok: true, route: "apiContraindications", ...viaFDA, at: new Date().toISOString() });
  } catch (e) {
    handleError(res, e);
  }
});
