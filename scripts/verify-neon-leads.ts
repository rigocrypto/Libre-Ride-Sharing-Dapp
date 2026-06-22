import "dotenv/config";
import { Client } from "pg";
import { runMigrations } from "../server/db/migrate";

const REQUIRED_TABLES = [
  "founding_driver_leads",
  "investor_interest_leads",
];

function getSslConfig() {
  const url = process.env.DATABASE_URL || "";

  if (url.includes("neon.tech") || url.includes("sslmode=require")) {
    return { rejectUnauthorized: true };
  }

  return undefined;
}

async function getExistingTables(client: Client) {
  const result = await client.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1)
    `,
    [REQUIRED_TABLES]
  );

  return result.rows.map((row) => row.table_name);
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

  const dbInfo = await client.query(`
    SELECT current_database() AS database, current_schema() AS schema, now() AS checked_at
  `);

  console.log("Connected to Neon:");
  console.table(dbInfo.rows);

  const beforeTables = await getExistingTables(client);
  const missingBefore = REQUIRED_TABLES.filter((table) => !beforeTables.includes(table));

  if (missingBefore.length === 0) {
    console.log("Lead tables already exist:");
    console.table(beforeTables);
    await client.end();
    return;
  }

  console.warn("Missing lead tables before migration:");
  console.table(missingBefore);

  await client.end();

  console.log("Running migrations...");
  await runMigrations();

  const verifyClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: getSslConfig(),
  });

  await verifyClient.connect();

  const afterTables = await getExistingTables(verifyClient);
  const missingAfter = REQUIRED_TABLES.filter((table) => !afterTables.includes(table));

  if (missingAfter.length > 0) {
    console.error("Migrations completed, but these tables are still missing:");
    console.table(missingAfter);
    await verifyClient.end();
    process.exit(1);
  }

  console.log("Lead tables verified after migration:");
  console.table(afterTables);

  await verifyClient.end();
}

main().catch((error) => {
  console.error("Neon verification failed:");
  console.error(error);
  process.exit(1);
});
