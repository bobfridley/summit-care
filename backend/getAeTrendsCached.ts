// Cache-first adverse-event trends (openFDA drug/event) for multiple drugs.
// Tables used: ae_trends_cache
// Secrets required: OPENFDA_API_KEY

const DRUGS_DEFAULT = ["PHENELZINE", "ATORVASTATIN", "OMEPRAZOLE"] as const;
const TTL_MS_DEFAULT = 24 * 60 * 60 * 1000; // 24h
const DATE_START_DEFAULT = "20240101";       // per your update
const DATE_END_DEFAULT = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`; // YYYYMMDD
})();

export default async function getAeTrendsCached({
  drugs = DRUGS_DEFAULT as string[],
  start_date = DATE_START_DEFAULT,
  end_date = DATE_END_DEFAULT,
  country = "US",
  serious = "1",
  top_n = 20,
  ttl_ms = TTL_MS_DEFAULT
}: {
  drugs?: string[];
  start_date?: string;
  end_date?: string;
  country?: string | null;
  serious?: "0" | "1" | null;
  top_n?: number;
  ttl_ms?: number;
}) {
  const nowMs = Date.now();

  // 1) Build IDs and read cache
  const ids = drugs.map(d => makeId(d, start_date, end_date, country, serious, top_n));
  const cached = await db.select("ae_trends_cache", { id__in: ids });
  const byId: Record<string, any> = Object.fromEntries(cached.map((r: any) => [r.id, r]));

  // 2) Choose what to fetch
  const needsFetch: string[] = [];
  const out: Array<{ source: "cache" | "fresh" | "empty"; row: any }> = [];

  for (const drug of drugs) {
    const id = makeId(drug, start_date, end_date, country, serious, top_n);
    const row = byId[id];
    if (!row) {
      needsFetch.push(drug);
    } else {
      const age = nowMs - new Date(row.fetched_at).getTime();
      if (Number.isFinite(age) && age <= ttl_ms) {
        out.push({ source: "cache", row });
      } else {
        needsFetch.push(drug);
      }
    }
  }

  // 3) Fetch fresh where needed
  if (needsFetch.length) {
    const fetched = await fetchAndUpsertAeTrends({
      drugs: needsFetch,
      start_date,
      end_date,
      country,
      serious,
      top_n
    });
    const fetchedById = Object.fromEntries((fetched.rows || []).map((r: any) => [r.id, r]));
    for (const drug of drugs) {
      const id = makeId(drug, start_date, end_date, country, serious, top_n);
      if (fetchedById[id]) out.push({ source: "fresh", row: fetchedById[id] });
    }
  }

  // 4) Fill gaps
  const have = new Set(out.map(r => r.row.id));
  for (const drug of drugs) {
    const id = makeId(drug, start_date, end_date, country, serious, top_n);
    if (!have.has(id)) {
      if (byId[id]) {
        out.push({ source: "cache", row: byId[id] });
      } else {
        out.push({
          source: "empty",
          row: {
            id,
            drug_query: drug,
            start_date, end_date, country, serious, top_n,
            top_reactions: [],
            timeseries: [],
            fetched_at: new Date().toISOString()
          }
        });
      }
    }
  }

  return { rows: out };
}

// ---------- internals ----------

function makeId(drug: string, start: string, end: string, country?: string | null, serious?: "0" | "1" | null, topN?: number) {
  const c = country ? country : "ALL";
  const s = (serious === "0" || serious === "1") ? serious : "ALL";
  return `event:${drug}:${start}-${end}:${c}:${s}:top${topN ?? 20}`;
}

async function fetchAndUpsertAeTrends({
  drugs, start_date, end_date, country, serious, top_n
}: {
  drugs: string[];
  start_date: string;
  end_date: string;
  country?: string | null;
  serious?: "0" | "1" | null;
  top_n: number;
}) {
  const API_KEY = process.env.OPENFDA_API_KEY;
  if (!API_KEY) throw new Error("Missing OPENFDA_API_KEY");
  const base = "https://api.fda.gov/drug/event.json";

  const parts = [
    `patient.drug.medicinalproduct:"%DRUG%"`,
    `receivedate:[${start_date} TO ${end_date}]`
  ];
  if (country) parts.push(`occurcountry:${country}`);
  if (serious === "0" || serious === "1") parts.push(`serious:${serious}`);

  const buildUrlTop = (drug: string) => {
    const q = parts.map(p => p.replace("%DRUG%", drug)).join(" AND ");
    const qs = new URLSearchParams({
      search: q,
      count: "patient.reaction.reactionmeddrapt.exact",
      limit: String(top_n),
      api_key: API_KEY
    });
    return `${base}?${qs.toString()}`;
  };

  const buildUrlSeries = (drug: string) => {
    const q = parts.map(p => p.replace("%DRUG%", drug)).join(" AND ");
    const qs = new URLSearchParams({
      search: q,
      count: "receiptdate",
      api_key: API_KEY
    });
    return `${base}?${qs.toString()}`;
  };

  const fetchJSON = async (url: string, tries = 4) => {
    let attempt = 0;
    for (;;) {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return res.json();
      if (res.status === 404) return { results: [] }; // “No matches found”
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

  const mapTop = (data: any) =>
    (data?.results || []).map((r: any) => ({ term: r.term, count: r.count }));

  const mapSeries = (data: any) =>
    (data?.results || []).map((pt: any) => ({ date: pt.time ?? pt.term, count: pt.count }));

  const rows = await Promise.all(
    drugs.map(async (drug) => {
      const [top, series] = await Promise.all([
        fetchJSON(buildUrlTop(drug)),
        fetchJSON(buildUrlSeries(drug))
      ]);

      const id = makeId(drug, start_date, end_date, country, serious, top_n);
      const row = {
        id,
        drug_query: drug,
        start_date, end_date, country, serious, top_n,
        top_reactions: mapTop(top),
        timeseries: mapSeries(series),
        fetched_at: new Date().toISOString()
      };

      await db.upsert("ae_trends_cache", row);
      return row;
    })
  );

  return { rows };
}
