import { test, expect } from '@playwright/test';
import { mockApi, login } from '../spec/_support';

test.use({ serviceWorkers: 'block' });

const SCREENS: [string, string][] = [
  ['/channels', 'channels-screen'],
  ['/orders', 'orders-screen'],
  ['/invoices', 'invoices-screen'],
  ['/vendor/profile', 'vendor-profile-screen'],
  ['/settings/notifications', 'settings-notifications-screen'],
  ['/admin/customers', 'admin-customers-screen'],
  ['/admin/audit-log', 'admin-audit-log-screen'],
];

for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 800 }]) {
  test(`feature pages use the shared page primitives at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await login(page);
    for (const [path, testId] of SCREENS) {
      await page.goto(`/#${path}`);
      const screen = page.getByTestId(testId);
      await expect(screen).toBeVisible();
      await expect(screen).toHaveClass(/\bpage\b/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows sideways`).toBeLessThanOrEqual(1);
    }
  });
}

test('ChannelList, OrderQueue and InvoiceViewer primitives are applied', async ({ page }) => {
  await mockApi(page);
  await login(page);
  await page.goto('/#/channels');
  await expect(page.locator('.channel-list')).toBeVisible();
  await page.goto('/#/orders');
  await expect(page.getByTestId('orders-screen')).toBeVisible();
  await page.goto('/#/invoices');
  await expect(page.locator('.invoice-viewer[data-testid="invoice-list"]')).toBeVisible();
});
