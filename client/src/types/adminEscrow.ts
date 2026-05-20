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

export type AdminEscrowAction =
  | "mark-review"
  | "retry-verification"
  | "release"
  | "refund"
  | "dispute";

export type AuditLogEntry = {
  id: string;
  actorId: string;
  actorRole?: string;
  actorWallet?: string;
  action: string;
  rideId?: string;
  previousState?: string;
  nextState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AdminEscrowDetail = {
  escrow: AdminEscrowRecord;
  allowedActions: Record<AdminEscrowAction, boolean>;
  auditLog: AuditLogEntry[];
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
