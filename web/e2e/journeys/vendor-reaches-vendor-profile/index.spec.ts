import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('vendor reaches vendor profile — index', async ({ page }) => {
  await page.goto('/#/');
  // setup
  await page.goto('/#/');
  // slice
  await page.getByLabel('Email').fill(process.env.JOURNEY_EMAIL);
  await page.getByLabel('Password').fill(process.env.JOURNEY_PASSWORD);
  await page.getByRole('button').click();
  await expect(page.getByTestId('vendor-profile-screen')).toBeVisible();
  await expect(page.getByTestId('channels-screen')).toBeVisible();
  await expect(page.getByTestId('invoices-screen')).toBeVisible();
  await expect(page.getByTestId('settings-notifications-screen')).toBeVisible();
});
