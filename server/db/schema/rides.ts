/**
 * Rides Schema
 * 
 * Core ride table with escrow integration.
 */

import { pgTable, text, timestamp, uuid, real, jsonb, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const rides = pgTable("rides", {
  id: uuid("id").defaultRandom().primaryKey(),

  riderId: uuid("rider_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  driverId: uuid("driver_id").references(() => users.id),

  status: text("status")
    .$type<"REQUESTED" | "OFFERED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">()
    .notNull()
    .default("REQUESTED"),

  // Location data
  pickupLocation: jsonb("pickup_location").$type<{ lat: number; lng: number; address: string }>(),
  dropoffLocation: jsonb("dropoff_location").$type<{ lat: number; lng: number; address: string }>(),

  // Pricing
  estimatedPrice: real("estimated_price"),
  finalPrice: real("final_price"),
  surgeMultiplier: real("surge_multiplier").default(1.0),
  fareWei: text("fare_wei"), // Fare in wei (for escrow)

  // Trip details
  distance: real("distance"), // in miles
  duration: integer("duration"), // in minutes
  airportFee: real("airport_fee").default(0),

  // Rewards
  cashbackAmount: real("cashback_amount").default(0),
  libreRewards: real("libre_rewards").default(0),

  // GPS proof
  routeHash: text("route_hash"),
  gpsProofs: jsonb("gps_proofs").$type<string[]>(),

  // Escrow fields
  escrowId: text("escrow_id"),
  escrowAddress: text("escrow_address"),
  escrowStatus: text("escrow_status")
    .$type<"pending" | "locked" | "released" | "refunded">()
    .default("pending"),
  escrowAmount: real("escrow_amount"),
  escrowTxHash: text("escrow_tx_hash"),
  escrowReleaseTxHash: text("escrow_release_tx_hash"),

  // Acceptance flow timestamps (V1 marketplace)
  offeredAt: timestamp("offered_at"), // When ride transitioned to OFFERED
  acceptedAt: timestamp("accepted_at"), // When driver accepted (assignment time)

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  matchedAt: timestamp("matched_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;

