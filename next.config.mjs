// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = (() => {
  const raw = process.env.BASE_PATH || '';
  // normalize: "", "/foo", "/foo-bar" (strip trailing slash if present)
  const basePath = raw === '' ? '' : raw.startsWith('/') ? raw.replace(/\/$/, '') : `/${raw}`;

  return {
    reactStrictMode: true,

    // Subdirectory deploy root (handled automatically by Next for routes & assets)
    basePath, // e.g., "", "/summit-care", "/summit-care-staging", "/summit-care-preview"

    // Expose to client when occasionally needed in code
    env: {
      NEXT_PUBLIC_BASE_PATH: basePath,
    },

    // For server/PM2 deploys; creates a .next/standalone bundle
    output: 'standalone',

    // You DON'T need images.path; Next adjusts for basePath automatically
    // images: { path: `${basePath}/_next/image` }, // ← remove

    // Only set assetPrefix if you have a CDN domain. Otherwise omit it.
    // assetPrefix: 'https://cdn.example.com', // ← not needed for subdirectory hosting
  };
})();

export default nextConfig;
