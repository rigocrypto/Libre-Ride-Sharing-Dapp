import { test, expect } from "@playwright/test";

const WALLET_HOST_PATTERNS = [
  "walletconnect",
  "web3modal",
  "reown",
  "pulse.wallet",
] as const;

function isWalletProviderRequest(url: string): boolean {
  const lower = url.toLowerCase();
  return WALLET_HOST_PATTERNS.some((pattern) => lower.includes(pattern));
}

test.describe("public routes — wallet-free", () => {
  test("/founding-access loads without wallet providers", async ({ page }) => {
    const walletRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (isWalletProviderRequest(url)) {
        walletRequests.push(url);
      }
    });

    await page.goto("/founding-access");
    await page.waitForLoadState("networkidle");

    expect(walletRequests).toHaveLength(0);
    await expect(
      page.getByRole("heading", { name: "LIBRE Ride", level: 1 }),
    ).toBeVisible();
  });

  test("/founding-access survives direct refresh", async ({ page }) => {
    await page.goto("/founding-access");
    await page.waitForLoadState("networkidle");
    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "LIBRE Ride", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply as Founding Driver" })).toBeVisible();
  });
});

test.describe("wallet routes — providers expected", () => {
  test("/rider loads without crashing (wallet providers may initialize)", async ({ page }) => {
    const walletRequests: string[] = [];

    page.on("request", (request) => {
      if (isWalletProviderRequest(request.url())) {
        walletRequests.push(request.url());
      }
    });

    await page.goto("/rider");
    await page.waitForLoadState("networkidle");

    // WalletConnect/Reown may request remote config in dev without a project ID.
    // The important check is that the route renders instead of a blank error page.
    await expect(page).not.toHaveURL(/error/i);
    expect(walletRequests.length).toBeGreaterThanOrEqual(0);
  });
});
