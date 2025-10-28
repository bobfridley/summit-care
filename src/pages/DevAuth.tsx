// /src/pages/DevAuth.tsx
import { useEffect, useState } from 'react';

function mask(s?: string | null) {
  if (!s) return '';
  return s.length > 20 ? s.slice(0, 10) + '…' + s.slice(-8) : s;
}

export default function DevAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('dev-auth-token') : null;
    setToken(t);
  }, []);

  const save = () => {
    const t = prompt('Enter dev auth token')?.trim();
    if (!t) return;
    if (typeof window !== 'undefined') window.localStorage.setItem('dev-auth-token', t);
    setToken(t);
  };

  const clear = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('dev-auth-token');
    setToken(null);
  };

  if (token === null) return <div>Loading…</div>;

  return (
    <main style={{ padding: 16 }}>
      <h1>Dev Auth</h1>
      <p>
        Token: <code>{mask(token) || '(none)'}</code>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save}>Set/Update Token</button>
        <button onClick={clear}>Clear Token</button>
      </div>
    </main>
  );
}
