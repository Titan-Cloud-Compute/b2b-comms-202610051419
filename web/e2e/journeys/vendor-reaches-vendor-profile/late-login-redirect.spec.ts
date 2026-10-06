import { test, expect } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

test('vendor reaches vendor profile — late login response does not redirect away from /channels', async ({ page }) => {
  await mockAuthBackend(page);

  // Register a delayed login route AFTER mockAuthBackend so it takes precedence.
  // It waits 1500 ms before fulfilling, simulating a slow backend response.
  await page.route('**/api/auth/login', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'seed-vendor', email: 'vendor@acme.example.com', role: 'VENDOR' }),
    });
  });

  await page.goto('/#/login');
  await page.locator('#email').fill('vendor@acme.example.com');
  await page.locator('#password').fill('password');

  const loginDone = page.waitForResponse('**/api/auth/login');
  await page.locator('button[type="submit"]').click();

  // Navigate away before the slow login response arrives.
  await page.goto('/#/channels');
  await expect(page.getByTestId('channels-screen')).toBeVisible();

  // Wait for the delayed login response to land.
  await loginDone;
  await page.waitForTimeout(1000);

  // The guard must have suppressed the redirect — we should still be on /channels.
  await expect(page).toHaveURL(/#\/channels/);
  await expect(page.getByTestId('channels-screen')).toBeVisible();
  await expect(page.getByTestId('orders-screen')).toHaveCount(0);
});
