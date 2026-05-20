import type { AuditLogEntry } from "@shared/audit/types";
import { canTransitionEscrowState, type EscrowState } from "@shared/escrow";
import type { RideWithDetails } from "@shared/schema";
import { appendAuditLogEntry, getAuditLogForRide } from "./auditLog";
import { buildAdminEscrowSnapshot, type AdminEscrowRecord } from "./adminEscrowMonitor";

export type AdminEscrowAction =
  | "mark-review"
  | "retry-verification"
  | "release"
  | "refund"
  | "dispute";

export type AdminActor = {
  userId: string;
  walletAddress?: string | null;
};

export type AdminEscrowDetail = {
  escrow: AdminEscrowRecord;
  allowedActions: Record<AdminEscrowAction, boolean>;
  auditLog: AuditLogEntry[];
};

type BuildDetailOptions = {
  chainId: number;
  tokenAddress: string;
  verificationMode: string;
};

export class InvalidAdminEscrowTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAdminEscrowTransitionError";
  }
}

export class DisabledAdminEscrowActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DisabledAdminEscrowActionError";
  }
}

function currentCanonicalState(ride: RideWithDetails): EscrowState {
  const status = String((ride as any).escrowStatus || "none").toLowerCase();
  const rideStatus = String((ride as any).status || "").toUpperCase();

  if (status === "released") return "RELEASED";
  if (status === "refunded") return "REFUNDED";
  if (status === "disputed" || status === "manual_review") return "DISPUTED";
  if (status === "failed") return "FAILED";
  if (status === "pending") return "DEPOSIT_PENDING_ONCHAIN";
  if (status === "locked" && rideStatus === "COMPLETED") return "RELEASE_PENDING";
  if (status === "locked" && rideStatus === "IN_PROGRESS") return "RIDE_IN_PROGRESS";
  if (status === "locked" && rideStatus === "ACCEPTED") return "RIDE_ACCEPTED";
  if (status === "locked") return "DEPOSIT_CONFIRMED";
  return "NO_DEPOSIT";
}

function canMove(ride: RideWithDetails, next: EscrowState): boolean {
  return canTransitionEscrowState(currentCanonicalState(ride), next);
}

export function getAllowedAdminEscrowActions(
  ride: RideWithDetails
): Record<AdminEscrowAction, boolean> {
  const status = String((ride as any).escrowStatus || "none").toLowerCase();
  return {
    "mark-review": !["released", "refunded"].includes(status),
    "retry-verification": status === "pending" || status === "failed" || status === "manual_review",
    release: canMove(ride, "RELEASED"),
    refund: canMove(ride, "REFUND_PENDING") || canMove(ride, "REFUNDED"),
    dispute: canMove(ride, "DISPUTED"),
  };
}

export async function buildAdminEscrowDetail(
  ride: RideWithDetails,
  options: BuildDetailOptions
): Promise<AdminEscrowDetail> {
  const snapshot = buildAdminEscrowSnapshot([ride], options);
  return {
    escrow: snapshot.records[0],
    allowedActions: getAllowedAdminEscrowActions(ride),
    auditLog: await getAuditLogForRide(ride.id),
  };
}

function assertAllowed(ride: RideWithDetails, action: AdminEscrowAction): void {
  const allowedActions = getAllowedAdminEscrowActions(ride);
  if (!allowedActions[action]) {
    throw new InvalidAdminEscrowTransitionError(
      `Action ${action} is not allowed from ${currentCanonicalState(ride)}`
    );
  }
}

function isMockAdminActionMode(): boolean {
  return (
    process.env.ESCROW_ADMIN_ACTION_MODE === "mock" ||
    (process.env.NODE_ENV === "development" && process.env.ESCROW_VERIFIER_MODE === "mock")
  );
}

type ActionResult = {
  updates: Record<string, unknown> | null;
  previousState: string;
  nextState: string;
  audit: AuditLogEntry;
};

export async function prepareAdminEscrowAction(params: {
  ride: RideWithDetails;
  actor: AdminActor;
  action: AdminEscrowAction;
  reason: string;
}): Promise<ActionResult> {
  const { ride, actor, action, reason } = params;
  assertAllowed(ride, action);

  const previousState = String((ride as any).escrowStatus || "none");
  let nextState = previousState;
  let updates: Record<string, unknown> | null = null;
  let auditAction: AuditLogEntry["action"] = "ESCROW_MARKED_REVIEW";

  if (action === "mark-review") {
    nextState = "manual_review";
    updates = { escrowStatus: "manual_review" };
    auditAction = "ESCROW_MARKED_REVIEW";
  } else if (action === "retry-verification") {
    nextState = previousState;
    updates = null;
    auditAction = "ESCROW_RETRY_VERIFICATION";
  } else if (action === "dispute") {
    nextState = "disputed";
    updates = { escrowStatus: "disputed" };
    auditAction = "ESCROW_DISPUTE_OPENED";
  } else if (action === "release") {
    auditAction = "ESCROW_RELEASED";
    if (!isMockAdminActionMode()) {
      throw new DisabledAdminEscrowActionError(
        "Admin release is disabled until live contract execution is wired"
      );
    }
    nextState = "released";
    updates = { escrowStatus: "released", status: "COMPLETED" };
  } else if (action === "refund") {
    auditAction = "ESCROW_REFUNDED";
    if (!isMockAdminActionMode()) {
      throw new DisabledAdminEscrowActionError(
        "Admin refund is disabled until live contract execution is wired"
      );
    }
    nextState = "refunded";
    updates = { escrowStatus: "refunded", status: "CANCELLED" };
  }

  const audit = await appendAuditLogEntry({
    actorId: actor.userId,
    actorWallet: actor.walletAddress || undefined,
    action: auditAction,
    rideId: ride.id,
    previousState,
    nextState,
    reason,
    metadata: {
      adminAction: action,
      canonicalPreviousState: currentCanonicalState(ride),
      fundMovingAction: action === "release" || action === "refund",
      mockMode: isMockAdminActionMode(),
    },
  });

  return { updates, previousState, nextState, audit };
}
