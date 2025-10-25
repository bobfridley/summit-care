// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  // --- Ignores --------------------------------------------------------------
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      '.vercel/**',
      'coverage/**',
      '.eslintcache',
      '**/*.min.js',
    ],
  },

  // --- JS/JSX (browser) ----------------------------------------------------
  {
    files: ['src/**/*.{js,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // --- TypeScript (frontend, type-aware) ---
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}', 'web/**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        project: ['./tsconfig.json'],
        tsconfigRootDir,          // ✅ inside parserOptions
      },
      globals: { ...globals.browser },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...cfg.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    },
  })),

  // --- TypeScript (backend, type-aware) ---
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['api/**/*.{ts,tsx}', 'backend/**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        project: ['./tsconfig.server.json'],
        tsconfigRootDir,          // ✅ inside parserOptions
      },
      globals: { ...globals.node },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...cfg.rules,
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  })),

  // --- TypeScript (shared/util/types; parse-only) ---
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['shared/**/*.ts', 'utils/**/*.ts', 'types/**/*.{ts,d.ts}'],
    languageOptions: {
      ...cfg.languageOptions,
      // parse-only: do NOT set parserOptions.project here
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...cfg.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  })),

  // --- block that targets the schema file(s) ------------------------------------
  {
    files: ['src/db/schema.ts', 'src/db/**/schema.ts'],
    rules: { '@typescript-eslint/naming-convention': 'off', '@typescript-eslint/no-unused-vars': 'off' }, // ← one-line patch
  },

  // --- Node ESM files (use import/export) ------------------------------------
  {
    files: [
      'lib/**/*.js',
      'scripts/**/*.js',
      'vite.config.mjs',
      'tailwind.config.mjs'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {},
  },

  // --- Node CommonJS files (only if you actually have CJS) -------------------
  {
    files: [
      '**/*.cjs',
      'vite.config.cjs',
      'tailwind.config.cjs'
      // If you truly have any .js files that are CJS, list them explicitly:
      // 'scripts/some-legacy-cjs.js'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {},
  },

  // --- Auto cleanup: unused imports everywhere ------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin, // 👈 add plugin here because we use its rule below
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
  },
];
