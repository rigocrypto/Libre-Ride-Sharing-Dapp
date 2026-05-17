/**
 * Drizzle Database Client
 * 
 * Production-ready database connection using PostgreSQL.
 * Works with Neon, Supabase, RDS, Railway, etc.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isMemStorage = process.env.STORAGE_ENGINE === 'mem';

if (!process.env.DATABASE_URL && !isTest && !isMemStorage) {
  console.warn('[DB] DATABASE_URL not set. Database operations will fail.');
}

// Neon free tier has strict connection limits - use small pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings (optimized for Neon free tier)
  max: 5, // Neon free tier limit - DO NOT exceed (was 20, causing timeouts)
  min: 0, // Don't keep idle connections (Neon sleeps aggressively)
  idleTimeoutMillis: 20000, // Close idle connections quickly
  connectionTimeoutMillis: 5000, // Fail fast on connection issues (was 10000)
  // Keep connections alive with heartbeat
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Retry configuration
  allowExitOnIdle: true, // Allow pool to close when idle
});

// Handle pool errors with better logging
pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
  // Don't crash on pool errors - let individual queries handle retries
});

// Handle connection errors
pool.on('connect', () => {
  console.log('[DB] New connection established');
});

pool.on('remove', () => {
  console.log('[DB] Connection removed from pool');
});

export const db = drizzle(pool);

// Test connection on startup outside unit tests.
if (!isTest && !isMemStorage) {
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('[DB] ✅ Connected to PostgreSQL');
    })
    .catch((err) => {
      console.error('[DB] ❌ Failed to connect to PostgreSQL:', err.message);
      console.error('[DB] Make sure DATABASE_URL is set correctly');
    });
}
