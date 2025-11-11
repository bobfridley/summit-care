import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const BASE = process.env.VITE_BASE_PATH || '/'
const BUILD_NAME = process.env.BUILD_NAME || 'prod' // 'prod' | 'staging' | 'preview'

export default defineConfig({
  plugins: [react()],
  base: BASE,
  build: { outDir: `dist-${BUILD_NAME}` },
  server: { allowedHosts: true },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } }
})
