import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLeadsForTests,
  createFoundingDriverLead,
  createInvestorInterestLead,
  DuplicateLeadError,
  generateReferralCode,
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
    expect(leads[0].referralCode).toMatch(/^[A-Z]+-[A-Z0-9]{6}$/);
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
    const { lead } = await createFoundingDriverLead({
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

describe("referral code generation", () => {
  it("produces FIRSTNAME-XXXXXX format", () => {
    const code = generateReferralCode("Rigo Vivas");
    expect(code).toMatch(/^RIGO-[A-Z0-9]{6}$/);
  });

  it("strips non-alpha chars from prefix", () => {
    const code = generateReferralCode("J0hn Doe");
    expect(code).toMatch(/^JHN-[A-Z0-9]{6}$/);
  });

  it("falls back to LIBRE prefix when name has no letters", () => {
    const code = generateReferralCode("123 456");
    expect(code).toMatch(/^LIBRE-[A-Z0-9]{6}$/);
  });

  it("falls back to LIBRE prefix when name is undefined", () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^LIBRE-[A-Z0-9]{6}$/);
  });

  it("caps prefix at 8 characters", () => {
    const code = generateReferralCode("Bartholomew Smith");
    const [prefix] = code.split("-");
    expect(prefix.length).toBeLessThanOrEqual(8);
  });

  it("suffix contains only safe characters (no 0, O, I, 1)", () => {
    for (let i = 0; i < 50; i++) {
      const [, suffix] = generateReferralCode("Test").split("-");
      expect(suffix).not.toMatch(/[01IO]/);
    }
  });
});

describe("referral attribution", () => {
  beforeEach(() => {
    process.env.STORAGE_ENGINE = "mem";
    delete process.env.DATABASE_URL;
    clearLeadsForTests();
  });

  it("generates a unique referral_code for every new founding driver lead", async () => {
    const { lead } = await createFoundingDriverLead({
      fullName: "Rigo Driver",
      email: "rigo@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });
    expect(lead.referralCode).toMatch(/^[A-Z]+-[A-Z0-9]{6}$/);
  });

  it("returns referralStatus 'none' when no referral code is provided", async () => {
    const { referralStatus } = await createFoundingDriverLead({
      fullName: "Solo Driver",
      email: "solo@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });
    expect(referralStatus).toBe("none");
  });

  it("attributes a valid referred_by_code", async () => {
    const { lead: referrer } = await createFoundingDriverLead({
      fullName: "Referrer Driver",
      email: "referrer@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    const { lead: referred, referralStatus } = await createFoundingDriverLead({
      fullName: "New Driver",
      email: "new@example.com",
      referredByCode: referrer.referralCode,
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    expect(referralStatus).toBe("attributed");
    expect(referred.referredByCode).toBe(referrer.referralCode);
  });

  it("ignores an invalid referred_by_code", async () => {
    const { lead, referralStatus } = await createFoundingDriverLead({
      fullName: "New Driver",
      email: "new2@example.com",
      referredByCode: "FAKE-ZZZZZZ",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    expect(referralStatus).toBe("invalid");
    expect(lead.referredByCode).toBeNull();
  });

  it("ignores self-referral", async () => {
    const { lead: self } = await createFoundingDriverLead({
      fullName: "Self Driver",
      email: "self@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    await expect(
      createFoundingDriverLead({
        fullName: "Self Driver Again",
        email: "self@example.com",
        referredByCode: self.referralCode,
        consentContact: true,
        consentVerification: true,
        consentPrivacy: true,
      })
    ).rejects.toThrow(DuplicateLeadError);
  });

  it("normalizes referred_by_code to uppercase before lookup", async () => {
    const { lead: referrer } = await createFoundingDriverLead({
      fullName: "Referrer",
      email: "referrer-norm@example.com",
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    const { lead: referred, referralStatus } = await createFoundingDriverLead({
      fullName: "Referred",
      email: "referred-norm@example.com",
      referredByCode: referrer.referralCode.toLowerCase(),
      consentContact: true,
      consentVerification: true,
      consentPrivacy: true,
    });

    expect(referralStatus).toBe("attributed");
    expect(referred.referredByCode).toBe(referrer.referralCode);
  });
});
