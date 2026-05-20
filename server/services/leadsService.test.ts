import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLeadsForTests,
  createFoundingDriverLead,
  createInvestorInterestLead,
  DuplicateLeadError,
  listFoundingDriverLeads,
  listInvestorInterestLeads,
} from "./leadsService";

describe("founding access lead capture", () => {
  beforeEach(() => {
    process.env.STORAGE_ENGINE = "mem";
    delete process.env.DATABASE_URL;
    clearLeadsForTests();
  });

  it("stores founding driver leads and normalizes email", async () => {
    await createFoundingDriverLead({
      fullName: "Rigo Driver",
      email: "RIGO@EXAMPLE.COM",
      city: "Orlando, FL",
      currentApps: ["uber", "lyft"],
    });

    const leads = await listFoundingDriverLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0].email).toBe("rigo@example.com");
  });

  it("rejects duplicate founding driver lead emails", async () => {
    await createFoundingDriverLead({
      fullName: "Rigo Driver",
      email: "driver@example.com",
    });

    await expect(
      createFoundingDriverLead({
        fullName: "Same Driver",
        email: "DRIVER@example.com",
      })
    ).rejects.toThrow(DuplicateLeadError);
  });

  it("stores investor interest leads", async () => {
    await createInvestorInterestLead({
      fullName: "Partner Lead",
      email: "partner@example.com",
      leadType: "Strategic Partner",
      interestType: "Partnership",
    });

    const leads = await listInvestorInterestLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0].leadType).toBe("Strategic Partner");
  });

  it("rejects duplicate investor interest emails", async () => {
    await createInvestorInterestLead({
      fullName: "Investor",
      email: "investor@example.com",
      leadType: "Investor",
    });

    await expect(
      createInvestorInterestLead({
        fullName: "Same Investor",
        email: "INVESTOR@example.com",
        leadType: "Sponsor",
      })
    ).rejects.toThrow(DuplicateLeadError);
  });
});
