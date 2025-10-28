// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // ✅ Force Next.js to treat this directory as the workspace root
    root: path.join(__dirname),
  },
};

module.exports = nextConfig;
