import { HttpError } from "./errors";

export async function requireUser(req: any) {
  // Accept either: 1) Base44 request-bound auth header, or 2) Bearer JWT (future)
  try {
    const mod = await import("@base44/sdk");
    const { createClientFromRequest } = mod as any;
    const b44 = createClientFromRequest(req);
    const me = await b44.auth.me(); // throws if not authed
    // normalize shape; adjust if your user object differs
    const user_id = me?.user?.id ?? me?.id ?? null;
    if (!user_id) throw new Error("No user id");
    return { user_id, me };
  } catch {
    throw new HttpError(401, "Unauthorized");
  }
}
