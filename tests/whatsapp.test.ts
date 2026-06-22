import { describe, expect, it } from "vitest";
import {
  buildWhatsAppInviteMessage,
  buildWhatsAppInviteUrl,
  normalizeWhatsAppPhone,
} from "../client/src/lib/whatsapp";

describe("normalizeWhatsAppPhone", () => {
  it("prefixes 10-digit US number with country code 1", () => {
    expect(normalizeWhatsAppPhone("4075551234")).toBe("14075551234");
  });

  it("accepts a formatted 10-digit number and strips non-digits", () => {
    expect(normalizeWhatsAppPhone("(407) 555-1234")).toBe("14075551234");
  });

  it("accepts an 11-digit number starting with 1 as-is", () => {
    expect(normalizeWhatsAppPhone("14075551234")).toBe("14075551234");
  });

  it("accepts a formatted 11-digit number and strips non-digits", () => {
    expect(normalizeWhatsAppPhone("+1 (407) 555-1234")).toBe("14075551234");
  });

  it("returns null for a 9-digit number (too short)", () => {
    expect(normalizeWhatsAppPhone("407555123")).toBeNull();
  });

  it("returns null for a 12-digit number (unrecognized format)", () => {
    expect(normalizeWhatsAppPhone("440755512345")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(normalizeWhatsAppPhone("")).toBeNull();
  });

  it("returns null for a number that does not start with 1 when 11 digits", () => {
    expect(normalizeWhatsAppPhone("24075551234")).toBeNull();
  });
});

describe("buildWhatsAppInviteMessage", () => {
  it("includes the first name", () => {
    const msg = buildWhatsAppInviteMessage("Rigo");
    expect(msg).toContain("Hi Rigo");
  });

  it("includes the referral code when provided", () => {
    const msg = buildWhatsAppInviteMessage("Rigo", "RIGO-A7K29P");
    expect(msg).toContain("RIGO-A7K29P");
    expect(msg).toContain("Your invite code is RIGO-A7K29P");
  });

  it("omits referral code sentence when code is null", () => {
    const msg = buildWhatsAppInviteMessage("Maria", null);
    expect(msg).not.toContain("invite code");
    expect(msg).not.toContain("null");
  });

  it("omits referral code sentence when code is undefined", () => {
    const msg = buildWhatsAppInviteMessage("Maria");
    expect(msg).not.toContain("invite code");
  });

  it("does not include sensitive or internal data", () => {
    const msg = buildWhatsAppInviteMessage("Rigo", "RIGO-A7K29P");
    expect(msg.toLowerCase()).not.toMatch(/leadScore|score|admin|internal|rejected|qualified/);
  });

  it("does not overpromise earnings or approval", () => {
    const msg = buildWhatsAppInviteMessage("Rigo", "RIGO-A7K29P");
    expect(msg.toLowerCase()).not.toMatch(/earn|guaranteed|approved|accept/);
  });
});

describe("buildWhatsAppInviteUrl", () => {
  it("builds a valid wa.me URL for a 10-digit phone", () => {
    const url = buildWhatsAppInviteUrl({
      phone: "4075551234",
      fullName: "Rigo Vivas",
      referralCode: "RIGO-A7K29P",
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/14075551234\?text=/);
  });

  it("uses only the first name from fullName", () => {
    const url = buildWhatsAppInviteUrl({
      phone: "4075551234",
      fullName: "Rigo Vivas",
      referralCode: null,
    });
    expect(url).toContain(encodeURIComponent("Hi Rigo"));
    expect(url).not.toContain("Vivas");
  });

  it("encodes the message in the URL", () => {
    const url = buildWhatsAppInviteUrl({
      phone: "4075551234",
      fullName: "Rigo Vivas",
      referralCode: "RIGO-A7K29P",
    });
    // Encoded space is %20
    expect(url).toContain("%20");
  });

  it("returns null when phone is null", () => {
    const url = buildWhatsAppInviteUrl({
      phone: null,
      fullName: "Rigo Vivas",
      referralCode: "RIGO-A7K29P",
    });
    expect(url).toBeNull();
  });

  it("returns null when phone is undefined", () => {
    const url = buildWhatsAppInviteUrl({
      phone: undefined,
      fullName: "Rigo Vivas",
      referralCode: null,
    });
    expect(url).toBeNull();
  });

  it("returns null when phone is invalid (too short)", () => {
    const url = buildWhatsAppInviteUrl({
      phone: "407555",
      fullName: "Rigo Vivas",
      referralCode: null,
    });
    expect(url).toBeNull();
  });
});

describe("WhatsApp action visibility rules", () => {
  function canShowWhatsAppAction(lead: {
    phone?: string | null;
    wantsWhatsAppInvite?: boolean;
  }, kind: "drivers" | "investors"): boolean {
    if (kind !== "drivers") return false;
    if (!lead.wantsWhatsAppInvite) return false;
    if (!lead.phone) return false;
    return normalizeWhatsAppPhone(lead.phone) !== null;
  }

  it("shows action for a driver with valid phone and wantsWhatsAppInvite", () => {
    expect(canShowWhatsAppAction({ phone: "4075551234", wantsWhatsAppInvite: true }, "drivers")).toBe(true);
  });

  it("hides action for investor leads", () => {
    expect(canShowWhatsAppAction({ phone: "4075551234", wantsWhatsAppInvite: true }, "investors")).toBe(false);
  });

  it("hides action when wantsWhatsAppInvite is false", () => {
    expect(canShowWhatsAppAction({ phone: "4075551234", wantsWhatsAppInvite: false }, "drivers")).toBe(false);
  });

  it("hides action when phone is missing", () => {
    expect(canShowWhatsAppAction({ phone: null, wantsWhatsAppInvite: true }, "drivers")).toBe(false);
  });

  it("hides action when phone is invalid", () => {
    expect(canShowWhatsAppAction({ phone: "12345", wantsWhatsAppInvite: true }, "drivers")).toBe(false);
  });
});
