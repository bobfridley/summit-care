// eslint.config.mjs

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import unusedPlugin from 'eslint-plugin-unused-imports';

// React plugins
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignore generated / build output
  { ignores: ['node_modules', 'dist', '.next', '.vercel', 'coverage', 'build', '**/*.d.ts'] },

  // Base JS/TS (includes JSX)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null, // no project mode; avoids perf issues
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'unused-imports': unusedPlugin,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // General hygiene
      'unused-imports/no-unused-imports': 'warn',
      'import/no-unresolved': 'off',

      // React
      'react/jsx-no-undef': ['error', { allowGlobals: false }],
      'react/react-in-jsx-scope': 'off', // not needed in React 17+
      'react/jsx-uses-react': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Optional during dev: enable if using React Fast Refresh in dev-only files
      // "react-refresh/only-export-components": "warn",
    },
  },

  // Deno functions under api/** — allow Deno global
  {
    files: ['api/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { Deno: 'readonly' },
    },
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  // in eslint.config.mjs add this override near the end:
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react/jsx-no-undef': 'off',
    },
  },
];
