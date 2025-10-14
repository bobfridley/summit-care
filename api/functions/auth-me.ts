import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";

export default withCORS(async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      throw new HttpError(405, "Method Not Allowed");
    }

    // Runtime import avoids bundling on cold starts if not needed
    const mod = await import("@base44/sdk");
    const { createClientFromRequest } = (mod as any);

    const b44 = createClientFromRequest(req);
    const me = await b44.auth.me(); // throws if unauthenticated

    // Normalize a couple of useful fields (adjust if your shape differs)
    const user = {
      id: me?.user?.id ?? me?.id ?? null,
      name: me?.user?.name ?? me?.name ?? null,
      email: me?.user?.email ?? me?.email ?? null,
      image: me?.user?.image ?? me?.image ?? null,
      roles: (me?.user?.roles ?? me?.roles) ?? [],
    };

    sendJSON(res, 200, { ok: true, user });
  } catch (err: any) {
    // Treat “not authed” as 401
    const status = err?.status ?? err?.response?.status ?? 401;
    sendJSON(res, status, { ok: false, error: "unauthorized" });
  }
});
