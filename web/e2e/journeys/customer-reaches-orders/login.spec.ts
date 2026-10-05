import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('customer reaches orders — login', async ({ page }) => {
  await page.goto('/#/');
  // slice
  await page.goto('/#/');
});
