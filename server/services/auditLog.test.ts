import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  appendAuditLogEntry,
  clearAuditLogForTests,
  getAuditLogForRide,
  listAuditLogEntries,
} from "./auditLog";

describe("audit log service", () => {
  beforeEach(() => {
    clearAuditLogForTests();
    process.env.STORAGE_ENGINE = "mem";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    clearAuditLogForTests();
  });

  it("persists audit entries through the mem fallback", async () => {
    const entry = await appendAuditLogEntry({
      actorId: "admin-1",
      actorRole: "admin",
      action: "ESCROW_MARKED_REVIEW",
      rideId: "ride-1",
      previousState: "pending",
      nextState: "manual_review",
      reason: "Manual review for pending deposit",
    });

    expect(entry.id).toBeTruthy();
    expect(entry.actorRole).toBe("admin");

    const rideEntries = await getAuditLogForRide("ride-1");
    expect(rideEntries).toHaveLength(1);
    expect(rideEntries[0].action).toBe("ESCROW_MARKED_REVIEW");
  });

  it("filters audit entries by ride, actor, and action", async () => {
    await appendAuditLogEntry({
      actorId: "admin-1",
      actorRole: "admin",
      action: "ESCROW_MARKED_REVIEW",
      rideId: "ride-1",
      reason: "First review reason",
    });
    await appendAuditLogEntry({
      actorId: "admin-2",
      actorRole: "admin",
      action: "ESCROW_RETRY_VERIFICATION",
      rideId: "ride-2",
      reason: "Retry verification reason",
    });

    expect(await listAuditLogEntries({ rideId: "ride-1" })).toHaveLength(1);
    expect(await listAuditLogEntries({ actorId: "admin-2" })).toHaveLength(1);
    expect(await listAuditLogEntries({ action: "ESCROW_RETRY_VERIFICATION" })).toHaveLength(1);
  });
});
