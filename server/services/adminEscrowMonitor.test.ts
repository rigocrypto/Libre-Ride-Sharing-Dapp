import { describe, expect, it } from "vitest";

import { buildAdminEscrowSnapshot } from "./adminEscrowMonitor";

const baseRide = {
  id: "ride-1",
  status: "ACCEPTED",
  estimatedPrice: 25,
  createdAt: new Date("2026-05-20T10:00:00Z"),
  rider: { walletAddress: "0x1111111111111111111111111111111111111111" },
  driver: { walletAddress: "0x2222222222222222222222222222222222222222" },
} as any;

describe("admin escrow monitor", () => {
  it("flags pending deposits older than the stuck threshold", () => {
    const snapshot = buildAdminEscrowSnapshot(
      [
        {
          ...baseRide,
          escrowStatus: "pending",
          escrowTxHash: "0xabc",
        },
      ],
      {
        now: new Date("2026-05-20T10:20:00Z"),
        chainId: 84532,
        tokenAddress: "0xtoken",
        verificationMode: "viem",
      }
    );

    expect(snapshot.summary.pendingDeposits).toBe(1);
    expect(snapshot.summary.manualReviewNeeded).toBe(1);
    expect(snapshot.records[0].manualReview).toBe(true);
    expect(snapshot.records[0].riskReason).toBe("Pending deposit over 15 minutes");
  });

  it("summarizes locked, released, disputed, and failed escrow states", () => {
    const snapshot = buildAdminEscrowSnapshot(
      [
        { ...baseRide, id: "locked", escrowStatus: "locked" },
        { ...baseRide, id: "released", escrowStatus: "released" },
        { ...baseRide, id: "disputed", escrowStatus: "disputed" },
        { ...baseRide, id: "failed", escrowStatus: "failed" },
      ],
      {
        now: new Date("2026-05-20T10:05:00Z"),
        chainId: 84532,
        tokenAddress: "0xtoken",
        verificationMode: "mock",
      }
    );

    expect(snapshot.summary.totalEscrowedRides).toBe(4);
    expect(snapshot.summary.lockedEscrows).toBe(1);
    expect(snapshot.summary.releasedPayments).toBe(1);
    expect(snapshot.summary.disputedRides).toBe(1);
    expect(snapshot.summary.failedVerifications).toBe(1);
    expect(snapshot.summary.manualReviewNeeded).toBe(2);
  });
});
