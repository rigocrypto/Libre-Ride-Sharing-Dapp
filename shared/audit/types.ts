export type AuditAction =
  | "ESCROW_MARKED_REVIEW"
  | "ESCROW_RETRY_VERIFICATION"
  | "ESCROW_RELEASED"
  | "ESCROW_REFUNDED"
  | "ESCROW_DISPUTE_OPENED"
  | "ESCROW_DISPUTE_RESOLVED"
  | "RIDE_FORCE_COMPLETED"
  | "DRIVER_APPROVED"
  | "DRIVER_REJECTED"
  | "DRIVER_SUSPENDED"
  | "DRIVER_DOCUMENTS_REQUESTED"
  | "DRIVER_MANUAL_REVIEW"
  | "DRIVER_DOCUMENTS_EXPIRED";

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole?: string;
  actorWallet?: string;
  action: AuditAction;
  rideId?: string;
  previousState?: string;
  nextState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
