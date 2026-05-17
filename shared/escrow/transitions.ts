import type { EscrowState } from "./states";

export const terminalEscrowStates = [
  "RELEASED",
  "REFUNDED",
  "FAILED",
  "EXPIRED",
] as const satisfies readonly EscrowState[];

export const allowedEscrowTransitions = {
  NO_DEPOSIT: ["DEPOSIT_INITIATED", "EXPIRED"],
  DEPOSIT_INITIATED: ["DEPOSIT_PENDING_ONCHAIN", "FAILED", "EXPIRED"],
  DEPOSIT_PENDING_ONCHAIN: ["DEPOSIT_CONFIRMED", "FAILED", "EXPIRED"],
  DEPOSIT_CONFIRMED: ["RIDE_ACCEPTED", "REFUND_PENDING", "DISPUTED"],
  RIDE_ACCEPTED: ["RIDE_IN_PROGRESS", "REFUND_PENDING", "DISPUTED"],
  RIDE_IN_PROGRESS: ["RELEASE_PENDING", "DISPUTED"],
  RELEASE_PENDING: ["RELEASED", "DISPUTED", "FAILED"],
  RELEASED: [],
  REFUND_PENDING: ["REFUNDED", "DISPUTED", "FAILED"],
  REFUNDED: [],
  DISPUTED: [
    "DISPUTE_RESOLVED_RELEASE",
    "DISPUTE_RESOLVED_REFUND",
    "DISPUTE_RESOLVED_SPLIT",
  ],
  DISPUTE_RESOLVED_RELEASE: ["RELEASED"],
  DISPUTE_RESOLVED_REFUND: ["REFUNDED"],
  DISPUTE_RESOLVED_SPLIT: ["RELEASED", "REFUNDED"],
  FAILED: [],
  EXPIRED: [],
} as const satisfies Record<EscrowState, readonly EscrowState[]>;

export function getAllowedEscrowTransitions(state: EscrowState): readonly EscrowState[] {
  return allowedEscrowTransitions[state];
}

export function isTerminalEscrowState(state: EscrowState): boolean {
  return terminalEscrowStates.includes(state as (typeof terminalEscrowStates)[number]);
}

