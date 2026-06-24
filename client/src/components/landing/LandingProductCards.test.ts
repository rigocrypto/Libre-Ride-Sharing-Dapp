import { describe, expect, it } from "vitest";
import { productCards } from "./landingDemoCards";

function card(title: string) {
  const found = productCards.find((c) => c.title === title);
  if (!found) throw new Error(`card not found: ${title}`);
  return found;
}

describe("Product Demo cards", () => {
  it("renders Rider, Driver, and Admin demo cards", () => {
    for (const title of ["Rider App", "Driver Dashboard", "Admin Escrow Monitoring"]) {
      expect(productCards.some((c) => c.title === title)).toBe(true);
    }
  });

  it("links the Rider card to /rider with a live CTA", () => {
    expect(card("Rider App").href).toBe("/rider");
    expect(card("Rider App").cta).toBe("Open Rider Demo");
  });

  it("links the Driver card to /driver with a live CTA", () => {
    expect(card("Driver Dashboard").href).toBe("/driver");
    expect(card("Driver Dashboard").cta).toBe("Open Driver Demo");
  });

  it("links the Admin card to /admin with a live CTA", () => {
    expect(card("Admin Escrow Monitoring").href).toBe("/admin");
    expect(card("Admin Escrow Monitoring").cta).toBe("Open Admin Demo");
  });

  it("keeps AI Dispatch disabled / Coming Soon (no link)", () => {
    expect(card("AI Dispatch").href).toBeUndefined();
    expect(card("AI Dispatch").comingSoonNote).toBeTruthy();
  });

  it("keeps Web3 Wallet Flow disabled / Coming Soon (no link)", () => {
    expect(card("Web3 Wallet Flow").href).toBeUndefined();
    expect(card("Web3 Wallet Flow").comingSoonNote).toBeTruthy();
  });

  it("only links to demo routes that exist (relative paths, base preserved by wouter)", () => {
    const liveRoutes = productCards.filter((c) => c.href).map((c) => c.href);
    expect(liveRoutes).toEqual(["/rider", "/driver", "/admin"]);
    // Relative (not absolute) so wouter prepends the GitHub Pages base path.
    for (const href of liveRoutes) {
      expect(href!.startsWith("/")).toBe(true);
      expect(href!).not.toMatch(/^https?:\/\//);
    }
  });
});
