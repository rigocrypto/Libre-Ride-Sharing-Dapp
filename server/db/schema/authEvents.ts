/**
 * Auth Events Schema
 * 
 * Audit log for authentication and wallet-related events.
 * Tracks wallet linking, unlinking, SIWE logins, and admin actions.
 */

import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const authEvents = pgTable("auth_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // User reference
  userId: uuid("user_id").notNull(),
  
  // Event type
  eventType: text("event_type")
    .$type<"wallet_linked" | "wallet_unlinked" | "siwe_login" | "admin_override" | "wallet_link_attempt">()
    .notNull(),
  
  // Event metadata (JSON)
  metadata: jsonb("metadata").$type<{
    walletAddress?: string;
    chainId?: number;
    reason?: string;
    adminUserId?: string;
    ipAddress?: string;
    userAgent?: string;
    error?: string;
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

export type AuthEvent = typeof authEvents.$inferSelect;
export type InsertAuthEvent = typeof authEvents.$inferInsert;

