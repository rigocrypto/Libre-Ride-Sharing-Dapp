import fs from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";

import { db } from "./client";

const optionalMissingTableCodes = new Set(["42P01"]);

// Transient connection/startup failures (e.g. Neon cold-start on Render).
// These are safe to retry; real SQL errors (missing column, bad syntax) are not.
const transientConnectionCodes = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

function isTransientConnectionError(error: any): boolean {
  if (!error) return false;
  if (transientConnectionCodes.has(error.code)) return true;
  if (error.cause && isTransientConnectionError(error.cause)) return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("connection timeout") ||
    message.includes("connection terminated") ||
    message.includes("timeout exceeded") ||
    message.includes("etimedout") ||
    message.includes("econnreset")
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyMigrations() {
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

export async function runProductionMigrations() {
  if (process.env.NODE_ENV !== "production") return;

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await applyMigrations();
      return;
    } catch (error: any) {
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt || !isTransientConnectionError(error)) {
        throw error;
      }
      const backoffMs = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
      console.warn(
        `[DB] Migration attempt ${attempt}/${maxAttempts} failed with transient connection error: ${error.message}. Retrying in ${backoffMs}ms...`,
      );
      await delay(backoffMs);
    }
  }
}

export async function runMigrations() {
  await applyMigrations();
}
