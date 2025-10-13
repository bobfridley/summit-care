
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function tryFetch(url, parse, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();
    const ip = parse(raw);
    if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())) {
      throw new Error('Invalid IP format');
    }
    return ip.trim();
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  try {
    // Accept both GET and POST to support frontend SDK calls
    if (!(req.method === 'GET' || req.method === 'POST')) {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = [
      {
        name: 'ipify',
        url: 'https://api.ipify.org?format=json',
        parse: (raw) => {
          try { return JSON.parse(raw)?.ip; } catch { return null; }
        }
      },
      {
        name: 'icanhazip',
        url: 'https://ipv4.icanhazip.com',
