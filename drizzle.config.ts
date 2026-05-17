/**
 * Drizzle Kit Configuration
 * 
 * Generates migrations and manages database schema.
 * 
 * Usage:
 *   npm run db:push          # Push schema changes to database
 *   npx drizzle-kit generate # Generate migration files
 *   npx drizzle-kit migrate  # Run migrations
 * 
 * IMPORTANT: Set DATABASE_URL in your .env file before running migrations!
 */

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set. Please add it to your .env file.");
  console.warn("   Example: DATABASE_URL=postgresql://user:password@host:5432/database");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema/**/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
