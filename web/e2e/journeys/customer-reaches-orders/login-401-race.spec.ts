import { test, expect } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  // Real HTTP sign-in path (no __USE_MOCKS__): the auth API is answered by
  // the hermetic seed backend so the interceptor sees genuine 401s.
  await mockAuthBackend(page);
});

test('customer reaches orders — a 401 racing sign-in does not bounce to login', async ({ page }) => {
  // Hold the sign-in response until the first GET /api/orders is in flight.
  let releaseLogin!: () => void;
  const loginHeld = new Promise<void>((r) => (releaseLogin = r));
  let markLoginDone!: () => void;
  const loginDone = new Promise<void>((r) => (markLoginDone = r));
  await page.route('**/api/auth/login', async (route) => {
    await loginHeld;
    markLoginDone();
    await route.fallback();
  });

  // The first GET /api/orders went out without a session: answer it 401,
  // but only after sign-in has succeeded.
  let first = true;
  let mark401Served!: () => void;
  const served401 = new Promise<void>((r) => (mark401Served = r));
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() !== 'GET' || !first) return route.fallback();
    first = false;
    releaseLogin();
    await loginDone;
    // Let the sign-in response land in the app before the stale 401 does.
    await new Promise((r) => setTimeout(r, 500));
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    });
    mark401Served();
  });

  await page.goto('/#/login');
  await page.getByLabel('Email').fill('buyer@corp.example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.evaluate(() => {
    window.location.hash = '#/orders';
  });

  await served401;
  await page.waitForTimeout(500);
  await expect(page).not.toHaveURL(/#\/login/);
  await expect(page).toHaveURL(/#\/orders/);
  await expect(page.getByTestId('orders-screen')).toBeVisible();
});
