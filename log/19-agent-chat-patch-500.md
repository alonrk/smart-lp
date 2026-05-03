## Cause

`PATCH /api/lp/[id]` with `agentMessages` updates **`agentChatJson`**. The canonical SQLite file **`prisma/dev.db`** did not have that column (schema drift). Prisma threw at runtime → **500**.

A stray **`prisma/prisma/dev.db`** could appear again if **`prisma db push`** runs with cwd inside **`prisma/`** (`file:./prisma/dev.db` resolves to nested path)—that DB had the column while the app uses **`ensureSqliteDatabaseUrl`** → **`prisma/dev.db`**.

## Done

- **`ALTER TABLE`** on **`prisma/dev.db`**: added **`agentChatJson TEXT NOT NULL DEFAULT '[]'`**.
- **`serializeAgentMessagesForApi`** in **`agent-chat-persist.ts`** so PATCH bodies are always JSON-safe (bigint / odd UI message shapes).
- **`PATCH` handler**: safe **`JSON.stringify`** for agent payload; **try/catch** around **`prisma.landingPage.update`** with logged errors.
- Removed accidental **`prisma/prisma/dev.db`** again.

After pulling schema changes, run **`npm run db:push`** (or **`npx prisma db push`**) from the **repository root** so **`DATABASE_URL=file:./prisma/dev.db`** targets the same file the app uses. Then run **`npx prisma generate`** (or **`npm install`**, which runs postinstall) and **restart `next dev`** so the Prisma client in memory includes **`agentChatJson`**.

`PATCH` now calls **`ensureSqliteDatabaseUrl()`** first, wraps **`req.json()`**, and returns **`prismaCode` / `prismaMeta`** on 500 for easier debugging.
