# 12 — SQLite error 14: absolute `DATABASE_URL`

## Problem

Runtime **`PrismaClientInitializationError`: Error code 14: Unable to open the database file** when calling Prisma from API routes / RSC. **`DATABASE_URL=file:./prisma/dev.db`** is resolved relative to **`process.cwd()`**, which may not be the repo root under Next.js + Turbopack, so SQLite opens the wrong path or a missing file.

## Done

- **`src/lib/sqlite-database-url.ts`**: Resolve **project root** by walking up until **`prisma/schema.prisma`** exists; build **`prisma/dev.db`** path from that root; set **`process.env.DATABASE_URL`** to **`pathToFileURL(absolutePath).href`** (`file:///…`) so SQLite always opens the correct file.

## Note

Restart **`npm run dev`** after pulling this change so the Prisma module reloads with the fixed env.
