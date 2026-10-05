import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('vendor reaches vendor profile — login', async ({ page }) => {
  await page.goto('/#/');
  // slice
  await page.goto('/#/');
});
