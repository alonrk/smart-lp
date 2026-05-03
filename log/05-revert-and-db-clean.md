# 05 — Revert without new version + clean LP rows in DB

## Planned

- Revert to a prior snapshot should not insert a new `LandingPageVersion` or bump `currentVersion` in the “phantom” way.
- Normalize existing `LandingPage` / `LandingPageVersion` `contentJson` in the database.

## Done

- **`src/lib/lp-persist-normalize.ts`**: Centralizes `normalizeSavedLpContent`, `applyResolvedTheme`, `finalizeParsedContent`, `normalizePersistedLpContent`, and `parseLpContentJson` (used by `/api/chat` and cleanup).
- **`/api/chat`**: Uses `normalizePersistedLpContent` only (removed duplicate local helpers).
- **`POST /api/lp/[id]/versions`**: Revert now **only** updates the landing page: `contentJson`, tracking fields from snapshot, and **`currentVersion: v`** (the version reverted to). **No** pre-revert snapshot row and **no** `currentVersion + 1`.
- **`scripts/clean-landing-pages.ts`** + **`npm run db:clean-lp`**: Rewrites `contentJson` for every `LandingPage` and `LandingPageVersion` through `parseLpContentJson` + `normalizePersistedLpContent`.
- **Lp editor** History copy updated to describe revert behavior.

## Note

- After revert, the next **agent save** archives the current row then increments `currentVersion` (forward history). **`LandingPageVersion` rows with `version > v` are deleted on revert** so the timeline matches “back to v”.
- Before each archive insert (chat + PATCH), **existing snapshot rows for `landingPageId` + `currentVersion` are removed** so reverting to an older `currentVersion` cannot cause a unique-key error on the next save.

## Update — `db:clean-lp` appeared to do nothing

- **`tsx` does not load `.env`** like Next.js; `DATABASE_URL` was often unset or pointed at **`file:./prisma/dev.db`** while the real SQLite file only existed at **`prisma/prisma/dev.db`**, so the script opened an empty/wrong DB or skipped updates when JSON compared equal.
- **`scripts/load-env-and-db.ts`**: loads `.env` / `.env.local`, copies legacy **`prisma/prisma/dev.db` → `prisma/dev.db`** once if needed, and fixes **`DATABASE_URL`** when the configured file is missing.
- **`scripts/clean-landing-pages.ts`**: calls that loader first, **`await import("../src/lib/db")`** after env is set, and **always writes** normalized JSON (no skip-when-equal).

## Update — still “not clean” / wrong DB in the browser

- **`src/lib/sqlite-database-url.ts`** + **`src/lib/db.ts`**: the Next.js app now runs the **same** SQLite path fix as CLI scripts before `PrismaClient` is constructed (copy legacy DB if needed, repoint `DATABASE_URL`).
- **Normalize-only** cannot remove bad agent copy if `sections` is non-empty; use **`npm run db:reset-lp`** to replace every LP with **`defaultLpContent`** (title = page name, description = campaign goal), **`currentVersion: 1`**, and **delete all `LandingPageVersion` rows** for that page.
