# 1) sanity checks
npm run check:routes
npm run check:edge
npm run check:cors:strict

# 2) auto-fix headers/runtime if needed
npm run fix:edge
npm run fix:cors:block
npm run fix:cors:codemod

# 3) code hygiene
npm run lint
npm run format
npm run typecheck

# 4) run locally
#   - vercel dev → http://localhost:3000
#   - vite       → http://localhost:5173 (proxy /api → 3000 if configured)
npm run dev:all
