// src/hooks/useAuth.ts
/* eslint-env browser */

import * as React from 'react';

export type AuthStatus = 'idle' | 'loading' | 'authed' | 'anon';

export type AuthUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
  image?: string | null;
};

function pickUser(x: unknown): AuthUser | null {
  if (!x || typeof x !== 'object') return null;

  // { user: {...} }
  if ('user' in (x as Record<string, unknown>)) {
    const u = (x as Record<string, unknown>).user;
    return pickUser(u);
  }
  const o = x as Record<string, unknown>;
  const email = typeof o.email === 'string' ? o.email : null;
  const name = typeof o.name === 'string' ? o.name : null;
  const id = typeof o.id === 'string' ? o.id : undefined;
  const image = typeof o.image === 'string' ? o.image : null;
  const roles = Array.isArray(o.roles)
    ? (o.roles as unknown[]).filter((r): r is string => typeof r === 'string')
    : [];
  if (email || name || id) return { id, email, name, roles, image };
  return null;
}

export function useAuth() {
  const [status, setStatus] = React.useState<AuthStatus>('idle');
  const [user, setUser] = React.useState<AuthUser | null>(null);

  const load = React.useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/auth-me', {
        method: 'GET',
        headers: { 'cache-control': 'no-store' },
      });
      if (!res.ok) {
        setUser(null);
        setStatus('anon');
        return;
      }

      // ↓ Keep everything as unknown until we explicitly narrow.
      const raw: unknown = await res.json().catch(() => null);
      const u = pickUser(raw);

      if (u) {
        setUser(u);
        setStatus('authed');
      } else {
        setUser(null);
        setStatus('anon');
      }
    } catch {
      setUser(null);
      setStatus('anon');
    }
  }, []);

  React.useEffect(() => {
    void load(); // explicit void to satisfy no-floating-promises
  }, [load]);

  const signOut = React.useCallback(async () => {
    try {
      await fetch('/api/auth-signout', { method: 'POST' });
    } catch {
      // no-op: best effort
    } finally {
      setUser(null);
      setStatus('anon');
    }
  }, []);

  return { status, user, signOut, refresh: load };
}
