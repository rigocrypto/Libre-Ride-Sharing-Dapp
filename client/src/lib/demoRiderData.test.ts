import { describe, expect, it } from "vitest";
import {
  RIDER_PROFILE,
  TRUST_BADGES,
  ORLANDO_DESTINATIONS,
  RIDE_PACKAGES,
  ESCROW_FLOW_STEPS,
  RIDER_STATUS_STEPS,
  getRiderStatusStep,
  SAFETY_FEATURES,
  RIDER_NOTIFICATIONS,
  AI_TRAVEL_TIPS,
  RECENT_RIDES,
} from "./demoRiderData";

describe("demo rider dashboard data", () => {
  it("exposes the four Orlando-visitor trust badges", () => {
    expect(TRUST_BADGES).toHaveLength(4);
    expect(TRUST_BADGES.map((b) => b.label)).toEqual([
      "Escrow Protected",
      "Transparent Fare",
      "Verified Drivers",
      "Orlando Ready",
    ]);
  });

  it("provides Orlando destination presets with form-fillable pickup + destination", () => {
    expect(ORLANDO_DESTINATIONS.length).toBeGreaterThanOrEqual(8);
    for (const d of ORLANDO_DESTINATIONS) {
      // Presets must carry non-empty pickup/destination so "Use this route" can
      // prefill the booking form without breaking the create-ride payload.
      expect(d.pickup.trim().length).toBeGreaterThan(0);
      expect(d.destination.trim().length).toBeGreaterThan(0);
      expect(d.distanceMiles).toBeGreaterThan(0);
    }
    // Keys must be unique (used as React list keys).
    expect(new Set(ORLANDO_DESTINATIONS.map((d) => d.key)).size).toBe(ORLANDO_DESTINATIONS.length);
  });

  it("offers the LIBRE ride packages with demo pricing", () => {
    const names = RIDE_PACKAGES.map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(["1 Ride Short", "3 Ride Pack", "1 Ride Long", "Hourly Package", "Airport Pickup"]),
    );
    for (const p of RIDE_PACKAGES) {
      expect(p.price).toMatch(/^\$\d/);
    }
  });

  it("describes the five-step escrow flow", () => {
    expect(ESCROW_FLOW_STEPS).toHaveLength(5);
    expect(ESCROW_FLOW_STEPS[0].label).toBe("Request Ride");
    expect(ESCROW_FLOW_STEPS[4].label).toBe("Payment Released");
  });

  describe("getRiderStatusStep — maps lifecycle to the stepper", () => {
    it("returns step 0 while requesting / estimating", () => {
      expect(getRiderStatusStep("request")).toBe(0);
      expect(getRiderStatusStep("estimate")).toBe(0);
    });

    it("returns step 1 while paying/escrow", () => {
      expect(getRiderStatusStep("payment")).toBe(1);
    });

    it("maps live backend statuses to the correct step", () => {
      expect(getRiderStatusStep("live", "escrow_confirmed")).toBe(2);
      expect(getRiderStatusStep("live", "driver_assigned")).toBe(3);
      expect(getRiderStatusStep("live", "in_progress")).toBe(3);
      expect(getRiderStatusStep("live", "completed")).toBe(4);
    });

    it("never returns an index outside the steps array", () => {
      const statuses = [undefined, "escrow_confirmed", "driver_assigned", "in_progress", "completed", "weird"];
      for (const s of statuses) {
        const idx = getRiderStatusStep("live", s);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(RIDER_STATUS_STEPS.length);
      }
    });
  });

  it("supplies content for the supporting demo panels", () => {
    expect(RIDER_PROFILE.language).toContain("Español");
    expect(SAFETY_FEATURES.length).toBeGreaterThan(0);
    expect(RIDER_NOTIFICATIONS.length).toBeGreaterThan(0);
    expect(AI_TRAVEL_TIPS.length).toBeGreaterThan(0);
    expect(RECENT_RIDES.every((r) => r.status === "completed")).toBe(true);
  });
});
