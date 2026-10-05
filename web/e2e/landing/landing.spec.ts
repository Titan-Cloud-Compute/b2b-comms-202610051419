import { test, expect } from '@playwright/test';
import { mockApi } from '../spec/_support';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await mockApi(page); });

const HIGHLIGHTS = [
  'Shared channels for real-time vendor-customer communication',
  'Integrated invoice management and approval workflows',
  'Role-based access for admins, vendors, and customers',
];

const CTAS: Array<[string, string, string]> = [
  ['landing-cta-admin', 'Get Started', '#/dashboard'],
  ['landing-cta-vendor', 'View Orders', '#/orders'],
  ['landing-cta-customer', 'Track Invoices', '#/invoices'],
];

test('landing renders portal copy, highlights and role CTAs at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/');
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toMatch(/#\/login/);

  await expect(page.getByTestId('landing-headline')).toHaveText('B2B Vendor & Customer Workspace Portal');
  await expect(page.getByTestId('landing-subheadline')).toHaveText(
    'Streamline onboarding, communications, and invoicing between vendors and customers in one place.',
  );

  for (let i = 0; i < HIGHLIGHTS.length; i++) {
    await expect(page.getByTestId(`landing-highlight-${i}`)).toContainText(HIGHLIGHTS[i]);
  }

  for (const [id, label, href] of CTAS) {
    const cta = page.getByTestId(id);
    await expect(cta).toBeVisible();
    await expect(cta).toContainText(label);
    expect(await cta.getAttribute('href')).toMatch(new RegExp(href.replace(/\//g, '\\/') + '$'));
  }

  await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('Enterprise Platform');
});

test('landing has no horizontal overflow at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('landing-headline')).toBeVisible();
  await expect(page.getByTestId('landing-subheadline')).toBeVisible();

  for (let i = 0; i < HIGHLIGHTS.length; i++) {
    await expect(page.getByTestId(`landing-highlight-${i}`)).toBeVisible();
  }

  for (const [id] of CTAS) {
    await expect(page.getByTestId(id)).toBeVisible();
  }

  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noOverflow).toBe(true);
});

test('View Orders CTA navigates to the orders route', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('landing-cta-vendor').click();
  await expect(page).toHaveURL(/#\/orders/, { timeout: 10_000 });
});
