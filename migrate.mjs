// migrate.mjs — run Drizzle SQL migrations at container startup.
// Uses only `pg` (no drizzle-kit) so it works inside the standalone output.

import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[migrate] DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

async function main() {
  // Read migration files in order
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => extname(f) === ".sql")
    .sort(); // 0000_… before 0001_… etc.

  if (files.length === 0) {
    console.log("[migrate] No migration files found — skipping");
    await pool.end();
    return;
  }

  console.log(`[migrate] Running ${files.length} migration(s)...`);

  for (const file of files) {
    const path = join(MIGRATIONS_DIR, file);
    const sql = await readFile(path, "utf-8");

    // Split by drizzle-kit's `--> statement-breakpoint` separator
    const statements = sql
      .split(/--> statement-breakpoint\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        // If table/index already exists, skip (idempotent)
        if (err.code === "42P07" || err.code === "42P16") {
          console.log(`[migrate] Skipping ${file} (already applied)`);
          break;
        }
        throw err;
      }
    }

    console.log(`[migrate] ✓ ${file}`);
  }

  await pool.end();
  console.log("[migrate] Done");
}

main().catch((err) => {
  console.error("[migrate] Failed:", err.message);
  process.exit(1);
});
