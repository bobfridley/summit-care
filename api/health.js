export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://healthandhiking.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'HEAD') return res.status(200).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET,HEAD,OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const now = new Date();
  return res.status(200).json({
    ok: true,
    service: 'health',
    time: now.toISOString(),
    unix: Math.floor(now.getTime() / 1000),
  });
}
