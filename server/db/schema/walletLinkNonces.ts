/**
 * Wallet Link Nonces Schema
 * 
 * Stores nonces for secure wallet ↔ Firebase account linking.
 * Replaces in-memory nonce storage with persistent DB.
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const walletLinkNonces = pgTable("wallet_link_nonces", {
  firebaseUid: text("firebase_uid").primaryKey(),
  nonce: text("nonce").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type WalletLinkNonce = typeof walletLinkNonces.$inferSelect;
export type InsertWalletLinkNonce = typeof walletLinkNonces.$inferInsert;

