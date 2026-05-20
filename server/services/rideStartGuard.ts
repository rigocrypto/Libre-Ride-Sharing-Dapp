export type RideStartRejection =
  | { ok: false; code: "not_authorized" }
  | { ok: false; code: "wallet_mismatch" }
  | { ok: false; code: "invalid_state"; current: string | null | undefined }
  | { ok: false; code: "escrow_not_funded"; current: string | null | undefined };

export type RideStartEligibility = { ok: true } | RideStartRejection;

export function getRideStartEligibility(
  ride: {
    driverId?: string | null;
    status?: string | null;
    escrowStatus?: string | null;
    driver?: { walletAddress?: string | null } | null;
  },
  driverId: string,
  driverWalletAddress?: string | null
): RideStartEligibility {
  if (ride.driverId !== driverId) {
    return { ok: false, code: "not_authorized" };
  }

  const assignedWallet = ride.driver?.walletAddress;
  if (
    !assignedWallet ||
    !driverWalletAddress ||
    assignedWallet.toLowerCase() !== driverWalletAddress.toLowerCase()
  ) {
    return { ok: false, code: "wallet_mismatch" };
  }

  if (ride.status !== "ACCEPTED") {
    return { ok: false, code: "invalid_state", current: ride.status };
  }

  if (ride.escrowStatus !== "locked") {
    return { ok: false, code: "escrow_not_funded", current: ride.escrowStatus };
  }

  return { ok: true };
}
