// api/lib/auth.ts
import type { AxiosInstance } from 'axios';

export type UserLike = {
  id?: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
};

export type MePayload = UserLike & { user?: UserLike };

// ---- Runtime guards (keep it resilient to odd API shapes) ----
function isUserLike(x: unknown): x is UserLike {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const optStr = (v: unknown) => v == null || typeof v === 'string';
  const optStrArr = (v: unknown) =>
    v == null || (Array.isArray(v) && v.every((s) => typeof s === 'string'));
  return optStr(o.id) && optStr(o.email) && optStr(o.name) && optStrArr(o.roles);
}

function normalizeMe(data: unknown): MePayload {
  // Accept either { user: {...} } or a flat user object
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const maybeUser = o.user;
    if (isUserLike(maybeUser)) {
      return { ...(o as MePayload), user: maybeUser };
    }
    if (isUserLike(o)) {
      return o as MePayload;
    }
  }
  // Fallback to an empty shape
  return {};
}

export function errMsg(e: unknown): string {
  return typeof e === 'object' && e && 'message' in e
    ? String((e as { message?: unknown }).message)
    : String(e);
}

// ---- Public helpers ----

/** Fetch the "me" payload; adjust the path if your API differs */
export async function fetchMe(http: AxiosInstance): Promise<MePayload> {
  const { data } = await http.get<MePayload>('/auth/me'); // change path if needed
  return normalizeMe(data);
}

/** Get current user id, if present */
export async function currentUserId(http: AxiosInstance): Promise<string | null> {
  const me = await fetchMe(http);
  const id = me.user?.id ?? me.id ?? null;
  return typeof id === 'string' ? id : null;
}

/** Get a simple profile (email/name/roles) regardless of nesting */
export async function currentUserProfile(
  http: AxiosInstance
): Promise<{ email: string | null; name: string | null; roles: string[] }> {
  const me = await fetchMe(http);
  const email = me.user?.email ?? me.email ?? null;
  const name = me.user?.name ?? me.name ?? null;

  const rolesNested = Array.isArray(me.user?.roles) ? me.user.roles : undefined;
  const rolesRoot = Array.isArray(me.roles) ? me.roles : undefined;
  const roles = rolesNested ?? rolesRoot ?? [];

  return { email, name, roles };
}
