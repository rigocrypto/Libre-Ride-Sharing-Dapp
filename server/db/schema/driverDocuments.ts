/**
 * Driver Documents Schema
 * 
 * Stores driver license and insurance documents for verification.
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const driverDocuments = pgTable("driver_documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // One document set per user

  licenseUrl: text("license_url"),
  insuranceUrl: text("insurance_url"),

  status: text("status")
    .$type<"pending" | "approved" | "rejected">()
    .default("pending"),

  rejectionReason: text("rejection_reason"),

  uploadedAt: timestamp("uploaded_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export type DriverDocument = typeof driverDocuments.$inferSelect;
export type InsertDriverDocument = typeof driverDocuments.$inferInsert;

