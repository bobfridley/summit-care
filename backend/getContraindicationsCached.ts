// Cache-first fetch for contraindications (openFDA drug/label) for multiple drugs.
// Tables used: drug_label_contraindications
// Secrets required: OPENFDA_API_KEY
//
// Base44 server env assumptions:
// - global fetch available
// - db.select(table, query) and db.upsert(table, row) available
// If your platform differs, adapt db calls accordingly.

const DRUGS_DEFAULT = ["PHENELZINE", "ATORVASTATIN", "OMEPRAZOLE"] as const;
const TTL_MS_DEFAULT = 24 * 60 * 60 * 1000; // 24h
const EFFECTIVE_TIME_CUTOFF = "20240101";    // >= Jan 1, 2024 (per your requirement)

type DrugName = typeof DRUGS_DEFAULT[number];

export default async function getContraindicationsCached({
  drugs = DRUGS_DEFAULT as string[],
  ttl_ms = TTL_MS_DEFAULT,
  include_boxed = true,
  include_warn = true
}: {
  drugs?: string[];
  ttl_ms?: number;
  include_boxed?: boolean;
  include_warn?: boolean;
}) {
  const now = Date.now();

  // 1) Read cache
  const ids = drugs.map(d => `label:${d}:${EFFECTIVE_TIME_CUTOFF}plus`);
  const cachedRows = await db.select("drug_label_contraindications", { id__in: ids });
  const byId: Record<string, any> = Object.fromEntries(cachedRows.map((r: any) => [r.id, r]));

  // 2) Decide which need refresh
  const needsFetch: string[] = [];
  const results: Array<{ source: "cache" | "fresh" | "empty"; row: any }> = [];

  for (const drug of drugs) {
    const id = `label:${drug}:${EFFECTIVE_TIME_CUTOFF}plus`;
    const row = byId[id];
    if (!row) {
      needsFetch.push(drug);
    } else {
      const age = now - new Date(row.fetched_at).getTime();
      if (Number.isFinite(age) && age <= ttl_ms) {
        results.push({ source: "cache", row });
      } else {
        needsFetch.push(drug);
      }
    }
  }

  // 3) Fetch + upsert for those needing refresh
  if (needsFetch.length) {
    const fetched = await fetchAndUpsertContraindications({
      drugs: needsFetch,
      include_boxed,
      include_warn
    });
    const fetchedById = Object.fromEntries(fetched.rows.map(r => [r.id, r]));
    for (const drug of drugs) {
      const id = `label:${drug}:${EFFECTIVE_TIME_CUTOFF}plus`;
      if (fetchedById[id]) results.push({ source: "fresh", row: fetchedById[id] });
    }
  }

  // 4) Fill gaps (if any)
  const have = new Set(results.map(r => r.row.id));
  for (const drug of drugs) {
    const id = `label:${drug}:${EFFECTIVE_TIME_CUTOFF}plus`;
    if (!have.has(id)) {
      if (byId[id]) {
        results.push({ source: "cache", row: byId[id] });
      } else {
        results.push({
          source: "empty",
          row: {
            id,
            drug_query: drug,
            effective_time: null,
            set_id: null,
            brand_names: [],
            generic_names: [],
            contraindications: [],
            boxed_warning: [],
            warnings_and_precautions: [],
            fetched_at: new Date().toISOString()
          }
        });
      }
    }
  }

  return { rows: results };
}

/** Internal: hits openFDA drug/label and upserts rows */
async function fetchAndUpsertContraindications({
  drugs,
  include_boxed = true,
  include_warn = true
}: {
  drugs: string[];
  include_boxed?: boolean;
  include_warn?: boolean;
}) {
  const API_KEY = process.env.OPENFDA_API_KEY;
  if (!API_KEY) throw new Error("Missing OPENFDA_API_KEY");
  const base = "https://api.fda.gov/drug/label.json";

  const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : []);
  const splitParas = (arr: any) =>
    toArray(arr)
      .flatMap((s: any) => (typeof s === "string" ? s.split(/\n\n+/g) : []))
      .map((x: string) => x.trim())
      .filter(Boolean);

  const buildUrl = (drug: string) => {
    const q = [
      "(_exists_:contraindications)",
      `(${[
        `openfda.generic_name:"${drug}"`,
        `openfda.substance_name:"${drug}"`,
        `"${drug}"`
      ].join(" OR ")})`,
      `effective_time:[${EFFECTIVE_TIME_CUTOFF} TO *]`
    ].join(" AND ");
    return `${base}?search=${encodeURIComponent(q)}&sort=effective_time:desc&limit=1&api_key=${API_KEY}`;
  };

  const fetchJSON = async (url: string, tries = 4) => {
    let attempt = 0;
    for (;;) {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return res.json();
      if (res.status === 404) return { results: [] };
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= tries - 1) {
        const text = await res.text().catch(() => "");
        throw new Error(`openFDA error ${res.status}: ${text.slice(0, 200)}`);
      }
      const retryAfter = Number(res.headers.get("Retry-After")) || Math.pow(2, attempt) * 500;
      await new Promise(r => setTimeout(r, retryAfter));
      attempt++;
    }
  };

  const mapDoc = (drug: string, doc: any) => {
    const payload = {
      drug_query: drug,
      effective_time: doc?.effective_time ?? null,
      set_id: doc?.set_id ?? null,
      brand_names: toArray(doc?.openfda?.brand_name),
      generic_names: toArray(doc?.openfda?.generic_name),
      contraindications: splitParas(doc?.contraindications),
      boxed_warning: include_boxed ? splitParas(doc?.boxed_warning) : [],
      warnings_and_precautions: include_warn ? splitParas(doc?.warnings_and_precautions) : [],
      fetched_at: new Date().toISOString()
    };

    // Fallbacks to *_table
    if (payload.contraindications.length === 0 && doc?.contraindications_table) {
      payload.contraindications = splitParas(doc.contraindications_table);
    }
    if (include_boxed && payload.boxed_warning.length === 0 && doc?.boxed_warning_table) {
      payload.boxed_warning = splitParas(doc.boxed_warning_table);
    }
    if (include_warn && payload.warnings_and_precautions.length === 0 && doc?.warnings_and_precautions_table) {
      payload.warnings_and_precautions = splitParas(doc.warnings_and_precautions_table);
    }

    const id = `label:${drug}:${EFFECTIVE_TIME_CUTOFF}plus`;
    return { id, ...payload };
  };

  const rows = await Promise.all(
    drugs.map(async (drug) => {
      const data = await fetchJSON(buildUrl(drug));
      const doc = data?.results?.[0] ?? null;
      const row = mapDoc(drug, doc);
      await db.upsert("drug_label_contraindications", row);
      return row;
    })
  );

  return { rows };
}
