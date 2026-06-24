/**
 * Safe cleanup for founding-driver SMOKE-TEST leads only.
 *
 * The production smoke test (scripts/smoke-founders-flow.ts) inserts a real,
 * persisting lead whose email always ends with `@libre-smoke.test`. This script
 * removes ONLY those synthetic rows from `founding_driver_leads`. It will never
 * touch a real registration, because the WHERE clause is locked to the
 * `@libre-smoke.test` suffix.
 *
 * Connects straight to Neon via DATABASE_URL (no API/Render involved).
 *
 * Usage:
 *   # 1. See how many smoke rows WOULD be deleted (no changes made):
 *   npm run smoke:founders:cleanup -- --dry-run
 *
 *   # 2. Only after confirming the rows are test data, actually delete them:
 *   npm run smoke:founders:cleanup
 *
 * Safety guarantees:
 *   - Matches strictly emails ending in `@libre-smoke.test` (case-insensitive).
 *   - --dry-run performs a SELECT/COUNT only; it issues no DELETE.
 *   - Always logs the affected count.
 */
import "dotenv/config";
import { Client } from "pg";

// The one and only suffix we are ever allowed to delete. Do not parameterize
// this from the CLI — keeping it hard-coded is the safety guarantee.
const SMOKE_SUFFIX = "@libre-smoke.test";
const EMAIL_MATCH = `%${SMOKE_SUFFIX}`;

const isDryRun = process.argv.includes("--dry-run");

function getSslConfig() {
  const url = process.env.DATABASE_URL || "";
  if (url.includes("neon.tech") || url.includes("sslmode=require")) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env or .env.local.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: getSslConfig(),
  });

  await client.connect();

  try {
    // Preview the rows that match the smoke-test suffix.
    const matches = await client.query<{ id: string; email: string; created_at: Date }>(
      `SELECT id, email, created_at
         FROM founding_driver_leads
        WHERE LOWER(email) LIKE LOWER($1)
        ORDER BY created_at ASC`,
      [EMAIL_MATCH]
    );

    console.log(`Smoke-test leads matching "*${SMOKE_SUFFIX}": ${matches.rowCount}`);
    if (matches.rowCount && matches.rowCount > 0) {
      console.table(
        matches.rows.map((r) => ({
          email: r.email,
          created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        }))
      );
    }

    if (isDryRun) {
      console.log(`\n[dry-run] No rows deleted. Re-run without --dry-run to delete ${matches.rowCount} row(s).`);
      return;
    }

    if (!matches.rowCount || matches.rowCount === 0) {
      console.log("\nNothing to delete. ✅");
      return;
    }

    const deleted = await client.query(
      `DELETE FROM founding_driver_leads
        WHERE LOWER(email) LIKE LOWER($1)`,
      [EMAIL_MATCH]
    );

    console.log(`\n✅ Deleted ${deleted.rowCount} smoke-test lead(s). Real registrations untouched.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Smoke-lead cleanup failed:");
  console.error(error);
  process.exit(1);
});
