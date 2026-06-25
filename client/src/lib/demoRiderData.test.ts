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
  RIDER_ACCOUNT,
  TRIP_PREFERENCES,
  RIDER_SAFETY_SETTINGS,
  RIDER_REFERRAL,
  RIDER_SUPPORT_ITEMS,
  RIDER_WALLET,
  ITINERARY,
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

describe("rider profile / account data", () => {
  it("defines the rider identity (the 'Orlando Visitor' equivalent of Carlos M.)", () => {
    expect(RIDER_ACCOUNT.name).toBe("Orlando Visitor");
    expect(RIDER_ACCOUNT.rating).toBeGreaterThan(0);
    expect(RIDER_ACCOUNT.initials.length).toBeGreaterThan(0);
    expect(RIDER_ACCOUNT.language).toContain("Español");
  });

  it("provides trip preferences with favorite Orlando areas", () => {
    expect(TRIP_PREFERENCES.favoriteAreas.length).toBeGreaterThanOrEqual(5);
    expect(TRIP_PREFERENCES.favoriteAreas).toContain("MCO Airport");
    expect(TRIP_PREFERENCES.preferredPackage.length).toBeGreaterThan(0);
  });

  it("lists safety settings, all enabled for the demo", () => {
    expect(RIDER_SAFETY_SETTINGS.length).toBeGreaterThan(0);
    expect(RIDER_SAFETY_SETTINGS.every((s) => s.enabled)).toBe(true);
    expect(new Set(RIDER_SAFETY_SETTINGS.map((s) => s.key)).size).toBe(RIDER_SAFETY_SETTINGS.length);
  });

  it("exposes wallet demo fields and a clear no-real-funds payment method", () => {
    expect(RIDER_WALLET.usdcBalance).toMatch(/USDC/);
    expect(RIDER_WALLET.paymentMethod).toMatch(/Demo/i);
    expect(RIDER_WALLET.recentPayment.length).toBeGreaterThan(0);
  });

  it("provides a referral code and support items", () => {
    expect(RIDER_REFERRAL.code).toBe("ORLANDO-RIDER");
    expect(RIDER_SUPPORT_ITEMS.length).toBeGreaterThan(0);
  });

  it("has itinerary entries for the trip-history panel", () => {
    expect(ITINERARY.length).toBeGreaterThan(0);
    expect(ITINERARY.some((it) => it.status === "upcoming")).toBe(true);
  });
});
