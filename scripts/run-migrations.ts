import "dotenv/config";
import { runMigrations } from "../server/db/migrate";

await runMigrations();
console.log("[DB] All migrations applied.");
