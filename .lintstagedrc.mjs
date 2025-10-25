export default {
  '*.{js,jsx,ts,tsx}': ['eslint --config eslint.precommit.mjs --fix', 'prettier --write'],
  '*.{css,scss,md,json,yml,yaml}': ['prettier --write'],
};
