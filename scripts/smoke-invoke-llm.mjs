// scripts/smoke-invoke-llm.mjs
// Node 20+ has global fetch.
const base = process.env.LOCAL_API_BASE || 'http://localhost:5173'; // Vite dev proxy if configured
const url = `${base}/api/invoke-llm`;

const payload = {
  prompt: 'Say hello to SummitCare in one sentence.',
  // model: 'openai:gpt-4o-mini' // optional
};

(async () => {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    console.log('[invoke-llm] status:', r.status);
    console.log('[invoke-llm] body:', JSON.stringify(data, null, 2));
    process.exit(r.ok ? 0 : 1);
  } catch (e) {
    console.error('Smoke test failed:', e?.message || e);
    process.exit(2);
  }
})();
