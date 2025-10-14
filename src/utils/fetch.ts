export async function okFetch(input: string, init?: RequestInit) {
  const r = await fetch(input, init);
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err: any = new Error(`Fetch failed: ${r.status} ${r.statusText}`);
    err.status = r.status;
    err.detail = text;
    throw err;
  }
  return r;
}
