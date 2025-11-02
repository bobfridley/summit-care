module.exports = {
  apps: [
    {
      name: 'summitcare-prod',
      cwd: '/var/www/summit-care/.next-prod/standalone',
      script: 'node',
      args: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        // BASE_PATH only needed at build time, but harmless here:
        BASE_PATH: '/summit-care',
        NEXT_PUBLIC_BASE_PATH: '/summit-care',
      },
      watch: false,
      max_restarts: 5,
    },
    {
      name: 'summitcare-staging',
      cwd: '/var/www/summit-care/.next-staging/standalone',
      script: 'node',
      args: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOSTNAME: '0.0.0.0',
        BASE_PATH: '/summit-care-staging',
        NEXT_PUBLIC_BASE_PATH: '/summit-care-staging',
      },
      watch: false,
      max_restarts: 5,
    },
    {
      name: 'summitcare-preview',
      cwd: '/var/www/summit-care/.next-preview/standalone',
      script: 'node',
      args: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        HOSTNAME: '0.0.0.0',
        BASE_PATH: '/summit-care-preview',
        NEXT_PUBLIC_BASE_PATH: '/summit-care-preview',
      },
      watch: false,
      max_restarts: 5,
    },
  ],
};
