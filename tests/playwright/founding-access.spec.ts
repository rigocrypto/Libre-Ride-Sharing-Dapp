import { test, expect } from "@playwright/test";

test("Founding Access landing page renders core CTAs", async ({ page }) => {
  await page.goto("/founding-access");

  await expect(page.getByRole("heading", { name: "LIBRE Ride" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Join as Founding Driver" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Request Investor Deck" })).toBeVisible();
  await expect(page.getByText("Interest collection only")).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply as Founding Driver" })).toBeVisible();
});
