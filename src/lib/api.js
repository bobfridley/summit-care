// src/lib/api.js
export const api = {
  health: () => fetch('/api/health').then(r => r.json()),
  contraindications: (drug, opts={}) =>
    fetch('/api/contraindications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drug, ...opts })
    }).then(r => r.json()),
  aeTrends: (drug, opts={}) =>
    fetch('/api/ae-trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drug, ...opts })
    }).then(r => r.json()),
};
