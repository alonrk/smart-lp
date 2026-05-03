# 10 — Single SQLite database (`prisma/dev.db`)

## Problem

Two files existed: **`prisma/dev.db`** and **`prisma/prisma/dev.db`**, with different rows. `.env` already used `DATABASE_URL=file:./prisma/dev.db`, but viewers could open the wrong file and see missing or stale data.

## Done

- **Merged** unique `LandingPage` rows from the legacy file into **`prisma/dev.db`**, then inserted **`LandingPageVersion`** rows only for those new pages (skipped legacy `cmok1k1r…|v1` to avoid clashing with the 14 existing versions on that LP).
- **Deleted** **`prisma/prisma/dev.db`** and removed the empty **`prisma/prisma`** directory.
- **`src/lib/sqlite-database-url.ts`**: Single canonical URL **`file:./prisma/dev.db`** whenever that file exists; legacy nested path only used as a **one-time bootstrap** copy if canonical is missing or tiny.
- **`README.md`**: Documents one DB path only.

## Resulting counts (canonical)

- **3** `LandingPage`, **16** `LandingPageVersion` (verified after merge).
