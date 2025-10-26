# 📘 SummitCare — Package Scripts Reference

A quick, friendly guide to every `package.json` script in this repo. Copy/paste the snippets to get work done fast. Perfect for onboarding and future you.

---

## 🧰 Setup & Environment

| Script        | Command                    | What it does                                                                                                                                             |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **setup:env** | `tsx scripts/setup-env.ts` | Creates `.env.local` from `.env.template`, auto-generates a secure `DB_PASSWORD` if missing, validates required `DB_*` vars, and prints a summary table. |

<details>
<summary><strong>When to use & tips</strong></summary>

- Run on a fresh clone or new laptop.
- Safe to run anytime; it won’t overwrite an existing `.env.local`.
- If variables are missing, it tells you exactly which ones.
</details>

---

## 🗄️ Database (Drizzle / MySQL)

| Script             | Command                  | What it does                                                                                                               |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **drizzle:pull**   | `drizzle-kit introspect` | Introspects the live DB and (re)generates `drizzle/schema.ts` into `./drizzle`. Run after schema changes or initial setup. |
| **drizzle:studio** | `drizzle-kit studio`     | Opens a local Drizzle Studio UI to browse tables and run queries visually.                                                 |
| **drizzle:check**  | `drizzle-kit check:sql`  | Validates generated SQL/migrations. Handy before applying changes.                                                         |
| **db:test**        | `tsx scripts/test-db.ts` | Executes a small script that imports the Drizzle client and tries a basic read (e.g., `medications.findMany()`).           |

<details>
<summary><strong>Best practices</strong></summary>

- Ensure `.env.local` has `DB_*` values filled correctly before running these.
- For Hostinger or other managed DBs, set `DB_SSL=true` and (if needed) use `rejectUnauthorized:false` in the client.
- If introspection fails, verify the DB user/plugin and that the DB is listening on `DB_PORT`.
</details>

---

## 🧹 Code Quality

| Script       | Command                           | What it does                                                    |
| ------------ | --------------------------------- | --------------------------------------------------------------- |
| **lint**     | `eslint . --max-warnings=0`       | Lints the repo and fails on warnings or errors.                 |
| **lint:fix** | `eslint . --fix --max-warnings=0` | Auto-fixes lintable issues; fails on remaining warnings/errors. |

<details>
<summary><strong>Notes</strong></summary>

- Keep the codebase clean for stable CI/CD.
- Use `lint:fix` before committing to reduce noise in PRs.
</details>

---

## 🚀 Runtime (Next.js / Vercel)

| Script    | Command      | What it does                            |
| --------- | ------------ | --------------------------------------- |
| **dev**   | `next dev`   | Starts the local development server.    |
| **build** | `next build` | Produces an optimized production build. |
| **start** | `next start` | Runs the production build locally.      |

<details>
<summary><strong>Tips</strong></summary>

- If the app needs DB access in dev, confirm `db:test` works first.
- In prod (Vercel), set all `DB_*` variables in Project → Settings → Environment Variables.
</details>

---

## 🔐 Required Environment Variables (recap)

| Variable      | Purpose                       | Example            |
| ------------- | ----------------------------- | ------------------ |
| `DB_HOST`     | DB hostname                   | `127.0.0.1`        |
| `DB_PORT`     | DB port                       | `3306`             |
| `DB_USER`     | DB username                   | `summitcare_admin` |
| `DB_PASSWORD` | DB password                   | `••••••••`         |
| `DB_NAME`     | DB name                       | `summitcare`       |
| `DB_SSL`      | Use TLS (prod often requires) | `true` / `false`   |

> Bonus: `TZ=America/Los_Angeles` keeps timestamps consistent during local dev.

---

## 🧪 First-Run Checklist (copy/paste)

```bash
npm run setup:env
npm run drizzle:pull
npm run db:test
npm run dev
```

- If `drizzle:pull` fails: verify DB creds, `DB_SSL`, user plugin (`mysql_native_password`), and that the DB is listening on `DB_PORT`.
- If `db:test` fails: try a raw connection script (`scripts/test-connection.ts`) to isolate client vs Drizzle import issues.

---

## 📝 Notes for Future Me

- Keep `.env.template` committed. Never commit real secrets.
- Use the same `DB_*` names across local, CI, and Vercel.
- If we switch databases in the future, these names still make sense.

---

Happy shipping! 🏔️
