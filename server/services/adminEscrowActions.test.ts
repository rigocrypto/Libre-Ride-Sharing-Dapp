import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { clearAuditLogForTests, getAuditLogForRide } from "./auditLog";
import {
  DisabledAdminEscrowActionError,
  InvalidAdminEscrowTransitionError,
  getAllowedAdminEscrowActions,
  prepareAdminEscrowAction,
} from "./adminEscrowActions";

const actor = {
  userId: "admin-1",
  walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};

function ride(overrides: Record<string, unknown> = {}) {
  return {
    id: "ride-1",
    riderId: "rider-1",
    driverId: "driver-1",
    status: "ACCEPTED",
    escrowStatus: "locked",
    rider: { walletAddress: "0x1111111111111111111111111111111111111111" },
    driver: { walletAddress: "0x2222222222222222222222222222222222222222" },
    createdAt: new Date("2026-05-20T10:00:00Z"),
    ...overrides,
  } as any;
}

describe("admin escrow actions", () => {
  beforeEach(() => {
    clearAuditLogForTests();
    delete process.env.ESCROW_ADMIN_ACTION_MODE;
    process.env.NODE_ENV = "test";
    process.env.ESCROW_VERIFIER_MODE = "viem";
  });

  afterEach(() => {
    clearAuditLogForTests();
  });

  it("marks escrow for manual review and writes an audit entry", async () => {
    const result = await prepareAdminEscrowAction({
      ride: ride({ escrowStatus: "pending" }),
      actor,
      action: "mark-review",
      reason: "Pending deposit needs operator review",
    });

    expect(result.updates).toEqual({ escrowStatus: "manual_review" });
    expect(result.previousState).toBe("pending");
    expect(result.nextState).toBe("manual_review");

    const entries = await getAuditLogForRide("ride-1");
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("ESCROW_MARKED_REVIEW");
    expect(entries[0].reason).toBe("Pending deposit needs operator review");
  });

  it("rejects invalid dispute transition from released escrow", async () => {
    await expect(
      prepareAdminEscrowAction({
        ride: ride({ escrowStatus: "released", status: "COMPLETED" }),
        actor,
        action: "dispute",
        reason: "Customer submitted a late dispute",
      })
    ).rejects.toBeInstanceOf(InvalidAdminEscrowTransitionError);
  });

  it("gates retry verification to pending, failed, or manual review states", () => {
    expect(getAllowedAdminEscrowActions(ride({ escrowStatus: "pending" }))["retry-verification"]).toBe(true);
    expect(getAllowedAdminEscrowActions(ride({ escrowStatus: "locked" }))["retry-verification"]).toBe(false);
  });

  it("keeps release/refund disabled outside explicit mock admin action mode", async () => {
    await expect(
      prepareAdminEscrowAction({
        ride: ride({ escrowStatus: "locked", status: "COMPLETED" }),
        actor,
        action: "release",
        reason: "Ride completed and payout requested",
      })
    ).rejects.toBeInstanceOf(DisabledAdminEscrowActionError);

    const entries = await getAuditLogForRide("ride-1");
    expect(entries).toHaveLength(0);
  });

  it("allows deterministic release in mock admin action mode", async () => {
    process.env.ESCROW_ADMIN_ACTION_MODE = "mock";
    const result = await prepareAdminEscrowAction({
      ride: ride({ escrowStatus: "locked", status: "COMPLETED" }),
      actor,
      action: "release",
      reason: "Mock release for staging test path",
    });

    expect(result.updates).toEqual({ escrowStatus: "released", status: "COMPLETED" });
    expect(result.audit.action).toBe("ESCROW_RELEASED");
  });
});
