/**
 * Users Schema
 * 
 * Core user table with Firebase authentication and wallet linking.
 */

import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Firebase authentication (primary auth identifier)
  firebaseUid: text("firebase_uid").notNull().unique(),

  // User info
  email: text("email").notNull(),
  username: text("username"),
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),

  // Role
  role: text("role")
    .$type<"rider" | "driver" | "admin">()
    .notNull()
    .default("rider"),

  // Wallet linking
  walletAddress: text("wallet_address").unique(),
  walletVerifiedAt: timestamp("wallet_verified_at"),

  // SIWE (Sign-In With Ethereum) verification
  siweVerifiedAt: timestamp("siwe_verified_at"),

  // Identity verification
  identityVerified: boolean("identity_verified").default(false),
  identityVerifiedAt: timestamp("identity_verified_at"),

  // Driver status
  driverStatus: text("driver_status")
    .$type<
      | "unverified"
      | "pending"
      | "pending_review"
      | "approved"
      | "rejected"
      | "suspended"
      | "expired_documents"
      | "requires_manual_review"
    >()
    .default("unverified"),

  // Auth provider
  authProvider: text("auth_provider")
    .$type<"email" | "google" | "apple">(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
