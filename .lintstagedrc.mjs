// .lintstagedrc.mjs
export default {
  '*.{js,jsx,ts,tsx}': [
    // portable way to increase memory & use cache
    'node --max-old-space-size=3072 ./node_modules/eslint/bin/eslint.js --fix --cache --cache-location .eslintcache',
  ],
  '*.{css,scss,md,json,yml,yaml}': ['prettier --write'],
};
