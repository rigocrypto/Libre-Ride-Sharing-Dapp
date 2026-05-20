/**
 * Audit Logs Schema
 *
 * Persistent admin/operator action trail for escrow and compliance workflows.
 */

import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { AuditAction } from "@shared/audit/types";

export const auditLogs = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").notNull(),
    actorRole: text("actor_role").notNull(),
    actorWallet: text("actor_wallet"),
    actionType: text("action_type").$type<AuditAction>().notNull(),
    rideId: text("ride_id"),
    previousEscrowState: text("previous_escrow_state"),
    nextEscrowState: text("next_escrow_state"),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    rideIdIdx: index("audit_log_ride_id_idx").on(table.rideId),
    actorUserIdIdx: index("audit_log_actor_user_id_idx").on(table.actorUserId),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
