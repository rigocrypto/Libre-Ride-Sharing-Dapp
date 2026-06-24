import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAppUrl, buildInternalPath, joinBasePath } from "./routes";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("joinBasePath", () => {
  it("preserves the GitHub Pages base path", () => {
    expect(joinBasePath("/Libre-Ride-Sharing-Dapp/", "/rider")).toBe("/Libre-Ride-Sharing-Dapp/rider");
    expect(joinBasePath("/Libre-Ride-Sharing-Dapp/", "/become-driver?ref=ABC")).toBe(
      "/Libre-Ride-Sharing-Dapp/become-driver?ref=ABC",
    );
  });

  it("works locally with a root base", () => {
    expect(joinBasePath("/", "/rider")).toBe("/rider");
  });

  it("never produces duplicate slashes", () => {
    expect(joinBasePath("/Libre-Ride-Sharing-Dapp/", "rider")).toBe("/Libre-Ride-Sharing-Dapp/rider");
    expect(joinBasePath("/Libre-Ride-Sharing-Dapp", "/rider")).toBe("/Libre-Ride-Sharing-Dapp/rider");
    expect(joinBasePath("/", "/")).toBe("/");
  });
});

describe("buildInternalPath", () => {
  it("prefixes the active BASE_URL", () => {
    vi.stubEnv("BASE_URL", "/Libre-Ride-Sharing-Dapp/");
    expect(buildInternalPath("/admin")).toBe("/Libre-Ride-Sharing-Dapp/admin");
    expect(buildInternalPath("/founding-access")).toBe("/Libre-Ride-Sharing-Dapp/founding-access");
    expect(buildInternalPath("/privacy")).toBe("/Libre-Ride-Sharing-Dapp/privacy");
  });

  it("returns a clean root path when served locally", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(buildInternalPath("/driver")).toBe("/driver");
  });
});

describe("buildAppUrl", () => {
  it("builds an absolute, base-aware shareable URL", () => {
    vi.stubEnv("BASE_URL", "/Libre-Ride-Sharing-Dapp/");
    vi.stubGlobal("window", { location: { origin: "https://rigocrypto.github.io" } });
    expect(buildAppUrl("/become-driver?ref=XYZ")).toBe(
      "https://rigocrypto.github.io/Libre-Ride-Sharing-Dapp/become-driver?ref=XYZ",
    );
  });
});
