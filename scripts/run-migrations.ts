import "dotenv/config";
import { runMigrations } from "../server/db/migrate";

if (!process.env.DATABASE_URL) {
  console.warn("[DB] Skipping migrations: DATABASE_URL is not set.");
} else if (process.env.STORAGE_ENGINE === "mem") {
  console.warn("[DB] Skipping migrations: STORAGE_ENGINE is 'mem'.");
} else {
  await runMigrations();
  console.log("[DB] All migrations applied.");
}
