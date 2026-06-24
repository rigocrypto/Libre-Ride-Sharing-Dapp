import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFoundingDriverFallback,
  buildFoundingDriverFallbackMessage,
  normalizeWhatsAppPhone,
} from "./whatsapp";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizeWhatsAppPhone", () => {
  it("prefixes a 10-digit US number with 1", () => {
    expect(normalizeWhatsAppPhone("(407) 555-0100")).toBe("14075550100");
  });

  it("accepts an 11-digit number starting with 1", () => {
    expect(normalizeWhatsAppPhone("1-407-555-0100")).toBe("14075550100");
  });

  it("returns null for unusable input", () => {
    expect(normalizeWhatsAppPhone("123")).toBeNull();
  });
});

describe("buildFoundingDriverFallbackMessage", () => {
  it("includes only the fields that are present", () => {
    const msg = buildFoundingDriverFallbackMessage({
      fullName: "Rigo Driver",
      phone: "407-555-0100",
      email: "rigo@example.com",
      preferredZones: ["MCO Airport", "Downtown Orlando"],
    });
    expect(msg).toContain("Name: Rigo Driver");
    expect(msg).toContain("Phone: 407-555-0100");
    expect(msg).toContain("Email: rigo@example.com");
    expect(msg).toContain("Preferred zones: MCO Airport, Downtown Orlando");
    expect(msg).not.toContain("City:"); // omitted when absent
  });
});

describe("buildFoundingDriverFallback", () => {
  const input = { fullName: "Rigo Driver", phone: "407-555-0100", email: "rigo@example.com" };

  it("builds a WhatsApp link when VITE_LIBRE_WHATSAPP is configured", () => {
    vi.stubEnv("VITE_LIBRE_WHATSAPP", "+1 (407) 555-0199");
    const fallback = buildFoundingDriverFallback(input);
    expect(fallback.channel).toBe("whatsapp");
    expect(fallback.href).toContain("https://wa.me/14075550199?text=");
    expect(decodeURIComponent(fallback.href)).toContain("Rigo Driver");
  });

  it("uses the default WhatsApp number when no env override is set", () => {
    vi.stubEnv("VITE_LIBRE_WHATSAPP", "");
    const fallback = buildFoundingDriverFallback(input);
    expect(fallback.channel).toBe("whatsapp");
    expect(fallback.href).toContain("https://wa.me/16892165223?text=");
  });

  it("falls back to a mailto link when the configured number is unusable", () => {
    vi.stubEnv("VITE_LIBRE_WHATSAPP", "123"); // too short to normalize
    const fallback = buildFoundingDriverFallback(input);
    expect(fallback.channel).toBe("email");
    expect(fallback.href.startsWith("mailto:security@gmx-labs.com")).toBe(true);
    expect(decodeURIComponent(fallback.href)).toContain("rigo@example.com");
  });
});
