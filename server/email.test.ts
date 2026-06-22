import { afterEach, describe, expect, it } from "vitest";
import {
  buildFoundingDriverEmail,
  buildFoundingDriverEmailText,
  buildInvestorEmail,
  getAppBaseUrl,
} from "./email";

// Restore env vars changed per test
const saved: Record<string, string | undefined> = {};
function saveEnv(...keys: string[]) {
  for (const k of keys) saved[k] = process.env[k];
}
function restoreEnv() {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("getAppBaseUrl", () => {
  afterEach(restoreEnv);

  it("returns APP_BASE_URL when set", () => {
    saveEnv("APP_BASE_URL");
    process.env.APP_BASE_URL = "https://libreride.com";
    expect(getAppBaseUrl()).toBe("https://libreride.com");
  });

  it("strips trailing slash", () => {
    saveEnv("APP_BASE_URL");
    process.env.APP_BASE_URL = "https://libreride.com/";
    expect(getAppBaseUrl()).toBe("https://libreride.com");
  });

  it("falls back to localhost in development when APP_BASE_URL is missing", () => {
    saveEnv("APP_BASE_URL", "NODE_ENV");
    delete process.env.APP_BASE_URL;
    process.env.NODE_ENV = "development";
    expect(getAppBaseUrl()).toBe("http://localhost:5173");
  });

  it("returns null in production when APP_BASE_URL is missing", () => {
    saveEnv("APP_BASE_URL", "NODE_ENV");
    delete process.env.APP_BASE_URL;
    process.env.NODE_ENV = "production";
    expect(getAppBaseUrl()).toBeNull();
  });

  it("builds a correct founding-access referral URL", () => {
    saveEnv("APP_BASE_URL");
    process.env.APP_BASE_URL = "https://libreride.com";
    const base = getAppBaseUrl();
    const url = `${base}/founding-access?ref=RIGO-A7K29P`;
    expect(url).toBe("https://libreride.com/founding-access?ref=RIGO-A7K29P");
  });
});

describe("buildFoundingDriverEmail", () => {
  it("includes the founder name", () => {
    const html = buildFoundingDriverEmail("Rigo", "RIGO-A7K29P", null);
    expect(html).toContain("Rigo");
  });

  it("includes the referral code", () => {
    const html = buildFoundingDriverEmail("Rigo", "RIGO-A7K29P", null);
    expect(html).toContain("RIGO-A7K29P");
  });

  it("includes the invite URL when provided", () => {
    const url = "http://localhost:5173/founding-access?ref=RIGO-A7K29P";
    const html = buildFoundingDriverEmail("Rigo", "RIGO-A7K29P", url);
    expect(html).toContain(url);
  });

  it("omits invite link when inviteUrl is null", () => {
    const html = buildFoundingDriverEmail("Rigo", "RIGO-A7K29P", null);
    expect(html).not.toContain("founding-access?ref=");
  });

  it("omits referral block entirely when referralCode is null", () => {
    const html = buildFoundingDriverEmail("Rigo", null, null);
    expect(html).not.toContain("invite code");
    expect(html).not.toContain("ref=");
  });
});

describe("buildFoundingDriverEmailText", () => {
  it("includes referral code in plain text", () => {
    const text = buildFoundingDriverEmailText("Rigo", "RIGO-A7K29P", null);
    expect(text).toContain("RIGO-A7K29P");
  });

  it("includes invite URL in plain text when provided", () => {
    const url = "http://localhost:5173/founding-access?ref=RIGO-A7K29P";
    const text = buildFoundingDriverEmailText("Rigo", "RIGO-A7K29P", url);
    expect(text).toContain(url);
  });

  it("omits invite URL when null", () => {
    const text = buildFoundingDriverEmailText("Rigo", "RIGO-A7K29P", null);
    expect(text).not.toContain("founding-access");
  });
});

describe("buildInvestorEmail", () => {
  it("includes the investor name", () => {
    const html = buildInvestorEmail("Maria");
    expect(html).toContain("Maria");
  });

  it("does not include founding driver referral content", () => {
    const html = buildInvestorEmail("Maria");
    expect(html).not.toContain("founding-access");
    expect(html).not.toContain("ref=");
    expect(html).not.toContain("invite code");
  });
});
