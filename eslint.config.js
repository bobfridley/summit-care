// eslint.config.js — Flat config (ESM)
import js from '@eslint/js'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'

export default [
  js.configs.recommended,

  // React/Vite dev ergonomics
  {
    plugins: { 'react-refresh': reactRefresh, 'react-hooks': reactHooks, import: importPlugin },
    rules: {
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // 🚫 Frontend (src) may not import from server (api)
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-restricted-paths': ['error', {
        zones: [
          {
            target: './src',
            from: './api',
            message: 'Do not import server code (api/**) into the frontend. Call /api HTTP endpoints instead.',
          },
        ],
      }],
    },
  },
]
