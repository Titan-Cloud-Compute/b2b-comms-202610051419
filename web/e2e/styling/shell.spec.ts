import { test, expect } from '@playwright/test';
import { mockApi, login } from '../spec/_support';

test.use({ serviceWorkers: 'block' });

const PAGES = ['/channels', '/orders', '/invoices', '/vendor/profile', '/settings/notifications', '/admin/customers', '/admin/audit-log', '/dashboard'];

test('feature pages render inside the shared shell with card nav groups', async ({ page }) => {
  await mockApi(page);
  await login(page);
  for (const path of PAGES) {
    await page.goto(`/#${path}`);
    await expect(page.locator('app-layout')).toBeVisible();
    await expect(page.getByTestId('app-topbar')).toBeVisible();
    const groups = (await page.locator('.nav-group-label').allTextContents()).map((t) => t.trim());
    for (const g of ['Vendor', 'Customer', 'Admin']) expect(groups).toContain(g);
    expect(groups).not.toContain('Workspace');
  }
});

test('shell does not overflow sideways on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await mockApi(page);
  await login(page);
  await page.goto('/#/channels');
  await expect(page.getByTestId('channels-screen')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
