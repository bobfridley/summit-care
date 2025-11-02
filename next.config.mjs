/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  async redirects() {
    // ensures "/" becomes "/dashboard" even when basePath is set
    return [{ source: '/', destination: '/Dashboard', permanent: false }];
  },
};
export default nextConfig;