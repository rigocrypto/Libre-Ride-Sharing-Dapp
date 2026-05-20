import { describe, expect, it } from "vitest";

import { getRideStartEligibility } from "./rideStartGuard";

const driverId = "driver-1";
const driverWallet = "0xb4CfAB88357D0f8C817a0b4E8C95D7B067C49Ac0";

function ride(overrides: Parameters<typeof getRideStartEligibility>[0] = {}) {
  return {
    driverId,
    status: "ACCEPTED",
    escrowStatus: "locked",
    driver: { walletAddress: driverWallet },
    ...overrides,
  };
}

describe("ride start guard", () => {
  it("allows the assigned driver wallet to start an escrow-confirmed ride", () => {
    expect(getRideStartEligibility(ride(), driverId, driverWallet)).toEqual({ ok: true });
  });

  it("rejects the wrong authenticated driver id", () => {
    expect(getRideStartEligibility(ride(), "driver-2", driverWallet)).toEqual({
      ok: false,
      code: "not_authorized",
    });
  });

  it("rejects a wallet mismatch for the assigned driver", () => {
    expect(
      getRideStartEligibility(
        ride(),
        driverId,
        "0x9999999999999999999999999999999999999999"
      )
    ).toEqual({
      ok: false,
      code: "wallet_mismatch",
    });
  });

  it("blocks the assigned driver when escrow is not confirmed", () => {
    expect(
      getRideStartEligibility(ride({ escrowStatus: "pending" }), driverId, driverWallet)
    ).toEqual({
      ok: false,
      code: "escrow_not_funded",
      current: "pending",
    });
  });
});
