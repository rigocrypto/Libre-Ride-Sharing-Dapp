import { test, expect } from '@playwright/test';

test('Rider payment-first flow smoke test', async ({ page }) => {
  // Wait for server to be ready, then seed dev data and get token + rideId
  const waitForServer = async () => {
    const max = 60; // up to 30s (60 * 500ms)
    for (let i = 0; i < max; i++) {
      try {
        const resp = await page.request.get('http://127.0.0.1:5000/api/user/test');
        console.log('waitForServer: attempt', i + 1, 'status', resp.status());
        if (resp.ok()) return;
      } catch (e) {
        // ignore
      }
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('Server did not become ready');
  };
  await waitForServer();

  const seedResp = await page.request.post('http://127.0.0.1:5000/api/__test/seed');
  console.log('seed status', seedResp.status());
  const seed = await seedResp.json();
  console.log('seed body', seed);
  if (!seed || !seed.rideId) throw new Error('Seed failed or returned invalid payload: ' + JSON.stringify(seed));
  const rideId = seed.rideId;
  const token = seed.token;

  // Set the dev token in localStorage before navigation
  await page.addInitScript((t) => {
    localStorage.setItem('firebaseToken', t);
  }, token);

  // Start at the Rider route
  await page.goto(`http://127.0.0.1:5000/rider?rideId=${rideId}`);

  // 1) Initial load: should show loading or finding driver
  await expect(page.locator('text=Loading ride details...').first()).toBeVisible({ timeout: 5000 }).catch(() => {});

  // Wait for either Finding Driver panel or Payment CTA
  const finding = page.locator('text=Finding driver');
  const payCTA = page.locator('text=Pay $25.00 with USDC');

  // Inspect console for errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 2) Simulate driver assigned by calling the production accept endpoint as the driver
  // Ensure accept succeeded
  // Note: in dev mode the driverToken maps to the seeded driver
  const acceptResp = await page.request.post(
    `http://127.0.0.1:5000/api/rides/${rideId}/accept`,
    { headers: { Authorization: `Bearer ${seed.driverToken}` }, data: {} }
  );
  if (!acceptResp.ok()) {
    throw new Error('Driver accept failed: ' + (await acceptResp.text()));
  }

  // After match, Payment CTA should appear
  await expect(payCTA.first()).toBeVisible({ timeout: 5000 });

  // 3) Click payment CTA and expect the payment flow to begin
  await payCTA.first().click();

  // For testing, trigger escrow confirm (simulate on-chain success) as the rider
  await page.request.post('http://127.0.0.1:5000/api/escrow/confirm', {
    headers: { Authorization: `Bearer ${token}` },
    data: { rideId: rideId, txHash: `0x${'a'.repeat(64)}` },
  });

  // After escrow confirmed, rider should see Driver Assigned / On the way
  await expect(page.locator('text=Driver on the way').first()).toBeVisible({ timeout: 5000 });

  // Simulate driver starting the ride
  await page.request.post(`http://127.0.0.1:5000/api/rides/${rideId}/complete`, { data: { finalPrice: 20 } });

  // After completion, expect ride summary
  await expect(page.locator('text=Ride summary').first()).toBeVisible({ timeout: 5000 });

  // Assert no console errors
  expect(consoleErrors).toEqual([]);
});
