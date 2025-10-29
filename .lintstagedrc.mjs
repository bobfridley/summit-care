// .lintstagedrc.mjs
export default {
  '*.{js,jsx,ts,tsx}': [
    // ESLint with caching & memory optimization
    'node --max-old-space-size=3072 ./node_modules/eslint/bin/eslint.js --fix --cache --cache-location .eslintcache',
    // Run Prettier after ESLint fixes
    'prettier --write',
  ],
  '*.{css,scss,md,json,yml,yaml}': ['prettier --write'],
};
