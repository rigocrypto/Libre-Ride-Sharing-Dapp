import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Regression guards for the Rider Profile navigation + referral-API bug.
 *
 * Symptom: clicking "Profile" from the rider dashboard opened the legacy
 * `/profile` page, which fired raw relative `fetch('/api/referrals/...')`
 * calls. On GitHub Pages those resolve to `https://<pages-host>/api/...`,
 * return HTML 404/405, and break JSON parsing ("Unexpected token '<'").
 *
 * These are source-level checks (no React Testing Library is configured in
 * this project), so they run under plain vitest/node.
 */
const here = dirname(fileURLToPath(import.meta.url));
const read = (relPath: string) => readFileSync(join(here, relPath), "utf8");

describe("rider profile navigation", () => {
  it("registers the redesigned /rider/profile route", () => {
    const app = read("../App.tsx");
    expect(app).toContain('path="/rider/profile"');
  });

  it("points the rider dashboard header Profile button at /rider/profile", () => {
    const rider = read("./Rider.tsx");
    expect(rider).toContain('href="/rider/profile"');
    // The legacy /profile target must not come back for the rider header link.
    expect(rider).not.toContain('href="/profile"');
  });

  it("keeps the DemoRiderFlow 'View Profile' link on /rider/profile", () => {
    const flow = read("../components/demo/DemoRiderFlow.tsx");
    expect(flow).toContain('href="/rider/profile"');
  });

  it("does not call the referral API with a relative path that 404s on GitHub Pages", () => {
    const profile = read("./Profile.tsx");
    // No raw relative fetch to the referral endpoints (the source of the
    // HTML-parsed-as-JSON console errors).
    expect(profile).not.toMatch(/fetch\(\s*[`'"]\/?api\/referrals/);
    // And no leftover placeholder user id driving live calls.
    expect(profile).not.toContain('"current-user-id"');
  });
});
