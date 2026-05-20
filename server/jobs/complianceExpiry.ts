import { appendAuditLogEntry } from "../services/auditLog";
import { normalizeDriverComplianceStatus, hasAnyExpiredDocuments } from "../services/driverCompliance";
import type { IStorage } from "../storage";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runComplianceExpiryCheck(storage: IStorage, now = new Date()) {
  const profiles = await storage.listDrivers();
  let expired = 0;

  for (const profile of profiles) {
    const user = profile as any;
    const driver = (profile as any).driverDetails;
    const rawStatus = normalizeDriverComplianceStatus(driver?.driverStatus || user.driverStatus);
    if (rawStatus === "approved" && hasAnyExpiredDocuments(driver, now)) {
      await storage.updateUser(user.id, { driverStatus: "expired_documents" as any } as any);
      await storage.updateDriver(user.id, {
        driverStatus: "expired_documents" as any,
        isVerified: false as any,
        lastReviewedAt: now,
        reviewedBy: "system",
        rejectionReason: "Compliance documents expired",
      } as any);
      await appendAuditLogEntry({
        actorId: "system",
        actorRole: "system",
        action: "DRIVER_DOCUMENTS_EXPIRED",
        previousState: "approved",
        nextState: "expired_documents",
        reason: "Compliance documents expired",
        metadata: { driverId: user.id },
      });
      expired += 1;
    }
  }

  return { checked: profiles.length, expired };
}

export function startComplianceExpiryJob(storage: IStorage) {
  if (process.env.NODE_ENV === "test") return;

  runComplianceExpiryCheck(storage).catch((error) => {
    console.error("[ComplianceExpiry] Startup check failed:", error);
  });

  const interval = setInterval(() => {
    runComplianceExpiryCheck(storage).catch((error) => {
      console.error("[ComplianceExpiry] Scheduled check failed:", error);
    });
  }, DAY_MS);

  interval.unref?.();
}
