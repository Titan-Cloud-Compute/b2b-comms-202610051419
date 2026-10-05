import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

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

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`landing renders portal copy, highlights and role CTAs at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/#/');
    expect(page.url()).not.toMatch(/#\/login/);
    await expect(page.locator('h1')).toHaveText('B2B Vendor & Customer Workspace Portal');
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
      expect(await cta.getAttribute('href')).toMatch(new RegExp(href.replace('/', '\\/') + '$'));
    }
    expect(await page.locator('body').innerText()).not.toContain('A modern platform for your organization');
  });
}
