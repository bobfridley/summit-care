export const env = {
  ENFORCE_AUTH_ON_GET: (process.env.ENFORCE_AUTH_ON_GET ?? "false").toLowerCase() === "true",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENFDA_BASE: process.env.OPENFDA_BASE ?? "https://api.fda.gov",
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // NEW: Base44 optional integration
  BASE44_APP_ID: process.env.BASE44_APP_ID ?? "",
  BASE44_SERVICE_TOKEN: process.env.BASE44_SERVICE_TOKEN ?? "",
  BASE44_FUNCTION_NAME: process.env.BASE44_FUNCTION_NAME ?? "apiContraindicationsCore",

  BASE44_APP_ID: process.env.BASE44_APP_ID ?? "",
  BASE44_SERVICE_TOKEN: process.env.BASE44_SERVICE_TOKEN ?? "",
  BASE44_AE_TRENDS_FN: process.env.BASE44_AE_TRENDS_FN ?? "getAeTrendsCached",

  BASE44_HEALTH_FN: process.env.BASE44_HEALTH_FN ?? "backendHealth",
};

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENFDA_BASE: process.env.OPENFDA_BASE ?? "https://api.fda.gov",
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // Base44 (optional)
  BASE44_APP_ID: process.env.BASE44_APP_ID ?? "",
  BASE44_SERVICE_TOKEN: process.env.BASE44_SERVICE_TOKEN ?? "",
  BASE44_FUNCTION_NAME: process.env.BASE44_FUNCTION_NAME ?? "apiContraindicationsCore",
  BASE44_AE_TRENDS_FN: process.env.BASE44_AE_TRENDS_FN ?? "getAeTrendsCached",
  BASE44_HEALTH_FN: process.env.BASE44_HEALTH_FN ?? "backendHealth",
  
  // MySQL
  MYSQL_HOST: process.env.MYSQL_HOST ?? "",
  MYSQL_PORT: Number(process.env.MYSQL_PORT ?? "3306"),
  MYSQL_USER: process.env.MYSQL_USER ?? "",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ?? "",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE ?? "",

  // SSL toggles (parity with your Deno version)
  MYSQL_SSL_CA: process.env.MYSQL_SSL_CA ?? "",                       // PEM string (optional)
  MYSQL_SSL_MODE: (process.env.MYSQL_SSL_MODE ?? "insecure").toLowerCase(), // "require" | "insecure" | "disable"
  MYSQL_SSL_REJECT_UNAUTHORIZED: (process.env.MYSQL_SSL_REJECT_UNAUTHORIZED ?? "false").toLowerCase(),
  MYSQL_SSL_DISABLE: (process.env.MYSQL_SSL_DISABLE ?? "false").toLowerCase() === "true",
};
