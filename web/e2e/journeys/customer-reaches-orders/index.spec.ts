import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('customer reaches orders — index', async ({ page }) => {
  await page.goto('/#/');
  // setup
  await page.goto('/#/');
  // slice
  await page.getByLabel('Email').fill(process.env.JOURNEY_EMAIL);
  await page.getByLabel('Password').fill(process.env.JOURNEY_PASSWORD);
  await page.getByRole('button').click();
  await expect(page.getByTestId('orders-screen')).toBeVisible();
});
