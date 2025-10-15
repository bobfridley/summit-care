import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),      // frontend source
      '@api': path.resolve(__dirname, 'api'),   // backend API
      '@shared': path.resolve(__dirname, 'shared'), // ✅ new shared dir
    },
  },
})

import { base44 } from "@api/base44Client";
