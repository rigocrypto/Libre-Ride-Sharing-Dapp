import type { Driver, DriverProfile, User } from "@shared/schema";

export type DriverComplianceStatus =
  | "unverified"
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "expired_documents"
  | "requires_manual_review";

const EXPIRE_FIELDS = [
  "licenseExpiresAt",
  "insuranceExpiresAt",
  "inspectionExpiresAt",
  "permitExpiresAt",
  "orlandoPermitExpiresAt",
] as const;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeDriverComplianceStatus(
  status: unknown
): DriverComplianceStatus {
  if (status === "pending") return "pending_review";
  if (
    status === "approved" ||
    status === "rejected" ||
    status === "suspended" ||
    status === "expired_documents" ||
    status === "requires_manual_review" ||
    status === "pending_review"
  ) {
    return status;
  }
  return "unverified";
}

export function hasAnyExpiredDocuments(
  driver: Partial<Driver> | undefined,
  now = new Date()
): boolean {
  if (!driver) return false;
  return EXPIRE_FIELDS.some((field) => {
    const expiresAt = toDate((driver as any)[field]);
    return !!expiresAt && expiresAt.getTime() < now.getTime();
  });
}

export function getDriverApprovalStatus(
  user: Partial<User> | undefined,
  driver: Partial<Driver> | undefined,
  now = new Date()
): DriverComplianceStatus {
  const status = normalizeDriverComplianceStatus(
    (driver as any)?.driverStatus || (user as any)?.driverStatus
  );
  if (status === "approved" && hasAnyExpiredDocuments(driver, now)) {
    return "expired_documents";
  }
  return status;
}

export function isDispatchEligible(
  user: Partial<User> | undefined,
  driver: Partial<Driver> | undefined,
  now = new Date()
): boolean {
  if (!user || !driver) return false;
  return (
    user.role === "driver" &&
    getDriverApprovalStatus(user, driver, now) === "approved" &&
    !hasAnyExpiredDocuments(driver, now)
  );
}

export function getDriverIneligibilityReason(
  user: Partial<User> | undefined,
  driver: Partial<Driver> | undefined,
  now = new Date()
): string {
  if (!user) return "Driver user not found";
  if (user.role !== "driver") return "User is not a driver";
  if (!driver) return "Driver profile not found";

  const status = getDriverApprovalStatus(user, driver, now);
  if (status === "expired_documents") return "Driver documents have expired";
  if (status !== "approved") return `Driver compliance status is ${status}`;
  return "Driver is not eligible to accept rides";
}

export function buildDriverComplianceProfile(
  profile: DriverProfile,
  now = new Date()
) {
  const user = profile as unknown as User;
  const driver = (profile as any).driverDetails as Driver | undefined;
  const approvalStatus = getDriverApprovalStatus(user, driver, now);
  const expiredDocuments = hasAnyExpiredDocuments(driver, now);
  const warnings = expiredDocuments ? ["One or more compliance documents are expired"] : [];

  return {
    driverId: user.id,
    userId: user.id,
    email: user.email,
    username: user.username,
    walletAddress: user.walletAddress,
    approvalStatus,
    isDispatchEligible: isDispatchEligible(user, driver, now),
    licenseStatus: (driver as any)?.licenseStatus || "pending",
    insuranceStatus: (driver as any)?.insuranceStatus || "pending",
    vehicleInspectionStatus: (driver as any)?.vehicleInspectionStatus || "pending",
    backgroundCheckStatus: (driver as any)?.backgroundCheckStatus || "pending",
    orlandoPermitStatus: (driver as any)?.orlandoPermitStatus || "pending",
    airportEligibilityStatus: (driver as any)?.airportEligibilityStatus || "pending",
    licenseExpiresAt: (driver as any)?.licenseExpiresAt || null,
    insuranceExpiresAt: (driver as any)?.insuranceExpiresAt || null,
    inspectionExpiresAt: (driver as any)?.inspectionExpiresAt || null,
    permitExpiresAt: (driver as any)?.permitExpiresAt || null,
    orlandoPermitNumber: (driver as any)?.orlandoPermitNumber || null,
    orlandoPermitExpiresAt: (driver as any)?.orlandoPermitExpiresAt || null,
    mcoAirportEligible: Boolean((driver as any)?.mcoAirportEligible),
    mcoEligibilityGrantedAt: (driver as any)?.mcoEligibilityGrantedAt || null,
    backgroundCheckProvider: (driver as any)?.backgroundCheckProvider || null,
    backgroundCheckCompletedAt: (driver as any)?.backgroundCheckCompletedAt || null,
    lastReviewedAt: (driver as any)?.lastReviewedAt || (driver as any)?.driverApprovedAt || null,
    reviewedBy: (driver as any)?.reviewedBy || null,
    nextReviewDueAt: (driver as any)?.nextReviewDueAt || null,
    rejectionReason: (driver as any)?.rejectionReason || null,
    warnings,
  };
}
