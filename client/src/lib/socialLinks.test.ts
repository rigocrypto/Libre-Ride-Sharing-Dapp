import { afterEach, describe, expect, it, vi } from "vitest";
import { getGithubLink, getTwitterLink, getWhatsAppLink } from "./socialLinks";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getGithubLink", () => {
  it("defaults to the LIBRE repo and is env-overridable", () => {
    expect(getGithubLink().href).toBe("https://github.com/rigocrypto/Libre-Ride-Sharing-Dapp");
    vi.stubEnv("VITE_LIBRE_GITHUB_URL", "https://github.com/example/repo");
    expect(getGithubLink().href).toBe("https://github.com/example/repo");
  });
});

describe("getWhatsAppLink", () => {
  it("builds a wa.me link from the default support number", () => {
    vi.stubEnv("VITE_LIBRE_WHATSAPP", "");
    expect(getWhatsAppLink()?.href).toBe("https://wa.me/16892165223");
  });

  it("honours a full URL override", () => {
    vi.stubEnv("VITE_LIBRE_WHATSAPP_URL", "https://chat.whatsapp.com/abc123");
    expect(getWhatsAppLink()?.href).toBe("https://chat.whatsapp.com/abc123");
  });

  it("builds from a number override", () => {
    vi.stubEnv("VITE_LIBRE_WHATSAPP", "407-555-0123");
    expect(getWhatsAppLink()?.href).toBe("https://wa.me/14075550123");
  });
});

describe("getTwitterLink", () => {
  it("returns a placeholder by default and is env-overridable", () => {
    expect(getTwitterLink().href).toBe("https://x.com/LibreRide");
    vi.stubEnv("VITE_LIBRE_TWITTER_URL", "https://x.com/RealHandle");
    expect(getTwitterLink().href).toBe("https://x.com/RealHandle");
  });
});
