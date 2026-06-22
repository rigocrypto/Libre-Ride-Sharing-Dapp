import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCrmConfig,
  syncLeadToCrm,
  type FoundingDriverCrmPayload,
  type InvestorCrmPayload,
} from "./crmService";

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

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  vi.clearAllMocks();
  restoreEnv();
});

function setAirtableEnv() {
  process.env.CRM_ENABLED = "true";
  process.env.CRM_PROVIDER = "airtable";
  process.env.AIRTABLE_API_KEY = "patTestKey";
  process.env.AIRTABLE_BASE_ID = "appTestBase";
  process.env.AIRTABLE_FOUNDING_DRIVERS_TABLE = "Founding Drivers";
  process.env.AIRTABLE_INVESTORS_TABLE = "Investors";
}

const driverPayload: FoundingDriverCrmPayload = {
  fullName: "Rigo Vivas",
  email: "rigo@example.com",
  phone: "407-555-1234",
  city: "Orlando",
  vehicleMakeModel: "Toyota Highlander",
  vehicleYear: 2022,
  preferredZones: ["Downtown", "Airport"],
  driverType: "full-time",
  leadScore: 82,
  status: "new",
  referralCode: "RIGO-A7K29P",
  referredByCode: null,
  wantsWhatsAppInvite: true,
  createdAt: new Date("2026-06-17T00:00:00Z"),
};

const investorPayload: InvestorCrmPayload = {
  fullName: "Maria Investor",
  email: "maria@vc.com",
  phone: null,
  leadType: "angel",
  interestRange: "$25k–$100k",
  interestType: "equity",
  message: "Looking forward to connecting.",
  leadScore: 70,
  status: "new",
  createdAt: new Date("2026-06-17T00:00:00Z"),
};

// --- getCrmConfig ---

describe("getCrmConfig", () => {
  beforeEach(() => saveEnv("CRM_ENABLED", "CRM_PROVIDER", "AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"));

  it("skips when CRM_ENABLED is not 'true'", () => {
    delete process.env.CRM_ENABLED;
    const config = getCrmConfig();
    expect(config.enabled).toBe(false);
    expect(config.reason).toMatch(/CRM_ENABLED/);
  });

  it("skips when CRM_PROVIDER is missing", () => {
    process.env.CRM_ENABLED = "true";
    delete process.env.CRM_PROVIDER;
    const config = getCrmConfig();
    expect(config.enabled).toBe(false);
    expect(config.reason).toMatch(/CRM_PROVIDER/);
  });

  it("skips when CRM_PROVIDER is unsupported", () => {
    process.env.CRM_ENABLED = "true";
    process.env.CRM_PROVIDER = "hubspot";
    const config = getCrmConfig();
    expect(config.enabled).toBe(false);
    expect(config.reason).toMatch(/hubspot/i);
  });

  it("skips when AIRTABLE_API_KEY is missing", () => {
    process.env.CRM_ENABLED = "true";
    process.env.CRM_PROVIDER = "airtable";
    delete process.env.AIRTABLE_API_KEY;
    delete process.env.AIRTABLE_BASE_ID;
    const config = getCrmConfig();
    expect(config.enabled).toBe(false);
    expect(config.reason).toMatch(/AIRTABLE_API_KEY/);
  });

  it("skips when AIRTABLE_BASE_ID is missing", () => {
    process.env.CRM_ENABLED = "true";
    process.env.CRM_PROVIDER = "airtable";
    process.env.AIRTABLE_API_KEY = "patTestKey";
    delete process.env.AIRTABLE_BASE_ID;
    const config = getCrmConfig();
    expect(config.enabled).toBe(false);
    expect(config.reason).toMatch(/AIRTABLE_BASE_ID/);
  });

  it("returns enabled when all Airtable vars are present", () => {
    process.env.CRM_ENABLED = "true";
    process.env.CRM_PROVIDER = "airtable";
    process.env.AIRTABLE_API_KEY = "patTestKey";
    process.env.AIRTABLE_BASE_ID = "appTestBase";
    const config = getCrmConfig();
    expect(config.enabled).toBe(true);
    expect(config.provider).toBe("airtable");
  });
});

// --- syncLeadToCrm: skip path ---

describe("syncLeadToCrm — CRM disabled", () => {
  beforeEach(() => saveEnv("CRM_ENABLED"));

  it("returns skipped when CRM_ENABLED is false", async () => {
    process.env.CRM_ENABLED = "false";
    const result = await syncLeadToCrm("founding_driver", driverPayload);
    expect(result.synced).toBe(false);
    expect(result.skipped).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// --- syncLeadToCrm: founding driver ---

describe("syncLeadToCrm — founding driver", () => {
  beforeEach(() => {
    saveEnv(
      "CRM_ENABLED", "CRM_PROVIDER",
      "AIRTABLE_API_KEY", "AIRTABLE_BASE_ID",
      "AIRTABLE_FOUNDING_DRIVERS_TABLE",
    );
    setAirtableEnv();
  });

  it("POSTs to the correct Airtable endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recABC123" }),
    });
    await syncLeadToCrm("founding_driver", driverPayload);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.airtable.com/v0/appTestBase/Founding%20Drivers");
    expect(opts.method).toBe("POST");
    expect(opts.headers).toMatchObject({ Authorization: "Bearer patTestKey" });
  });

  it("maps founding driver fields correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recABC123" }),
    });
    await syncLeadToCrm("founding_driver", driverPayload);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.fields).toMatchObject({
      Name: "Rigo Vivas",
      Email: "rigo@example.com",
      Phone: "407-555-1234",
      City: "Orlando",
      Vehicle: "Toyota Highlander",
      "Vehicle Year": 2022,
      "Preferred Zones": "Downtown, Airport",
      Availability: "full-time",
      Score: 82,
      Status: "new",
      "Referral Code": "RIGO-A7K29P",
      "Wants WhatsApp Invite": true,
    });
    expect(body.fields["Created At"]).toBe("2026-06-17T00:00:00.000Z");
    expect(body.fields).not.toHaveProperty("Referred By Code");
  });

  it("returns externalId on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recABC123" }),
    });
    const result = await syncLeadToCrm("founding_driver", driverPayload);
    expect(result.synced).toBe(true);
    expect(result.externalId).toBe("recABC123");
    expect(result.provider).toBe("airtable");
  });

  it("returns error and does not throw on HTTP error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ error: { type: "INVALID_FIELD_NAME" } }),
    });
    const result = await syncLeadToCrm("founding_driver", driverPayload);
    expect(result.synced).toBe(false);
    expect(result.error).toMatch(/422/);
    expect(result.provider).toBe("airtable");
  });

  it("returns error and does not throw on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const result = await syncLeadToCrm("founding_driver", driverPayload);
    expect(result.synced).toBe(false);
    expect(result.error).toBe("ECONNREFUSED");
  });

  it("uses custom table name from env var", async () => {
    process.env.AIRTABLE_FOUNDING_DRIVERS_TABLE = "My Drivers";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recXYZ" }),
    });
    await syncLeadToCrm("founding_driver", driverPayload);
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("My%20Drivers");
  });
});

// --- syncLeadToCrm: investor ---

describe("syncLeadToCrm — investor", () => {
  beforeEach(() => {
    saveEnv(
      "CRM_ENABLED", "CRM_PROVIDER",
      "AIRTABLE_API_KEY", "AIRTABLE_BASE_ID",
      "AIRTABLE_INVESTORS_TABLE",
    );
    setAirtableEnv();
  });

  it("POSTs to the investor table", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recINV001" }),
    });
    await syncLeadToCrm("investor_interest", investorPayload);
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.airtable.com/v0/appTestBase/Investors");
  });

  it("maps investor fields correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recINV001" }),
    });
    await syncLeadToCrm("investor_interest", investorPayload);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.fields).toMatchObject({
      Name: "Maria Investor",
      Email: "maria@vc.com",
      "Investor Type": "angel",
      "Check Size": "$25k–$100k",
      "Interest Area": "equity",
      Message: "Looking forward to connecting.",
      Score: 70,
      Status: "new",
    });
    expect(body.fields).not.toHaveProperty("Phone");
  });

  it("omits null/undefined optional fields from investor payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "recINV002" }),
    });
    await syncLeadToCrm("investor_interest", {
      ...investorPayload,
      message: null,
      interestType: undefined,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.fields).not.toHaveProperty("Message");
    expect(body.fields).not.toHaveProperty("Interest Area");
  });
});
