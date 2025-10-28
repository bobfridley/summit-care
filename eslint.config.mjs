// eslint.config.mjs
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import unusedPlugin from 'eslint-plugin-unused-imports';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['node_modules', 'dist', '.next', '.vercel', 'coverage', 'build', '**/*.d.ts'] },

  // TS across the repo (no project mode)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null, // ⬅ turn OFF project mode
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'unused-imports': unusedPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // keep useful rules that don't need type info
      'unused-imports/no-unused-imports': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // disable a few type-aware rules you may have enabled earlier
      'import/no-unresolved': 'off', // avoid false positives with path aliases/deno specifiers
    },
  },

  // Deno functions under api/** — TS parser, no project, with Deno global
  {
    files: ['api/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: null, ecmaVersion: 'latest', sourceType: 'module' },
      globals: { Deno: 'readonly' },
    },
    rules: {
      'import/no-unresolved': 'off',
    },
  },

  // Plain JS
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react/jsx-no-undef': ['error', { allowGlobals: false }],
    },
  },
];
