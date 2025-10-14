import { withCORS } from "../utils/cors";
import { okFetch } from "../utils/fetch";
import { sendJSON, handleError } from "../utils/errors";

export default withCORS(async (_req, res) => {
  try {
    const r = await okFetch("https://api.ipify.org?format=json");
    const data = await r.json();
    sendJSON(res, 200, { egress_ip: data.ip });
  } catch (err) {
    handleError(res, err);
  }
});
