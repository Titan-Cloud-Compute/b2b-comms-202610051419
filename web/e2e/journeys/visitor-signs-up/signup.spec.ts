import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('visitor signs up — signup', async ({ page }) => {
  await page.goto('/#/');
  // slice
  await page.goto('/#/');
});
