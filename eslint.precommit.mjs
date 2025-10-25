// eslint.precommit.mjs
// Fast, non type-checked ESLint config just for pre-commit (staged files)

import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base for all JS/TS files (no type-check project)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['dist/**', 'build/**', 'node_modules/**', '.vercel/**', '.next/**', 'coverage/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        warnOnUnsupportedTypeScriptVersion: false,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // Common web platform globals used across the repo
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier,
    },
    rules: {
      // JS base (no types)
      ...js.configs.recommended.rules,

      // TS recs (non type-checked)
      ...tsPlugin.configs.recommended.rules,

      // Prettier integration
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',

      // 🔧 Be lenient during pre-commit so it doesn’t block on non-fixables
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'none', varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // Overrides for all server/Edge code under api/**
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: {
        Deno: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        fetch: 'readonly',
        // HeadersInit is a TYPE, ESLint can't "see" it; disable no-undef below.
      },
    },
    rules: {
      // Deno/Edge provide these at runtime; and types (like HeadersInit) aren't visible to ESLint.
      'no-undef': 'off',
    },
  },
];
