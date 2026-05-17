/**
 * Driver Status Schema
 *
 * Real-time driver location and availability for acceptance flow.
 * Updated via REST (driver goes online/offline) and broadcasted via WS.
 *
 * V1: Simple lat/lng tracking. No geospatial index yet.
 */

import { pgTable, uuid, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const driverStatus = pgTable("driver_status", {
  driverId: uuid("driver_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  isOnline: boolean("is_online").notNull().default(false),

  // Current location
  lat: real("lat"),
  lng: real("lng"),

  // Last update timestamp (used for stale detection)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DriverStatus = typeof driverStatus.$inferSelect;
export type InsertDriverStatus = typeof driverStatus.$inferInsert;
