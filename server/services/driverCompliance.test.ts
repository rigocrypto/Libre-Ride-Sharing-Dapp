import { beforeEach, describe, expect, it } from "vitest";
import { MemStorage } from "../storage";
import { clearAuditLogForTests, listAuditLogEntries } from "./auditLog";
import {
  applyDriverComplianceAction,
  DriverComplianceActionError,
  listDriverComplianceProfiles,
} from "./adminDriverCompliance";
import { isDispatchEligible } from "./driverCompliance";

describe("driver compliance workflow", () => {
  let storage: MemStorage;
  let driverId: string;

  beforeEach(async () => {
    process.env.STORAGE_ENGINE = "mem";
    delete process.env.DATABASE_URL;
    clearAuditLogForTests();
    storage = new MemStorage();

    const driver = await storage.createUser({
      firebaseUid: `driver-${Date.now()}`,
      email: `driver-${Date.now()}@test.local`,
      role: "driver",
      walletAddress: "0x3333333333333333333333333333333333333333",
      walletVerifiedAt: new Date(),
      driverStatus: "pending" as any,
    });
    await storage.createDriver({ userId: driver.id, driverStatus: "pending" as any } as any);
    driverId = driver.id;
  });

  it("lists pending drivers for admin review", async () => {
    const drivers = await listDriverComplianceProfiles(storage);
    expect(drivers).toHaveLength(1);
    expect(drivers[0].approvalStatus).toBe("pending_review");
    expect(drivers[0].isDispatchEligible).toBe(false);
  });

  it("approves a driver and creates an audit log", async () => {
    const result = await applyDriverComplianceAction({
      storage,
      driverId,
      actor: { userId: "admin-1", role: "admin" },
      action: "approve",
    });

    expect(result.nextState).toBe("approved");
    expect(result.driver.isDispatchEligible).toBe(true);
    const logs = await listAuditLogEntries({ actorId: "admin-1" });
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("DRIVER_APPROVED");
  });

  it("requires reasons for rejection and suspension style actions", async () => {
    await expect(
      applyDriverComplianceAction({
        storage,
        driverId,
        actor: { userId: "admin-1", role: "admin" },
        action: "reject",
        reason: "too short",
      })
    ).rejects.toThrow(DriverComplianceActionError);
  });

  it("blocks dispatch when documents are expired", async () => {
    await applyDriverComplianceAction({
      storage,
      driverId,
      actor: { userId: "admin-1", role: "admin" },
      action: "approve",
    });
    const driver = await storage.updateDriver(driverId, {
      insuranceExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    } as any);
    const user = await storage.getUser(driverId);

    expect(isDispatchEligible(user, driver)).toBe(false);
  });
});
