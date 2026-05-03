import { existsSync, mkdirSync, copyFileSync, statSync } from "fs";
import path from "path";
import { pathToFileURL } from "node:url";

/** Walk up from cwd until `prisma/schema.prisma` exists so DB path works even if cwd ≠ project root. */
function resolveProjectRoot(): string {
  let dir = path.resolve(process.cwd());
  for (let i = 0; i < 40; i++) {
    if (existsSync(path.join(dir, "prisma", "schema.prisma"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd());
}

/**
 * Resolve SQLite to a single canonical file: **`prisma/dev.db`**.
 *
 * Uses an **absolute** `file:` URL so Prisma/SQLite can open the DB even when the Node
 * process cwd is not the repo root (avoids SQLite error 14 with Turbopack / monorepos).
 *
 * Legacy clones under **`prisma/prisma/dev.db`** are copied once if the canonical file is missing.
 */
export function ensureSqliteDatabaseUrl(): void {
  const url = process.env.DATABASE_URL?.trim();
  if (!url?.startsWith("file:")) {
    return;
  }

  const root = resolveProjectRoot();
  const nestedLegacy = path.join(root, "prisma", "prisma", "dev.db");
  const canonical = path.join(root, "prisma", "dev.db");

  mkdirSync(path.dirname(canonical), { recursive: true });

  const nestedBytes =
    existsSync(nestedLegacy) ? statSync(nestedLegacy).size : 0;

  if (!existsSync(canonical) && existsSync(nestedLegacy)) {
    copyFileSync(nestedLegacy, canonical);
    console.warn(
      "[sqlite] Created prisma/dev.db from prisma/prisma/dev.db (legacy path)",
    );
  }

  if (existsSync(canonical) && existsSync(nestedLegacy)) {
    const cbytes = statSync(canonical).size;
    if (cbytes < 4096 && nestedBytes > cbytes + 1024) {
      copyFileSync(nestedLegacy, canonical);
      console.warn(
        "[sqlite] Replaced empty/stale prisma/dev.db from prisma/prisma/dev.db",
      );
    }
  }

  if (existsSync(canonical)) {
    process.env.DATABASE_URL = pathToFileURL(canonical).href;
  }
}
