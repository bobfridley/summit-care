import { withCORS } from "../utils/cors";
import { env } from "../utils/env";
import { sendJSON, handleError, HttpError } from "../utils/errors";

export default withCORS(async (req, res) => {
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST");
    const { messages, model = "gpt-4o-mini" } = req.body ?? {};
    if (!env.OPENAI_API_KEY) throw new HttpError(500, "Missing OPENAI_API_KEY");
    if (!messages?.length) throw new HttpError(400, "Missing messages");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, messages }),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = data?.error?.message ?? "OpenAI error";
      throw new HttpError(r.status, msg);
    }
    sendJSON(res, 200, data);
  } catch (err) {
    handleError(res, err);
  }
});
