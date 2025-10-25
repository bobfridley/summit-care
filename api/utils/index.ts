// api/functions/utils/auth.ts
import { getBase44Client } from '../base44Client';

/**
 * Ensure the request is authenticated and return the user object.
 * Throws if unauthenticated — caller should catch and return 401/403.
 */
export async function requireUser(req: Request) {
  const b44 = await getBase44Client(req);
  const me = await b44.auth.me(); // throws if not authed
  return me;
}
