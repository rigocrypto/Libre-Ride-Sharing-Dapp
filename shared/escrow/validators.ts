import { InvalidEscrowStateError, InvalidEscrowTransitionError } from "./errors";
import { isEscrowState, type EscrowState } from "./states";
import { allowedEscrowTransitions } from "./transitions";

export interface EscrowTransitionResult {
  ok: boolean;
  current: EscrowState;
  next: EscrowState;
  allowed: readonly EscrowState[];
}

export function parseEscrowState(value: unknown): EscrowState {
  if (!isEscrowState(value)) {
    throw new InvalidEscrowStateError(value);
  }

  return value;
}

export function canTransitionEscrowState(
  current: EscrowState,
  next: EscrowState
): boolean {
  return (allowedEscrowTransitions[current] as readonly EscrowState[]).includes(next);
}

export function validateEscrowTransition(
  currentValue: unknown,
  nextValue: unknown
): EscrowTransitionResult {
  const current = parseEscrowState(currentValue);
  const next = parseEscrowState(nextValue);
  const allowed = allowedEscrowTransitions[current] as readonly EscrowState[];
  const ok = allowed.includes(next);

  return {
    ok,
    current,
    next,
    allowed,
  };
}

export function assertEscrowTransition(
  currentValue: unknown,
  nextValue: unknown
): EscrowTransitionResult {
  const result = validateEscrowTransition(currentValue, nextValue);

  if (!result.ok) {
    throw new InvalidEscrowTransitionError(result.current, result.next);
  }

  return result;
}
