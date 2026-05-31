import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (both riders and drivers)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: text("firebase_uid").unique(), // Primary auth identifier (from Firebase)
  walletAddress: text("wallet_address").unique(),
  walletVerifiedAt: timestamp("wallet_verified_at"), // When wallet was linked via signature
  siweVerifiedAt: timestamp("siwe_verified_at"), // When SIWE verification completed
  email: text("email"),
  username: text("username"),
  role: text("role").notNull(), // "rider" | "driver" | "admin"
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
  identityVerified: boolean("identity_verified").default(false),
  identityVerifiedAt: timestamp("identity_verified_at"),
  authProvider: text("auth_provider"), // "email" | "google" | "apple"
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver-specific data
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  driverStatus: text("driver_status").notNull().default("unverified"), // "unverified" | "pending" | "approved" | "rejected"
  driverApprovedAt: timestamp("driver_approved_at"),
  driverRejectedAt: timestamp("driver_rejected_at"),
  rejectionReason: text("rejection_reason"),
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
  status: text("status").notNull(), // "REQUESTED" | "OFFERED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
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
  // Escrow fields
  escrowId: text("escrow_id"), // On-chain escrow contract ID
  escrowAddress: text("escrow_address"), // Escrow contract address
  escrowStatus: text("escrow_status").default("pending"), // "pending" | "locked" | "released" | "refunded"
  escrowAmount: real("escrow_amount"), // Amount locked in escrow
  escrowTxHash: text("escrow_tx_hash"), // Transaction hash for escrow creation
  escrowReleaseTxHash: text("escrow_release_tx_hash"), // Transaction hash for escrow release
  // Acceptance flow timestamps
  offeredAt: timestamp("offered_at"), // When ride transitioned to OFFERED
  acceptedAt: timestamp("accepted_at"), // When driver accepted (assignment time)
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

// Driver Real-Time Status (for acceptance flow)
export const driverStatus = pgTable("driver_status", {
  driverId: varchar("driver_id").primaryKey().references(() => users.id),
  isOnline: boolean("is_online").notNull().default(false),
  lat: real("lat"),
  lng: real("lng"),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Driver Identity Photos (FL TNC Law Required)
export const driverPhotos = pgTable("driver_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  photoType: text("photo_type").notNull(), // "profile" | "license_front" | "license_back"
  photoUrl: text("photo_url").notNull(),
  photoHash: text("photo_hash"), // IPFS or hash for on-chain reference
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verificationStatus: text("verification_status").default("pending"), // "pending" | "verified" | "rejected"
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle Photos & Documentation (FL TNC Law Required - Visible to Riders)
export const vehiclePhotos = pgTable("vehicle_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  photoType: text("photo_type").notNull(), // "front" | "side" | "back" | "license_plate" | "vin" | "interior"
  photoUrl: text("photo_url").notNull(),
  photoHash: text("photo_hash"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verificationStatus: text("verification_status").default("pending"),
  ocrData: jsonb("ocr_data").$type<{ licensePlate?: string; vin?: string; color?: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insurance Document Upload
export const insuranceDocuments = pgTable("insurance_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  documentUrl: text("document_url").notNull(),
  documentHash: text("document_hash"),
  policyNumber: text("policy_number"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  coverageAmount: real("coverage_amount"),
  ocrVerified: boolean("ocr_verified").default(false),
  verificationStatus: text("verification_status").default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Background Check Document
export const backgroundCheckDocuments = pgTable("background_check_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  documentUrl: text("document_url").notNull(),
  documentHash: text("document_hash"),
  checkDate: timestamp("check_date"),
  nextReviewDate: timestamp("next_review_date"),
  verificationStatus: text("verification_status").default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rider Identity Photos (Optional)
export const riderPhotos = pgTable("rider_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  riderId: varchar("rider_id").notNull().references(() => users.id),
  photoUrl: text("photo_url").notNull(),
  photoHash: text("photo_hash"),
  livenessVerified: boolean("liveness_verified").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// COMPLIANCE GATE FOUNDATION - Phase 1 Critical Blockers
// =============================================================================

// Audit Events - Immutable log of all critical actions (append-only)
export const auditEvents = pgTable("audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Event classification
  eventType: text("event_type").notNull(), // See AUDIT_EVENT_TYPES constant below
  actorUserId: varchar("actor_user_id").references(() => users.id), // Who triggered it
  actorRole: text("actor_role"), // "driver" | "rider" | "admin"

  // Target tracking
  targetType: text("target_type").notNull(), // "driver" | "ride" | "escrow" | "insurance" | "eligibility"
  targetId: varchar("target_id").notNull(), // The primary resource ID

  // Contextual IDs (denormalized for query performance)
  rideId: varchar("ride_id").references(() => rides.id),
  driverId: varchar("driver_id").references(() => users.id),
  riderId: varchar("rider_id").references(() => users.id),
  escrowTxHash: text("escrow_tx_hash"),

  // Payload & metadata
  metadata: jsonb("metadata").default({}), // Flexible JSON for event-specific data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Immutable timestamp (no updates)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insurance Policies - Detailed insurance tracking with verification
export const insurancePolicies = pgTable("insurance_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Association
  driverId: varchar("driver_id").notNull().references(() => users.id),
  vehicleId: varchar("vehicle_id").references(() => users.id), // TODO: link to vehicle table if created

  // Policy details
  carrierName: text("carrier_name").notNull(),
  policyNumber: text("policy_number").notNull(),
  coverageType: text("coverage_type").notNull(), // "personal" | "commercial" | "tnc_endorsement"
  hasTncEndorsement: boolean("has_tnc_endorsement").default(false), // Critical for TNC compliance
  hasCommercialCoverage: boolean("has_commercial_coverage").default(false),
  coverageAmount: real("coverage_amount"), // In USD

  // Validity windows
  effectiveDate: text("effective_date").notNull(), // YYYY-MM-DD
  expirationDate: text("expiration_date").notNull(), // YYYY-MM-DD

  // Documentation
  documentUrl: text("document_url").notNull(),
  documentHash: text("document_hash"),

  // Review & verification
  status: text("status").default("pending").notNull(), // "pending" | "approved" | "rejected" | "expired"
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id), // Admin who verified

  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Driver Eligibility Snapshots - Single source of truth for ride eligibility
// Recalculated whenever compliance status changes
export const driverEligibilitySnapshots = pgTable("driver_eligibility_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  driverId: varchar("driver_id").notNull().references(() => users.id),

  // Individual verification gates
  identityVerified: boolean("identity_verified").default(false),
  licenseVerified: boolean("license_verified").default(false),
  backgroundCheckApproved: boolean("background_check_approved").default(false),
  insuranceVerified: boolean("insurance_verified").default(false),
  vehicleApproved: boolean("vehicle_approved").default(false),
  vehicleInspectionApproved: boolean("vehicle_inspection_approved").default(false),
  walletVerified: boolean("wallet_verified").default(false),

  // Optional gates
  airportEligible: boolean("airport_eligible").default(false),
  subscriptionActive: boolean("subscription_active").default(false),

  // Composite eligibility (calculated from gates)
  canGoOnline: boolean("can_go_online").default(false),
  canAcceptGeneralRides: boolean("can_accept_general_rides").default(false),
  canAcceptAirportRides: boolean("can_accept_airport_rides").default(false),

  // Reasoning for audit trail
  blockingReasons: jsonb("blocking_reasons").default(sql`'[]'::jsonb`), // Array of strings explaining why gates failed
  warnings: jsonb("warnings").default(sql`'[]'::jsonb`), // Array of non-blocking warnings

  // Versioning for audit trail
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  previousEligibilitySnapshotId: varchar("previous_eligibility_snapshot_id"),
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

// Photo & Document Schemas
export const insertDriverPhotosSchema = createInsertSchema(driverPhotos).omit({ id: true, createdAt: true });
export const insertVehiclePhotosSchema = createInsertSchema(vehiclePhotos).omit({ id: true, createdAt: true });
export const insertInsuranceDocumentsSchema = createInsertSchema(insuranceDocuments).omit({ id: true, createdAt: true });
export const insertBackgroundCheckDocumentsSchema = createInsertSchema(backgroundCheckDocuments).omit({ id: true, createdAt: true });
export const insertRiderPhotosSchema = createInsertSchema(riderPhotos).omit({ id: true, createdAt: true });

// Compliance Gate Foundation Schemas
export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({ id: true, createdAt: true });
export const insertInsurancePolicySchema = createInsertSchema(insurancePolicies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDriverEligibilitySnapshotSchema = createInsertSchema(driverEligibilitySnapshots).omit({ id: true, calculatedAt: true });

// Audit event type constant
export const AUDIT_EVENT_TYPES = [
  "DRIVER_CREATED",
  "DRIVER_DOCUMENT_UPLOADED",
  "INSURANCE_SUBMITTED",
  "INSURANCE_APPROVED",
  "INSURANCE_REJECTED",
  "DRIVER_ELIGIBILITY_RECALCULATED",
  "DRIVER_APPROVED",
  "DRIVER_SUSPENDED",
  "RIDE_REQUESTED",
  "RIDE_ACCEPTED",
  "RIDE_ACCEPT_BLOCKED",
  "RIDE_STARTED",
  "RIDE_COMPLETED",
  "RIDE_CANCELLED",
  "ESCROW_DEPOSIT_INITIATED",
  "ESCROW_FUNDED",
  "ESCROW_RELEASED",
  "ESCROW_REFUNDED",
  "ESCROW_DISPUTED",
  "PIN_VERIFICATION_CREATED",
  "PIN_VERIFICATION_PASSED",
  "PIN_VERIFICATION_FAILED",
  "INCIDENT_REPORTED",
  "ADMIN_OVERRIDE_USED",
] as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[number];

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

// Compliance Gate Foundation Types
export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type InsertInsurancePolicy = z.infer<typeof insertInsurancePolicySchema>;

export type DriverEligibilitySnapshot = typeof driverEligibilitySnapshots.$inferSelect;
export type InsertDriverEligibilitySnapshot = z.infer<typeof insertDriverEligibilitySnapshotSchema>;

// Eligibility calculation result (runtime type)
export type DriverEligibilityResult = {
  driverId: string;
  identityVerified: boolean;
  licenseVerified: boolean;
  backgroundCheckApproved: boolean;
  insuranceVerified: boolean;
  vehicleApproved: boolean;
  vehicleInspectionApproved: boolean;
  walletVerified: boolean;
  airportEligible: boolean;
  subscriptionActive: boolean;
  canGoOnline: boolean;
  canAcceptGeneralRides: boolean;
  canAcceptAirportRides: boolean;
  blockingReasons: string[];
  warnings: string[];
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

// Photo & Document Types
export type DriverPhoto = typeof driverPhotos.$inferSelect;
export type InsertDriverPhoto = z.infer<typeof insertDriverPhotosSchema>;

export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;
export type InsertVehiclePhoto = z.infer<typeof insertVehiclePhotosSchema>;

export type InsuranceDocument = typeof insuranceDocuments.$inferSelect;
export type InsertInsuranceDocument = z.infer<typeof insertInsuranceDocumentsSchema>;

export type BackgroundCheckDocument = typeof backgroundCheckDocuments.$inferSelect;
export type InsertBackgroundCheckDocument = z.infer<typeof insertBackgroundCheckDocumentsSchema>;

export type RiderPhoto = typeof riderPhotos.$inferSelect;
export type InsertRiderPhoto = z.infer<typeof insertRiderPhotosSchema>;

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
  REQUIRED_DRIVER_PHOTOS: ["profile", "license_front", "license_back"],
  REQUIRED_VEHICLE_PHOTOS: ["front", "side", "back", "license_plate"],
} as const;
