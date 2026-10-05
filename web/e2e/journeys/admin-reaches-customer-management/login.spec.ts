import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('admin reaches customer management — login', async ({ page }) => {
  await page.goto('/#/');
  // slice
  await page.goto('/#/');
});
