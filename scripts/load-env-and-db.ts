import { existsSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { ensureSqliteDatabaseUrl } from "../src/lib/sqlite-database-url";

/**
 * For CLI scripts: load `.env` then apply the same SQLite path fix as `src/lib/db.ts`.
 */
export function loadEnvAndResolveDatabaseUrl(): void {
  const cwd = process.cwd();
  config({ path: path.join(cwd, ".env") });
  config({ path: path.join(cwd, ".env.local") });

  if (!process.env.DATABASE_URL?.trim()) {
    if (existsSync(path.join(cwd, "prisma", "dev.db"))) {
      process.env.DATABASE_URL = "file:./prisma/dev.db";
    } else if (existsSync(path.join(cwd, "prisma", "prisma", "dev.db"))) {
      process.env.DATABASE_URL = "file:./prisma/prisma/dev.db";
    }
  }

  ensureSqliteDatabaseUrl();
}
