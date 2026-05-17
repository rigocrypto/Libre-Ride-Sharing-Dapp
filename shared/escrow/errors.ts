import type { EscrowState } from "./states";

export class InvalidEscrowStateError extends Error {
  constructor(value: unknown) {
    super(`Invalid escrow state: ${String(value)}`);
    this.name = "InvalidEscrowStateError";
  }
}

export class InvalidEscrowTransitionError extends Error {
  readonly current: EscrowState;
  readonly next: EscrowState;

  constructor(current: EscrowState, next: EscrowState) {
    super(`Invalid escrow transition: ${current} -> ${next}`);
    this.name = "InvalidEscrowTransitionError";
    this.current = current;
    this.next = next;
  }
}

