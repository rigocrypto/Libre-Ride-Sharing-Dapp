/**
 * Driver Documents Schema
 * 
 * Stores driver license and insurance documents for verification.
 */

import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const driverDocuments = pgTable("driver_documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // One document set per user

  licenseUrl: text("license_url"),
  insuranceUrl: text("insurance_url"),
  licenseExpiresAt: timestamp("license_expires_at", { withTimezone: true }),
  insuranceExpiresAt: timestamp("insurance_expires_at", { withTimezone: true }),
  inspectionExpiresAt: timestamp("inspection_expires_at", { withTimezone: true }),
  permitExpiresAt: timestamp("permit_expires_at", { withTimezone: true }),

  status: text("status")
    .$type<"pending" | "approved" | "rejected">()
    .default("pending"),
  licenseStatus: text("license_status").default("pending"),
  insuranceStatus: text("insurance_status").default("pending"),
  vehicleInspectionStatus: text("vehicle_inspection_status").default("pending"),
  backgroundCheckStatus: text("background_check_status").default("pending"),
  orlandoPermitStatus: text("orlando_permit_status").default("pending"),
  airportEligibilityStatus: text("airport_eligibility_status").default("pending"),
  orlandoPermitNumber: text("orlando_permit_number"),
  orlandoPermitExpiresAt: timestamp("orlando_permit_expires_at", { withTimezone: true }),
  mcoAirportEligible: boolean("mco_airport_eligible").default(false),
  mcoEligibilityGrantedAt: timestamp("mco_eligibility_granted_at", { withTimezone: true }),
  backgroundCheckProvider: text("background_check_provider"),
  backgroundCheckCompletedAt: timestamp("background_check_completed_at", { withTimezone: true }),

  rejectionReason: text("rejection_reason"),

  uploadedAt: timestamp("uploaded_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  nextReviewDueAt: timestamp("next_review_due_at", { withTimezone: true }),
});

export type DriverDocument = typeof driverDocuments.$inferSelect;
export type InsertDriverDocument = typeof driverDocuments.$inferInsert;
