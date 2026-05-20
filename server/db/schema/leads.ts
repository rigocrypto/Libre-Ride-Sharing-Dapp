import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const foundingDriverLeads = pgTable("founding_driver_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  city: text("city"),
  currentApps: text("current_apps").array(),
  yearsDriving: integer("years_driving"),
  vehicleType: text("vehicle_type"),
  hasCommercialInsurance: boolean("has_commercial_insurance"),
  interestedInAirport: boolean("interested_in_airport"),
  notes: text("notes"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const investorInterestLeads = pgTable("investor_interest_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  leadType: text("lead_type").notNull(),
  interestRange: text("interest_range"),
  accredited: text("accredited"),
  interestType: text("interest_type"),
  message: text("message"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FoundingDriverLead = typeof foundingDriverLeads.$inferSelect;
export type InsertFoundingDriverLead = typeof foundingDriverLeads.$inferInsert;
export type InvestorInterestLead = typeof investorInterestLeads.$inferSelect;
export type InsertInvestorInterestLead = typeof investorInterestLeads.$inferInsert;
