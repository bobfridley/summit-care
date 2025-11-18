import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      // Dependencies
      "node_modules/**",

      // Next.js / builds
      ".next/**",
      ".next-*/**",
      "dist/**",
      "build/**",
      "coverage/**",

      // Logs / misc
      "*.log",

      // Public build artifacts (optional)
      "public/*.js",

      // Config files that should not be linted
      "postcss.config.js",
      "vite.config.*.cjs",
      "vite.config.*.mjs",
      "tailwind.config.*.cjs",
      "tailwind.config.*.mjs",
      ".eslintrc.cjs",
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      "react/prop-types": "off",
    },
  },
]
