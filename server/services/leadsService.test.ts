import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLeadsForTests,
  createFoundingDriverLead,
  createInvestorInterestLead,
  DuplicateLeadError,
  leadsToCsv,
  listFoundingDriverLeads,
  listInvestorInterestLeads,
  scoreFoundingDriverLead,
  scoreInvestorInterestLead,
  updateFoundingDriverLead,
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
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    const leads = await listFoundingDriverLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0].email).toBe("rigo@example.com");
    expect(leads[0].leadScore).toBeGreaterThan(0);
  });

  it("rejects duplicate founding driver lead emails", async () => {
    await createFoundingDriverLead({
      fullName: "Rigo Driver",
      email: "driver@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    await expect(
      createFoundingDriverLead({
        fullName: "Same Driver",
        email: "DRIVER@example.com",
        consentContact: true,
        consentVerification: true,
        consentPrivacy: true,
      })
    ).rejects.toThrow(DuplicateLeadError);
  });

  it("stores investor interest leads", async () => {
    await createInvestorInterestLead({
      fullName: "Partner Lead",
      email: "partner@example.com",
      leadType: "Strategic Partner",
      interestType: "Partnership",
      consentContact: true,
      consentNotOffering: true,
      consentPrivacy: true,
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
      consentContact: true,
      consentNotOffering: true,
      consentPrivacy: true,
    });

    await expect(
      createInvestorInterestLead({
        fullName: "Same Investor",
        email: "INVESTOR@example.com",
        leadType: "Sponsor",
        consentContact: true,
        consentNotOffering: true,
        consentPrivacy: true,
      })
    ).rejects.toThrow(DuplicateLeadError);
  });

  it("scores high-intent driver leads", () => {
    const score = scoreFoundingDriverLead({
      fullName: "Airport Driver",
      email: "airport@example.com",
      city: "Kissimmee, FL",
      currentApps: ["Uber"],
      yearsDriving: 7,
      vehicleType: "SUV",
      vehicleYear: 2022,
      hasCommercialInsurance: true,
      interestedInAirport: true,
      wantsDemoAccess: true,
      wantsWhatsAppInvite: true,
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("scores high-intent investor leads", () => {
    const score = scoreInvestorInterestLead({
      fullName: "Strategic Partner",
      email: "strategic@example.com",
      leadType: "Strategic Partner",
      interestRange: "$10,000-$25,000",
      accredited: "Yes",
      interestType: "Partnership",
      preferredNextStep: "Book call",
      wantsInvestorDeck: true,
      wantsDemoAccess: true,
      consentContact: true,
      consentNotOffering: true,
      consentPrivacy: true,
      message: "Interested in Web3 payment and transportation partnership.",
    });

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("updates lead status and contact timestamp", async () => {
    const lead = await createFoundingDriverLead({
      fullName: "Follow Up Driver",
      email: "follow@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    const updated = await updateFoundingDriverLead(lead.id, {
      status: "contacted",
      adminNotes: "Called and qualified for next review.",
    });

    expect(updated?.status).toBe("contacted");
    expect(updated?.adminNotes).toContain("Called");
    expect(updated?.lastContactedAt).toBeInstanceOf(Date);
  });

  it("exports CSV with escaped values", () => {
    const csv = leadsToCsv(
      [
        {
          fullName: "Driver, One",
          email: "driver@example.com",
          currentApps: ["Uber", "Lyft"],
        },
      ],
      ["fullName", "email", "currentApps"]
    );

    expect(csv).toContain('"Driver, One"');
    expect(csv).toContain("Uber; Lyft");
  });
});
