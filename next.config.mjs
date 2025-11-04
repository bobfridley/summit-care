/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || '',
  output: 'standalone',
};

export default nextConfig;
