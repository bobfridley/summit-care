// src/lib/api.js

// ---- dev-token helpers (used by Navigation + Dev buttons)
export function getDevToken() {
  try {
    return localStorage.getItem('b44-session-token');
  } catch {
    return null;
  }
}

export function hasDevToken() {
  return !!getDevToken();
}

export function isAuthed() {
  // simple heuristic for client-side UI; server still enforces real auth
  return !!getDevToken();
}

// ---- thin fetch wrapper with JSON + auto Authorization
async function http(method, url, { params, json, headers } = {}) {
  let full = url;

  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    }
    full += (url.includes('?') ? '&' : '?') + qs.toString();
  }

  const token = getDevToken();
  const res = await fetch(full, {
    method,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : undefined,
    credentials: 'include',
  });

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const err = new Error((body && body.error) || (body && body.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = body;
    throw err;
  }
  return body;
}

export const api = {
  get: (url, opts) => http('GET', url, opts),
  post: (url, opts) => http('POST', url, opts),
  put: (url, opts) => http('PUT', url, opts),
  delete: (url, opts) => http('DELETE', url, opts),
};

// ---- used by @api/integrations compat
export async function invokeLLM(payload) {
  return api.post('/api/openai-chat', { json: payload });
}
