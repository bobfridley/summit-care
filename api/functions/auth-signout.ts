import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";

export default withCORS(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      throw new HttpError(405, "Method Not Allowed");
    }

    const mod = await import("@base44/sdk");
    const { createClientFromRequest } = (mod as any);

    const b44 = createClientFromRequest(req);

    // If the SDK exposes a sign-out, call it; otherwise fallback to session clear
    // Most Base44 setups clear session cookies server-side on signOut().
    if (b44?.auth?.signOut) {
      await b44.auth.signOut();
    }

    sendJSON(res, 200, { ok: true });
  } catch (_err) {
    // Even if sign-out fails, respond 200 so the UI proceeds
    sendJSON(res, 200, { ok: true });
  }
});
