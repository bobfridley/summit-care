// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = (() => {
  const raw = process.env.BASE_PATH || "";
  const basePath =
    raw === "" ? "" : raw.startsWith("/") ? raw.replace(/\/$/, "") : `/${raw}`;

  return {
    reactStrictMode: true,

    basePath,               // "", "/summit-care", "/summit-care-staging", "/summit-care-pr-123"
    assetPrefix: basePath || undefined,

    // Expose base path for occasional manual use in client code
    env: {
      NEXT_PUBLIC_BASE_PATH: basePath
    },

    images: {
      path: `${basePath}/_next/image`,
    },
  };
})();

export default nextConfig;
