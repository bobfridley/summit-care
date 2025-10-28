# 🧩 SummitCare – Developer Testing & Circle-Back Tasks

This document tracks deferred cleanup items, testing steps, and migration verifications for the SummitCare project.

---

## 🧠 1. Next.js Migration / Routing

**Goal:** Fully replace legacy `react-router-dom` usage and align all navigation with Next.js routing conventions.

### Tasks

- [ ] Remove all `react-router-dom` imports (`useLocation`, `Routes`, `Route`, `Navigate`, etc.)
- [ ] Ensure `_app.tsx` wraps all pages with `<Layout>`.
- [ ] Verify `<Component {...pageProps} />` renders correctly inside `Layout`.
- [ ] Use Next.js `Link` and `useRouter()` everywhere.

### Test

1. Run the local dev server:
   ```bash
   pnpm dev
   ```
