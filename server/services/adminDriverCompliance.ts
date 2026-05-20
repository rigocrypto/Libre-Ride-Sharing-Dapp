import { appendAuditLogEntry } from "./auditLog";
import {
  buildDriverComplianceProfile,
  getDriverApprovalStatus,
  type DriverComplianceStatus,
} from "./driverCompliance";
import type { IStorage } from "../storage";
import type { AuditAction } from "@shared/audit/types";

export type AdminDriverComplianceAction =
  | "approve"
  | "reject"
  | "suspend"
  | "request-documents"
  | "manual-review";

export type AdminDriverActor = {
  userId: string;
  role?: string;
  walletAddress?: string | null;
};

const actionConfig: Record<
  AdminDriverComplianceAction,
  { nextState: DriverComplianceStatus; auditAction: AuditAction; defaultReason?: string }
> = {
  approve: {
    nextState: "approved",
    auditAction: "DRIVER_APPROVED",
    defaultReason: "Driver compliance approved",
  },
  reject: {
    nextState: "rejected",
    auditAction: "DRIVER_REJECTED",
  },
  suspend: {
    nextState: "suspended",
    auditAction: "DRIVER_SUSPENDED",
  },
  "request-documents": {
    nextState: "requires_manual_review",
    auditAction: "DRIVER_DOCUMENTS_REQUESTED",
  },
  "manual-review": {
    nextState: "requires_manual_review",
    auditAction: "DRIVER_MANUAL_REVIEW",
  },
};

export class DriverComplianceActionError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
    this.name = "DriverComplianceActionError";
  }
}

export async function listDriverComplianceProfiles(storage: IStorage) {
  const profiles = await storage.listDrivers();
  return profiles.map((profile) => buildDriverComplianceProfile(profile));
}

export async function getDriverComplianceDetail(storage: IStorage, driverId: string) {
  const profile = await storage.getDriverProfile(driverId);
  if (!profile) return null;
  return buildDriverComplianceProfile(profile);
}

export async function applyDriverComplianceAction(args: {
  storage: IStorage;
  driverId: string;
  actor: AdminDriverActor;
  action: AdminDriverComplianceAction;
  reason?: string;
}) {
  const { storage, driverId, actor, action } = args;
  const config = actionConfig[action];
  const reason = args.reason?.trim() || config.defaultReason;

  if (!config) {
    throw new DriverComplianceActionError("Unsupported compliance action");
  }
  if (!reason || reason.length < 10) {
    throw new DriverComplianceActionError("Reason must be at least 10 characters");
  }

  const user = await storage.getUser(driverId);
  const driver = await storage.getDriver(driverId);
  if (!user || !driver) {
    throw new DriverComplianceActionError("Driver not found", 404);
  }

  const previousState = getDriverApprovalStatus(user, driver);
  const now = new Date();
  const nextState = config.nextState;

  await storage.updateUser(driverId, {
    driverStatus: nextState as any,
  } as any);

  const updatedDriver = await storage.updateDriver(driverId, {
    driverStatus: nextState as any,
    isVerified: nextState === "approved",
    driverApprovedAt: nextState === "approved" ? now : (driver as any).driverApprovedAt,
    driverRejectedAt:
      nextState === "rejected" || nextState === "suspended" ? now : (driver as any).driverRejectedAt,
    rejectionReason: nextState === "approved" ? null : reason,
    lastReviewedAt: now,
    reviewedBy: actor.userId,
  } as any);

  const audit = await appendAuditLogEntry({
    actorId: actor.userId,
    actorRole: actor.role || "admin",
    actorWallet: actor.walletAddress || undefined,
    action: config.auditAction,
    previousState,
    nextState,
    reason,
    metadata: {
      driverId,
      complianceAction: action,
      isDispatchEligible: nextState === "approved",
    },
  });

  const updatedUser = (await storage.getUser(driverId)) || user;
  return {
    success: true,
    previousState,
    nextState,
    audit,
    driver: buildDriverComplianceProfile({
      ...(updatedUser as any),
      driverDetails: updatedDriver || driver,
      badges: [],
    } as any),
  };
}
