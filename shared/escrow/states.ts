export const escrowStates = [
  "NO_DEPOSIT",
  "DEPOSIT_INITIATED",
  "DEPOSIT_PENDING_ONCHAIN",
  "DEPOSIT_CONFIRMED",
  "RIDE_ACCEPTED",
  "RIDE_IN_PROGRESS",
  "RELEASE_PENDING",
  "RELEASED",
  "REFUND_PENDING",
  "REFUNDED",
  "DISPUTED",
  "DISPUTE_RESOLVED_RELEASE",
  "DISPUTE_RESOLVED_REFUND",
  "DISPUTE_RESOLVED_SPLIT",
  "FAILED",
  "EXPIRED",
] as const;

export type EscrowState = (typeof escrowStates)[number];

export function isEscrowState(value: unknown): value is EscrowState {
  return typeof value === "string" && escrowStates.includes(value as EscrowState);
}

