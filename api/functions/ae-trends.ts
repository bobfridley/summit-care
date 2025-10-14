import { withCORS } from "../utils/cors";
import { env } from "../utils/env";
import { okFetch } from "../utils/fetch";
import { sendJSON, handleError, HttpError } from "../utils/errors";

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Base44 (service-role) runner -----------------------------------------
async function runViaBase44(body: any) {
  if (!env.BASE44_APP_ID || !env.BASE44_SERVICE_TOKEN) return null;

  // Lazy import so builds work even if the dep isn’t installed
  const { createClient } = await import("@base44/sdk");
  const svc = createClient({ appId: env.BASE44_APP_ID, serviceToken: env.BASE44_SERVICE_TOKEN });

  // Your Deno version called: svc.asServiceRole.functions.invoke('getAeTrendsCached', body)
  const fnName = env.BASE44_AE_TRENDS_FN;
  // SDKs often auto-select service role when a service token is used; keeping .asServiceRole for parity
  const result = await (svc as any).asServiceRole?.functions?.invoke?.(fnName, body)
    ?? await (svc as any).functions.invoke(fnName, body);

  const payload = (result as any)?.data ?? result;
  return payload;
}

// ---- openFDA fallback ------------------------------------------------------
async function runViaOpenFDA(body: any) {
  // Accept a few common keys for the drug field
  const drugRaw = body?.drug ?? body?.name ?? body?.query ?? "";
  const drug = String(drugRaw ?? "").trim();
  if (!drug) throw new HttpError(400, "Missing 'drug' in request body");

  // Optional: allow overriding the `count` field (default is yearly)
  // Common choices: receivedate.substr(0,4), receivedate, receiptdate, etc.
  const countField = String(body?.count ?? "receivedate.substr(0,4)");

  // Optional: add a receivedate range (YYYYMMDD to YYYYMMDD). Example:
  // body.since: "2015-01-01", body.until: "2025-12-31"
  const since = String(body?.since ?? "").replaceAll("-", "");
  const until = String(body?.until ?? "").replaceAll("-", "");
  const dateFilter =
    since && until
      ? `+AND+receivedate:[${since}+TO+${until}]`
      : since
      ? `+AND+receivedate:[${since}+TO+99999999]`
      : "";

  // Construct query; note encodeURIComponent around the medicinal product
  const baseQ = `search=patient.drug.medicinalproduct:"${encodeURIComponent(drug)}"${dateFilter}&count=${encodeURIComponent(countField)}`;
  const url = `${env.OPENFDA_BASE}/drug/event.json?${baseQ}`;

  const r = await okFetch(encodeURI(url));
  const data = await r.json();

  return {
    drug,
    series: data?.results ?? [],
    countField,
    since: since || undefined,
    until: until || undefined,
    source: "openfda",
  };
}

// ---- Vercel handler --------------------------------------------------------
export default withCORS(async (req, res) => {
  const tid = traceId();
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST");
    const body = req.body ?? {};

    // 1) Try Base44 (service-role) if creds exist
    const viaB44 = await runViaBase44(body);
    if (viaB44) {
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, viaB44);
      return;
    }

    // 2) Fallback to public openFDA
    const viaFDA = await runViaOpenFDA(body);
    res.setHeader("X-Trace-Id", tid);
    sendJSON(res, 200, viaFDA);
  } catch (err) {
    // Preserve trace id on error as well
    res.setHeader("X-Trace-Id", tid);
    handleError(res, err);
  }
});
