import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Use the in-memory lead store and disable optional integrations before the
// router (and its dependencies) are imported.
process.env.STORAGE_ENGINE = "mem";
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY; // confirmation email is skipped (config disabled)
process.env.CRM_ENABLED = "false";

// Force the CRM sync to THROW so we can prove the route treats it as
// non-blocking and still returns success once the lead is stored.
vi.mock("../services/crmService", () => ({
  syncLeadToCrm: vi.fn(async () => {
    throw new Error("airtable unreachable");
  }),
}));

const { clearLeadsForTests } = await import("../services/leadsService");
const { default: leadsRouter } = await import("./leads");

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.set("trust proxy", true); // honour X-Forwarded-For so each test gets its own rate-limit bucket
  app.use(express.json());
  app.use(leadsRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  clearLeadsForTests();
});

let ipCounter = 0;
function post(path: string, body: unknown) {
  ipCounter += 1;
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Unique source IP per request avoids tripping the per-IP rate limiter.
      "X-Forwarded-For": `203.0.113.${ipCounter % 250}`,
    },
    body: JSON.stringify(body),
  });
}

const validDriver = {
  fullName: "Rigo Driver",
  email: "rigo.driver@example.com",
  phone: "407-555-0100",
  city: "Orlando, FL",
  currentApps: ["Uber"],
  preferredZones: ["MCO Airport"],
  wantsWhatsAppInvite: true,
  consentContact: true,
  consentVerification: true,
  consentPrivacy: true,
};

describe("POST /api/leads/founding-driver", () => {
  it("accepts a valid payload and returns success + referral code (even though CRM throws)", async () => {
    const res = await post("/api/leads/founding-driver", validDriver);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.referralCode).toMatch(/^[A-Z]+-[A-Z0-9]{6}$/);
  });

  it("returns 400 when required consent fields are missing", async () => {
    const { consentPrivacy, ...missingConsent } = validDriver;
    const res = await post("/api/leads/founding-driver", {
      ...missingConsent,
      email: "missing.consent@example.com",
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid lead data");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await post("/api/leads/founding-driver", { ...validDriver, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate email", async () => {
    const first = await post("/api/leads/founding-driver", { ...validDriver, email: "dupe@example.com" });
    expect(first.status).toBe(200);
    const second = await post("/api/leads/founding-driver", { ...validDriver, email: "DUPE@example.com" });
    expect(second.status).toBe(409);
  });

  it("enforces the per-IP rate limit (4th submission from same IP is blocked)", async () => {
    const headers = {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.7",
    };
    const send = (email: string) =>
      fetch(`${baseUrl}/api/leads/founding-driver`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...validDriver, email }),
      });
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await send(`rate${i}@example.com`);
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 3).every((s) => s === 200)).toBe(true);
    expect(statuses[3]).toBe(429);
  });
});
