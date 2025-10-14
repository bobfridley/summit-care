export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const sendJSON = (res: any, status: number, body: any) => {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body));
};

export const handleError = (res: any, err: any) => {
  const status = err?.status ?? 500;
  const detail = env.NODE_ENV === "development" ? (err?.stack ?? String(err)) : "";
  sendJSON(res, status, {
    error_type: err?.name ?? "HTTPException",
    message: err?.message ?? "Internal Server Error",
    detail,
    traceback: "",
  });
};
import { env } from "./env";
