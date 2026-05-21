import fs from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";

import { db } from "./client";

const optionalMissingTableCodes = new Set(["42P01"]);

export async function runProductionMigrations() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.STORAGE_ENGINE === "mem") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[DB] Skipping migrations: DATABASE_URL is not set.");
    return;
  }

  const migrationsDir = path.resolve(process.cwd(), "drizzle");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS libre_schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  let files: string[];
  try {
    files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();
  } catch (error: any) {
    console.warn(`[DB] Skipping migrations: ${error.message}`);
    return;
  }

  for (const file of files) {
    const applied = await db.execute(
      sql`SELECT id FROM libre_schema_migrations WHERE id = ${file} LIMIT 1`,
    );

    if (applied.rows.length > 0) continue;

    const migrationSql = await fs.readFile(path.join(migrationsDir, file), "utf8");

    try {
      await db.execute(sql.raw(migrationSql));
      await db.execute(sql`
        INSERT INTO libre_schema_migrations (id)
        VALUES (${file})
      `);
      console.log(`[DB] Applied migration ${file}`);
    } catch (error: any) {
      if (optionalMissingTableCodes.has(error?.code)) {
        console.warn(`[DB] Skipped migration ${file}: ${error.message}`);
        continue;
      }

      throw error;
    }
  }
}
