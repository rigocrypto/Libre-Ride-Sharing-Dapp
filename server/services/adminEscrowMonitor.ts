import type { RideWithDetails } from "@shared/schema";

export type AdminEscrowStatus =
  | "pending"
  | "locked"
  | "released"
  | "refunded"
  | "disputed"
  | "failed"
  | "manual_review"
  | "none";

export type AdminEscrowRecord = {
  rideId: string;
  riderWallet: string | null;
  driverWallet: string | null;
  rideStatus: string | null;
  escrowStatus: AdminEscrowStatus;
  amount: number | null;
  token: string;
  chainId: number;
  depositTxHash: string | null;
  releaseTxHash: string | null;
  verificationMode: string;
  createdAt: string | null;
  updatedAt: string | null;
  manualReview: boolean;
  riskReason: string | null;
};

export type AdminEscrowSummary = {
  totalEscrowedRides: number;
  lockedEscrows: number;
  pendingDeposits: number;
  failedVerifications: number;
  disputedRides: number;
  releasedPayments: number;
  refundPending: number;
  manualReviewNeeded: number;
};

export type AdminEscrowSnapshot = {
  summary: AdminEscrowSummary;
  records: AdminEscrowRecord[];
  generatedAt: string;
  stuckDepositThresholdMinutes: number;
};

type BuildOptions = {
  now?: Date;
  chainId: number;
  tokenAddress: string;
  verificationMode: string;
  stuckDepositThresholdMinutes?: number;
};

const DEFAULT_STUCK_DEPOSIT_THRESHOLD_MINUTES = 15;

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeEscrowStatus(value: unknown): AdminEscrowStatus {
  const status = String(value || "none").toLowerCase();
  if (
    status === "pending" ||
    status === "locked" ||
    status === "released" ||
    status === "refunded" ||
    status === "disputed" ||
    status === "failed" ||
    status === "manual_review"
  ) {
    return status;
  }
  return "none";
}

function latestTimestamp(ride: RideWithDetails): string | null {
  return (
    toIso((ride as any).completedAt) ||
    toIso((ride as any).startedAt) ||
    toIso((ride as any).acceptedAt) ||
    toIso((ride as any).matchedAt) ||
    toIso((ride as any).createdAt)
  );
}

function getRiskReason(
  status: AdminEscrowStatus,
  createdAt: string | null,
  now: Date,
  stuckDepositThresholdMinutes: number
): string | null {
  if (status === "failed") return "Verification failed";
  if (status === "disputed") return "Dispute open";
  if (status === "manual_review") return "Marked for manual review";

  if (status === "pending" && createdAt) {
    const ageMs = now.getTime() - new Date(createdAt).getTime();
    const thresholdMs = stuckDepositThresholdMinutes * 60_000;
    if (ageMs >= thresholdMs) {
      return `Pending deposit over ${stuckDepositThresholdMinutes} minutes`;
    }
  }

  return null;
}

export function buildAdminEscrowSnapshot(
  rides: RideWithDetails[],
  options: BuildOptions
): AdminEscrowSnapshot {
  const now = options.now || new Date();
  const stuckDepositThresholdMinutes =
    options.stuckDepositThresholdMinutes || DEFAULT_STUCK_DEPOSIT_THRESHOLD_MINUTES;

  const records = rides.map((ride) => {
    const escrowStatus = normalizeEscrowStatus((ride as any).escrowStatus);
    const createdAt = toIso((ride as any).createdAt);
    const riskReason = getRiskReason(
      escrowStatus,
      createdAt,
      now,
      stuckDepositThresholdMinutes
    );

    return {
      rideId: ride.id,
      riderWallet: ride.rider?.walletAddress || null,
      driverWallet: ride.driver?.walletAddress || null,
      rideStatus: ride.status || null,
      escrowStatus,
      amount: (ride as any).escrowAmount ?? null,
      token: options.tokenAddress,
      chainId: options.chainId,
      depositTxHash: (ride as any).escrowTxHash || null,
      releaseTxHash: (ride as any).escrowReleaseTxHash || null,
      verificationMode: options.verificationMode,
      createdAt,
      updatedAt: latestTimestamp(ride),
      manualReview: !!riskReason,
      riskReason,
    } satisfies AdminEscrowRecord;
  });

  const summary = records.reduce<AdminEscrowSummary>(
    (acc, record) => {
      const hasEscrowSignal =
        record.escrowStatus !== "none" || !!record.depositTxHash || !!record.amount;
      if (hasEscrowSignal) acc.totalEscrowedRides += 1;
      if (record.escrowStatus === "locked") acc.lockedEscrows += 1;
      if (record.escrowStatus === "pending") acc.pendingDeposits += 1;
      if (record.escrowStatus === "failed") acc.failedVerifications += 1;
      if (record.escrowStatus === "disputed") acc.disputedRides += 1;
      if (record.escrowStatus === "released") acc.releasedPayments += 1;
      if (record.escrowStatus === "refunded") acc.refundPending += 1;
      if (record.manualReview) acc.manualReviewNeeded += 1;
      return acc;
    },
    {
      totalEscrowedRides: 0,
      lockedEscrows: 0,
      pendingDeposits: 0,
      failedVerifications: 0,
      disputedRides: 0,
      releasedPayments: 0,
      refundPending: 0,
      manualReviewNeeded: 0,
    }
  );

  return {
    summary,
    records,
    generatedAt: now.toISOString(),
    stuckDepositThresholdMinutes,
  };
}
