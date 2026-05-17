import { describe, expect, it } from "vitest";
import {
  assertEscrowTransition,
  canTransitionEscrowState,
  escrowStates,
  getAllowedEscrowTransitions,
  InvalidEscrowStateError,
  InvalidEscrowTransitionError,
  isTerminalEscrowState,
  parseEscrowState,
  validateEscrowTransition,
} from "./index";

describe("escrow state machine", () => {
  it("defines allowed transitions for every escrow state", () => {
    for (const state of escrowStates) {
      expect(getAllowedEscrowTransitions(state)).toBeDefined();
    }
  });

  it("allows the happy path from deposit through release", () => {
    const happyPath = [
      ["NO_DEPOSIT", "DEPOSIT_INITIATED"],
      ["DEPOSIT_INITIATED", "DEPOSIT_PENDING_ONCHAIN"],
      ["DEPOSIT_PENDING_ONCHAIN", "DEPOSIT_CONFIRMED"],
      ["DEPOSIT_CONFIRMED", "RIDE_ACCEPTED"],
      ["RIDE_ACCEPTED", "RIDE_IN_PROGRESS"],
      ["RIDE_IN_PROGRESS", "RELEASE_PENDING"],
      ["RELEASE_PENDING", "RELEASED"],
    ] as const;

    for (const [current, next] of happyPath) {
      expect(canTransitionEscrowState(current, next)).toBe(true);
      expect(assertEscrowTransition(current, next).ok).toBe(true);
    }
  });

  it("allows refund and dispute resolution branches", () => {
    expect(canTransitionEscrowState("DEPOSIT_CONFIRMED", "REFUND_PENDING")).toBe(true);
    expect(canTransitionEscrowState("REFUND_PENDING", "REFUNDED")).toBe(true);
    expect(canTransitionEscrowState("RIDE_IN_PROGRESS", "DISPUTED")).toBe(true);
    expect(canTransitionEscrowState("DISPUTED", "DISPUTE_RESOLVED_SPLIT")).toBe(true);
    expect(canTransitionEscrowState("DISPUTE_RESOLVED_SPLIT", "RELEASED")).toBe(true);
    expect(canTransitionEscrowState("DISPUTE_RESOLVED_SPLIT", "REFUNDED")).toBe(true);
  });

  it("rejects invalid financial transitions", () => {
    expect(validateEscrowTransition("NO_DEPOSIT", "RELEASED")).toMatchObject({
      ok: false,
      current: "NO_DEPOSIT",
      next: "RELEASED",
    });

    expect(() => assertEscrowTransition("NO_DEPOSIT", "RELEASED")).toThrow(
      InvalidEscrowTransitionError
    );
    expect(() => assertEscrowTransition("RELEASED", "REFUNDED")).toThrow(
      InvalidEscrowTransitionError
    );
    expect(() => assertEscrowTransition("REFUNDED", "RELEASED")).toThrow(
      InvalidEscrowTransitionError
    );
  });

  it("parses valid states and rejects unknown states", () => {
    expect(parseEscrowState("DISPUTED")).toBe("DISPUTED");
    expect(() => parseEscrowState("LOCKED")).toThrow(InvalidEscrowStateError);
    expect(() => validateEscrowTransition("NO_DEPOSIT", "LOCKED")).toThrow(
      InvalidEscrowStateError
    );
  });

  it("marks only final states as terminal", () => {
    expect(isTerminalEscrowState("RELEASED")).toBe(true);
    expect(isTerminalEscrowState("REFUNDED")).toBe(true);
    expect(isTerminalEscrowState("FAILED")).toBe(true);
    expect(isTerminalEscrowState("EXPIRED")).toBe(true);
    expect(isTerminalEscrowState("DISPUTED")).toBe(false);
    expect(isTerminalEscrowState("RELEASE_PENDING")).toBe(false);
  });
});

