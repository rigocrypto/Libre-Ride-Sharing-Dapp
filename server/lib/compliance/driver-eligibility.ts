import { db } from "@server/db/client";
import {
  drivers,
  users,
  driverEligibilitySnapshots,
  insurancePolicies,
  DriverEligibilityResult,
  InsertDriverEligibilitySnapshot,
  type DriverEligibilitySnapshot,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { createAuditEvent } from "./audit-events";

/**
 * Calculate whether a driver is eligible to accept rides.
 * This is the single source of truth for all ride-gating decisions.
 *
 * Hard rules:
 * - Cannot accept rides without: identity verified, license verified, background check approved, insurance verified, vehicle approved, wallet verified
 * - Cannot accept airport rides without: general eligibility + airport eligibility
 *
 * These rules are non-negotiable for Florida TNC compliance and passenger safety.
 */
export async function calculateDriverEligibility(
  driverId: string
): Promise<DriverEligibilityResult> {
  // Fetch driver, user, and compliance status
  const driver = await db.query.drivers.findFirst({
    where: eq(drivers.id, driverId),
  });

  if (!driver) {
    return {
      driverId,
      identityVerified: false,
      licenseVerified: false,
      backgroundCheckApproved: false,
      insuranceVerified: false,
      vehicleApproved: false,
      vehicleInspectionApproved: false,
      walletVerified: false,
      airportEligible: false,
      subscriptionActive: false,
      canGoOnline: false,
      canAcceptGeneralRides: false,
      canAcceptAirportRides: false,
      blockingReasons: ["Driver not found"],
      warnings: [],
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, driver.userId),
  });

  if (!user) {
    return {
      driverId,
      identityVerified: false,
      licenseVerified: false,
      backgroundCheckApproved: false,
      insuranceVerified: false,
      vehicleApproved: false,
      vehicleInspectionApproved: false,
      walletVerified: false,
      airportEligible: false,
      subscriptionActive: false,
      canGoOnline: false,
      canAcceptGeneralRides: false,
      canAcceptAirportRides: false,
      blockingReasons: ["User not found"],
      warnings: [],
    };
  }

  // Check each gate
  const identityVerified = user.identityVerified === true;
  const licenseVerified = driver.licenseNumber ? true : false; // Simplified; would check a document
  const backgroundCheckApproved = driver.driverStatus === "approved"; // Simplified; would check background_checks table
  const walletVerified = user.walletVerifiedAt !== null;
  const vehicleApproved = driver.isVerified === true;
  const vehicleInspectionApproved = driver.isVerified === true; // Simplified

  // Insurance verification: check latest insurance policy
  const latestInsurance = await db.query.insurancePolicies.findFirst({
    where: eq(insurancePolicies.driverId, driverId),
    orderBy: (table, { desc }) => desc(table.createdAt),
  });

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const insuranceVerified = !!(
    latestInsurance &&
    latestInsurance.status === "approved" &&
    latestInsurance.expirationDate >= today &&
    (latestInsurance.hasTncEndorsement || latestInsurance.hasCommercialCoverage)
  );

  const airportEligible = driver.isAirportLicensed === true;
  const subscriptionActive = true; // Simplified; would check subscriptions table

  // Compose eligibility result
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  if (!identityVerified) blockingReasons.push("Identity not verified");
  if (!licenseVerified) blockingReasons.push("License not verified");
  if (!backgroundCheckApproved) blockingReasons.push("Background check not approved");
  if (!insuranceVerified) {
    blockingReasons.push("Insurance not verified or expired");
    if (latestInsurance && latestInsurance.status === "rejected") {
      warnings.push(`Insurance rejected: ${latestInsurance.rejectionReason}`);
    }
    if (latestInsurance && latestInsurance.expirationDate < today) {
      warnings.push("Insurance policy expired");
    }
  }
  if (!vehicleApproved) blockingReasons.push("Vehicle not approved");
  if (!vehicleInspectionApproved) blockingReasons.push("Vehicle inspection not complete");
  if (!walletVerified) blockingReasons.push("Wallet not linked");

  const canAcceptGeneralRides =
    identityVerified &&
    licenseVerified &&
    backgroundCheckApproved &&
    insuranceVerified &&
    vehicleApproved &&
    vehicleInspectionApproved &&
    walletVerified;

  const canAcceptAirportRides = canAcceptGeneralRides && airportEligible;
  const canGoOnline = canAcceptGeneralRides;

  return {
    driverId,
    identityVerified,
    licenseVerified,
    backgroundCheckApproved,
    insuranceVerified,
    vehicleApproved,
    vehicleInspectionApproved,
    walletVerified,
    airportEligible,
    subscriptionActive,
    canGoOnline,
    canAcceptGeneralRides,
    canAcceptAirportRides,
    blockingReasons,
    warnings,
  };
}

/**
 * Save eligibility snapshot to DB and create audit event.
 * Called whenever compliance status changes.
 */
export async function saveEligibilitySnapshot(
  driverId: string,
  eligibility: DriverEligibilityResult,
  adminUserId?: string
): Promise<DriverEligibilitySnapshot> {
  // Get previous snapshot to detect changes
  const previousSnapshot = await db.query.driverEligibilitySnapshots.findFirst({
    where: eq(driverEligibilitySnapshots.driverId, driverId),
    orderBy: (table, { desc }) => desc(table.calculatedAt),
  });

  // Create new snapshot
  const snapshot: InsertDriverEligibilitySnapshot = {
    driverId,
    identityVerified: eligibility.identityVerified,
    licenseVerified: eligibility.licenseVerified,
    backgroundCheckApproved: eligibility.backgroundCheckApproved,
    insuranceVerified: eligibility.insuranceVerified,
    vehicleApproved: eligibility.vehicleApproved,
    vehicleInspectionApproved: eligibility.vehicleInspectionApproved,
    walletVerified: eligibility.walletVerified,
    airportEligible: eligibility.airportEligible,
    subscriptionActive: eligibility.subscriptionActive,
    canGoOnline: eligibility.canGoOnline,
    canAcceptGeneralRides: eligibility.canAcceptGeneralRides,
    canAcceptAirportRides: eligibility.canAcceptAirportRides,
    blockingReasons: eligibility.blockingReasons,
    warnings: eligibility.warnings,
    previousEligibilitySnapshotId: previousSnapshot?.id || null,
  };

  const result = await db
    .insert(driverEligibilitySnapshots)
    .values(snapshot)
    .returning();

  const savedSnapshot = result[0];

  // Create audit event
  const changed =
    !previousSnapshot ||
    previousSnapshot.canAcceptGeneralRides !== eligibility.canAcceptGeneralRides ||
    previousSnapshot.canAcceptAirportRides !== eligibility.canAcceptAirportRides ||
    previousSnapshot.canGoOnline !== eligibility.canGoOnline;

  if (changed) {
    await createAuditEvent({
      eventType: "DRIVER_ELIGIBILITY_RECALCULATED",
      actorUserId: adminUserId,
      actorRole: adminUserId ? "admin" : "system",
      targetType: "driver",
      targetId: driverId,
      driverId,
      metadata: {
        previousEligibility: previousSnapshot ? {
          canGoOnline: previousSnapshot.canGoOnline,
          canAcceptGeneralRides: previousSnapshot.canAcceptGeneralRides,
          canAcceptAirportRides: previousSnapshot.canAcceptAirportRides,
        } : null,
        nextEligibility: {
          canGoOnline: eligibility.canGoOnline,
          canAcceptGeneralRides: eligibility.canAcceptGeneralRides,
          canAcceptAirportRides: eligibility.canAcceptAirportRides,
        },
        blockingReasons: eligibility.blockingReasons,
      },
    });
  }

  return savedSnapshot;
}

/**
 * Get the current eligibility snapshot for a driver.
 * Returns the most recent snapshot.
 */
export async function getDriverEligibility(
  driverId: string
): Promise<DriverEligibilitySnapshot | null> {
  return await db.query.driverEligibilitySnapshots.findFirst({
    where: eq(driverEligibilitySnapshots.driverId, driverId),
    orderBy: (table, { desc }) => desc(table.calculatedAt),
  }) ?? null;
}

/**
 * Get eligibility history for audit trail.
 */
export async function getDriverEligibilityHistory(driverId: string, limit: number = 10) {
  return await db.query.driverEligibilitySnapshots.findMany({
    where: eq(driverEligibilitySnapshots.driverId, driverId),
    orderBy: (table, { desc }) => desc(table.calculatedAt),
    limit,
  });
}

/**
 * Helper: Recalculate and save eligibility (one operation).
 * Use this when compliance status changes.
 */
export async function recalculateAndSaveEligibility(
  driverId: string,
  adminUserId?: string
): Promise<DriverEligibilitySnapshot> {
  const eligibility = await calculateDriverEligibility(driverId);
  return await saveEligibilitySnapshot(driverId, eligibility, adminUserId);
}
