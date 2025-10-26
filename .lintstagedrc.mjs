// .lintstagedrc.mjs
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,md,json,yml,yaml}': ['prettier --write']
};
