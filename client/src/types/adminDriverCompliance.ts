export type DriverComplianceStatus =
  | "unverified"
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "expired_documents"
  | "requires_manual_review";

export type AdminDriverComplianceRecord = {
  driverId: string;
  userId: string;
  email?: string | null;
  username?: string | null;
  walletAddress?: string | null;
  approvalStatus: DriverComplianceStatus;
  isDispatchEligible: boolean;
  licenseStatus: string;
  insuranceStatus: string;
  vehicleInspectionStatus: string;
  backgroundCheckStatus: string;
  orlandoPermitStatus: string;
  airportEligibilityStatus: string;
  licenseExpiresAt?: string | Date | null;
  insuranceExpiresAt?: string | Date | null;
  inspectionExpiresAt?: string | Date | null;
  permitExpiresAt?: string | Date | null;
  orlandoPermitNumber?: string | null;
  orlandoPermitExpiresAt?: string | Date | null;
  mcoAirportEligible: boolean;
  mcoEligibilityGrantedAt?: string | Date | null;
  backgroundCheckProvider?: string | null;
  backgroundCheckCompletedAt?: string | Date | null;
  lastReviewedAt?: string | Date | null;
  reviewedBy?: string | null;
  nextReviewDueAt?: string | Date | null;
  rejectionReason?: string | null;
  warnings: string[];
};

export type AdminDriverComplianceAction =
  | "approve"
  | "reject"
  | "suspend"
  | "request-documents";
