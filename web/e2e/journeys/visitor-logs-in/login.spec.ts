import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('visitor logs in — login', async ({ page }) => {
  await page.goto('/#/');
  // slice
  await page.goto('/#/');
});
