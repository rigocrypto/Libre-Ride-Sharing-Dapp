import { describe, expect, it } from "vitest";
import {
  DRIVER_PROFILE,
  KPI_CARDS,
  NAV_ITEMS,
  WEEKLY_EARNINGS,
  EARNINGS_SUMMARY,
  WALLET,
  SAFETY_ITEMS,
  AI_TIPS,
  NOTIFICATIONS,
  PROMO,
  DEMAND_HOTSPOTS,
  SAMPLE_RIDES,
  formatUsd,
} from "./demoDriverData";

describe("demo driver dashboard data", () => {
  it("exposes the six headline KPIs the dashboard renders", () => {
    expect(KPI_CARDS).toHaveLength(6);
    const keys = KPI_CARDS.map((k) => k.key);
    expect(keys).toEqual(
      expect.arrayContaining(["earnings", "rides", "online", "acceptance", "balance", "usdc"]),
    );
    // Every KPI must have a non-empty label + value to render cleanly.
    for (const kpi of KPI_CARDS) {
      expect(kpi.label.length).toBeGreaterThan(0);
      expect(kpi.value.length).toBeGreaterThan(0);
    }
  });

  it("includes the full navigation rail", () => {
    const labels = NAV_ITEMS.map((n) => n.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Rides",
        "Earnings",
        "Wallet & Payouts",
        "Safety Center",
        "AI Assistant",
        "Settings",
      ]),
    );
    // Nav keys must be unique so active-state selection is unambiguous.
    expect(new Set(NAV_ITEMS.map((n) => n.key)).size).toBe(NAV_ITEMS.length);
  });

  it("provides a renderable weekly earnings series with a positive max", () => {
    expect(WEEKLY_EARNINGS.length).toBeGreaterThan(0);
    const max = Math.max(...WEEKLY_EARNINGS.map((b) => b.amount));
    expect(max).toBeGreaterThan(0);
    for (const bar of WEEKLY_EARNINGS) {
      expect(bar.amount).toBeGreaterThanOrEqual(0);
      // Bar height percentage must stay within 0–100.
      expect(Math.round((bar.amount / max) * 100)).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the promotions progress within bounds", () => {
    expect(PROMO.bonusEarned).toBeLessThanOrEqual(PROMO.bonusGoal);
    const pct = Math.round((PROMO.bonusEarned / PROMO.bonusGoal) * 100);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
    expect(PROMO.referralCode).toMatch(/^LIBRE-/);
  });

  it("describes sample rides as non-actionable previews (no real ride ids)", () => {
    expect(SAMPLE_RIDES.length).toBeGreaterThan(0);
    for (const ride of SAMPLE_RIDES) {
      // Sample ids are intentionally prefixed so they can never be confused
      // with real escrow-confirmed ride UUIDs sent to the accept endpoint.
      expect(ride.id.startsWith("sample-")).toBe(true);
      expect(ride.pickup.length).toBeGreaterThan(0);
      expect(ride.destination.length).toBeGreaterThan(0);
    }
  });

  it("marks demand hotspots with positions inside the mock map", () => {
    for (const spot of DEMAND_HOTSPOTS) {
      expect(spot.top).toBeGreaterThanOrEqual(0);
      expect(spot.top).toBeLessThanOrEqual(100);
      expect(spot.left).toBeGreaterThanOrEqual(0);
      expect(spot.left).toBeLessThanOrEqual(100);
    }
  });

  it("supplies content for every static demo panel", () => {
    expect(DRIVER_PROFILE.badges).toContain("Founding Driver");
    expect(SAFETY_ITEMS.every((s) => s.ok)).toBe(true);
    expect(AI_TIPS.length).toBeGreaterThan(0);
    expect(NOTIFICATIONS.length).toBeGreaterThan(0);
    expect(WALLET.transactions.length).toBeGreaterThan(0);
    expect(EARNINGS_SUMMARY.total).toBeGreaterThan(0);
  });

  it("formats USD consistently", () => {
    expect(formatUsd(238.75)).toBe("$238.75");
    expect(formatUsd(8)).toBe("$8.00");
  });
});
