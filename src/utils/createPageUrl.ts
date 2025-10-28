// src/lib/createPageUrl.ts
export function createPageUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>
) {
  const base = path.startsWith('/') ? path : `/${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== null && v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
