import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (both riders and drivers)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").unique(),
  email: text("email"),
  username: text("username"),
  role: text("role").notNull(), // "rider" | "driver" | "admin"
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver-specific data
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  isOnline: boolean("is_online").default(false),
  currentLocation: jsonb("current_location").$type<{ lat: number; lng: number }>(),
  vehicleType: text("vehicle_type"), // "sedan" | "suv" | "premium"
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: integer("vehicle_year"),
  vehicleColor: text("vehicle_color"),
  licensePlate: text("license_plate"),
  licenseNumber: text("license_number"),
  insuranceDoc: text("insurance_doc"),
  vehicleRegistration: text("vehicle_registration"),
  isVerified: boolean("is_verified").default(false),
  isAirportLicensed: boolean("is_airport_licensed").default(false),
  reputationScore: real("reputation_score").default(5.0),
  totalRides: integer("total_rides").default(0),
  totalEarnings: real("total_earnings").default(0),
  acceptanceRate: real("acceptance_rate").default(100),
  onTimeRate: real("on_time_rate").default(100),
  weeklyEarnings: real("weekly_earnings").default(0),
});

// Rides
export const rides = pgTable("rides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  riderId: varchar("rider_id").notNull().references(() => users.id),
  driverId: varchar("driver_id").references(() => users.id),
  status: text("status").notNull(), // "matching" | "en_route" | "arrived" | "on_trip" | "completed" | "cancelled"
  pickupLocation: jsonb("pickup_location").notNull().$type<{ lat: number; lng: number; address: string }>(),
  dropoffLocation: jsonb("dropoff_location").notNull().$type<{ lat: number; lng: number; address: string }>(),
  estimatedPrice: real("estimated_price").notNull(),
  finalPrice: real("final_price"),
  surgeMultiplier: real("surge_multiplier").default(1.0),
  distance: real("distance"), // in miles
  duration: integer("duration"), // in minutes
  airportFee: real("airport_fee").default(0),
  cashbackAmount: real("cashback_amount").default(0),
  routeHash: text("route_hash"), // For GPS proof
  gpsProofs: jsonb("gps_proofs").$type<string[]>(), // Array of hashed GPS snapshots
  libreRewards: real("libre_rewards").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  matchedAt: timestamp("matched_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Badges (NFT achievements)
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeType: text("badge_type").notNull(), // "rides_100" | "rides_1000" | "five_star" | "airport_licensed"
  tokenId: text("token_id"), // NFT token ID on-chain
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Waitlist
export const waitlist = pgTable("waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  userType: text("user_type"), // "rider" | "driver"
  createdAt: timestamp("created_at").defaultNow(),
});

// SOS alerts
export const sosAlerts = pgTable("sos_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").notNull().references(() => rides.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  location: jsonb("location").notNull().$type<{ lat: number; lng: number }>(),
  message: text("message"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Disputes
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").notNull().references(() => rides.id),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // "pending" | "investigating" | "resolved"
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Referrals
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").references(() => users.id),
  referralCode: text("referral_code").notNull().unique(),
  rewardAmount: real("reward_amount").default(5.0),
  claimed: boolean("claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Florida/Orlando Compliance: Driver Background Checks (§627.748)
export const driverCompliance = pgTable("driver_compliance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  floridasLicenseNumber: text("florida_license_number"),
  backgroundCheckStatus: text("background_check_status").default("pending"), // "pending" | "approved" | "rejected"
  backgroundCheckDate: timestamp("background_check_date"),
  drivingHistoryStatus: text("driving_history_status").default("pending"), // "clean" | "violations"
  sexOffenderRegistryCheck: boolean("sex_offender_registry_check").default(false),
  lastComplianceReview: timestamp("last_compliance_review"),
  nextReviewDue: timestamp("next_review_due"),
  suspensionStatus: text("suspension_status"), // null | "alcohol_complaint" | "violent_behavior" | "fraud_alert"
  suspensionReason: text("suspension_reason"),
  suspendedUntil: timestamp("suspended_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Florida Compliance: Vehicle Inspection
export const vehicleCompliance = pgTable("vehicle_compliance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  vinNumber: text("vin_number"),
  yearOfManufacture: integer("year_of_manufacture"),
  vehicleAgeCompliant: boolean("vehicle_age_compliant").default(false), // 15+ years requirement
  inspectionDate: timestamp("inspection_date"),
  registrationValid: boolean("registration_valid").default(false),
  fourDoorCompliant: boolean("four_door_compliant").default(false),
  wheelchairAccessible: boolean("wheelchair_accessible").default(false),
  airportLicenseEligible: boolean("airport_license_eligible").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Florida Compliance: Insurance Validation (TNC Rules)
export const insuranceValidation = pgTable("insurance_validation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  insuranceCarrier: text("insurance_carrier"),
  policyNumber: text("policy_number"),
  expirationDate: timestamp("expiration_date"),
  activeCoverageAmount: real("active_coverage_amount"), // $1M during rides
  onlineButNotMatchedAmount: real("online_but_not_matched_amount"), // $50k requirement
  coverageVerified: boolean("coverage_verified").default(false),
  verificationDate: timestamp("verification_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// City of Orlando: TNC Permit & Registration
export const orlandoPermit = pgTable("orlando_permit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  permitNumber: text("permit_number").unique(),
  businessTaxReceipt: text("business_tax_receipt"),
  permitStatus: text("permit_status").default("pending"), // "pending" | "approved" | "expired" | "denied"
  permitExpirationDate: timestamp("permit_expiration_date"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Airport Fees & Revenue Share (MCO Geofencing)
export const airportOperations = pgTable("airport_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").notNull().references(() => rides.id),
  isAirportPickup: boolean("is_airport_pickup").default(false),
  isAirportDropoff: boolean("is_airport_dropoff").default(false),
  airportFeePaid: real("airport_fee_paid").default(0),
  cityInfrastructureFee: real("city_infrastructure_fee").default(0), // 1-2% fee
  paidToAirportWallet: boolean("paid_to_airport_wallet").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance Audit Log (for regulatory access)
export const complianceAuditLog = pgTable("compliance_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  auditType: text("audit_type").notNull(), // "background_check" | "vehicle_inspection" | "insurance_review" | "permit_renewal"
  auditResult: text("audit_result"), // "passed" | "failed" | "review_needed"
  auditNotes: text("audit_notes"),
  auditedBy: varchar("audited_by"), // admin ID
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export const insertRideSchema = createInsertSchema(rides).omit({ 
  id: true, 
  createdAt: true, 
  matchedAt: true, 
  startedAt: true, 
  completedAt: true 
});
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, earnedAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
export const insertSOSAlertSchema = createInsertSchema(sosAlerts).omit({ id: true, createdAt: true });
export const insertDisputeSchema = createInsertSchema(disputes).omit({ 
  id: true, 
  createdAt: true, 
  resolvedAt: true 
});
export const insertReferralSchema = createInsertSchema(referrals).omit({ 
  id: true, 
  createdAt: true 
});

// Compliance Schemas
export const insertDriverComplianceSchema = createInsertSchema(driverCompliance).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehicleComplianceSchema = createInsertSchema(vehicleCompliance).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInsuranceValidationSchema = createInsertSchema(insuranceValidation).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrlandoPermitSchema = createInsertSchema(orlandoPermit).omit({ id: true, createdAt: true });
export const insertAirportOperationsSchema = createInsertSchema(airportOperations).omit({ id: true, createdAt: true });
export const insertComplianceAuditLogSchema = createInsertSchema(complianceAuditLog).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

export type SOSAlert = typeof sosAlerts.$inferSelect;
export type InsertSOSAlert = z.infer<typeof insertSOSAlertSchema>;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Extended types for UI
export type RideWithDetails = Ride & {
  rider?: User;
  driver?: User & { driverDetails?: Driver };
};

export type DriverProfile = User & {
  driverDetails: Driver;
  badges: Badge[];
};

export type RiderProfile = User & {
  badges: Badge[];
  totalRides: number;
  totalSpent: number;
};

// Orlando-specific constants
export const ORLANDO_LOCATIONS = {
  MCO_AIRPORT: { lat: 28.4294, lng: -81.3089, name: "Orlando International Airport (MCO)" },
  INTERNATIONAL_DRIVE: { lat: 28.4567, lng: -81.4694, name: "International Drive" },
  DISNEY_SPRINGS: { lat: 28.3719, lng: -81.5186, name: "Disney Springs" },
  UNIVERSAL_STUDIOS: { lat: 28.4743, lng: -81.4677, name: "Universal Studios Orlando" },
  DISNEY_WORLD: { lat: 28.385, lng: -81.563, name: "Walt Disney World" },
} as const;

// Surge pricing tiers
export const SURGE_TIERS = [1.0, 1.05, 1.10, 1.15, 1.25] as const;

// Badge types
export const BADGE_TYPES = {
  RIDES_100: "rides_100",
  RIDES_1000: "rides_1000",
  FIVE_STAR: "five_star",
  AIRPORT_LICENSED: "airport_licensed",
} as const;

// Compliance types
export type DriverCompliance = typeof driverCompliance.$inferSelect;
export type InsertDriverCompliance = z.infer<typeof insertDriverComplianceSchema>;

export type VehicleCompliance = typeof vehicleCompliance.$inferSelect;
export type InsertVehicleCompliance = z.infer<typeof insertVehicleComplianceSchema>;

export type InsuranceValidation = typeof insuranceValidation.$inferSelect;
export type InsertInsuranceValidation = z.infer<typeof insertInsuranceValidationSchema>;

export type OrlandoPermit = typeof orlandoPermit.$inferSelect;
export type InsertOrlandoPermit = z.infer<typeof insertOrlandoPermitSchema>;

export type AirportOperations = typeof airportOperations.$inferSelect;
export type InsertAirportOperations = z.infer<typeof insertAirportOperationsSchema>;

// Florida compliance constants
export const FLORIDA_COMPLIANCE = {
  MIN_DRIVER_AGE: 21,
  MIN_VEHICLE_YEAR: 2009, // 15+ years from 2024
  ACTIVE_COVERAGE_REQUIRED: 1000000, // $1M
  ONLINE_NOT_MATCHED_COVERAGE: 50000, // $50k
  MCO_AIRPORT_RADIUS_MILES: 2,
  AIRPORT_SURCHARGE: 3.5,
  CITY_INFRASTRUCTURE_FEE_PERCENT: 0.015, // 1.5%
  BACKGROUND_CHECK_VALIDITY_YEARS: 3,
  COMPLIANCE_REVIEW_INTERVAL_MONTHS: 36,
} as const;
