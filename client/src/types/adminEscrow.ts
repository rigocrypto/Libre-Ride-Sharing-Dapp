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

export type AdminEscrowFilters = {
  escrowStatus: string;
  rideStatus: string;
  token: string;
  chain: string;
  verificationMode: string;
  manualReview: string;
  search: string;
};
