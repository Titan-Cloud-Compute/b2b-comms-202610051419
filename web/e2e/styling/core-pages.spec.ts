import { test, expect } from '@playwright/test';
import { mockApi, login } from '../spec/_support';

test.use({ serviceWorkers: 'block' });

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test(`auth pages have brand logo and primary-color submit button at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await mockApi(page);

    for (const path of ['/login', '/signup']) {
      await page.goto(`/#${path}`);

      // Brand logo must be visible
      await expect(page.locator('img[src$="brand/logo.svg"]')).toBeVisible();

      // Wait for the submit button to be present
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Submit button background-color must match --color-primary.
      // Use page.evaluate so the element is found and measured in a single
      // synchronous operation (avoids stale-handle after Angular re-renders).
      const { probeColor, btnColor } = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;opacity:0;pointer-events:none;background:var(--color-primary)';
        document.body.appendChild(probe);
        const pc = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const btn = document.querySelector('button[type="submit"]') as HTMLElement | null;
        const bc = btn ? getComputedStyle(btn).backgroundColor : 'NO_BUTTON_FOUND';
        return { probeColor: pc, btnColor: bc };
      });
      expect(btnColor, `${path} submit button color at ${vp.width}px`).toBe(probeColor);

      // No horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows at ${vp.width}px`).toBeLessThanOrEqual(1);
    }
  });

  test(`dashboard, settings, admin use .page primitives at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await mockApi(page);
    await login(page);

    for (const path of ['/dashboard', '/settings', '/admin']) {
      await page.goto(`/#${path}`);

      // .page must exist
      await expect(page.locator('.page').first()).toBeVisible();

      // .page-header h1 must exist inside .page
      await expect(page.locator('.page .page-header h1').first()).toBeVisible();

      // h1 font-family must use --font-display.
      // Use page.evaluate to find element and measure style atomically.
      const { probeFontFamily, h1FontFamily } = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;opacity:0;pointer-events:none;font-family:var(--font-display)';
        document.body.appendChild(probe);
        const pff = getComputedStyle(probe).fontFamily;
        probe.remove();
        const h1 = document.querySelector('.page .page-header h1') as HTMLElement | null;
        const hff = h1 ? getComputedStyle(h1).fontFamily : 'NO_H1_FOUND';
        return { probeFontFamily: pff, h1FontFamily: hff };
      });
      expect(h1FontFamily, `${path} h1 font-family at ${vp.width}px`).toBe(probeFontFamily);

      // No horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows at ${vp.width}px`).toBeLessThanOrEqual(1);
    }
  });
}
