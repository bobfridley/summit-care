// api/utils/auth.ts
import { getBase44Client } from '../base44Client';

export type B44User = {
  id?: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
};

// ---------- small type guards ----------
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function toUserShape(x: unknown): B44User {
  if (!isRecord(x)) return { email: null, name: null, roles: [] };

  const id = typeof x.id === 'string' ? x.id : undefined;
  const email = typeof x.email === 'string' ? x.email : null;
  const name = typeof x.name === 'string' ? x.name : null;

  const roles =
    Array.isArray(x.roles) && x.roles.every((r) => typeof r === 'string')
      ? (x.roles)
      : [];

  return { id, email, name, roles };
}

/**
 * Ensure the request is authenticated and return a normalized user object.
 * Unwraps common Axios-like shapes: { data: { user: {...} } } or { data: {...} }
 */
export async function requireUser(req: Request): Promise<B44User> {
  const b44 = await getBase44Client(req);

  // b44.auth.me() could be a user, or Axios-like { data }, or { data: { user } }
  const res: unknown = await b44.auth.me();

  const data = isRecord(res) && 'data' in res ? (res as { data: unknown }).data : res;
  const userObj = isRecord(data) && 'user' in data ? (data as { user: unknown }).user : data;

  const user = toUserShape(userObj);

  // If you want to hard-require identity, guard here:
  if (!user.email && !user.id) {
    throw new Error('Unauthenticated');
  }

  return user;
}

/** Optional: a soft variant that returns null instead of throwing */
export async function tryRequireUser(req: Request): Promise<B44User | null> {
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}
