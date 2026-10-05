import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('vendor reaches vendor profile — channels', async ({ page }) => {
  await page.goto('/#/');
  // setup
  await page.goto('/#/');
  await page.getByLabel('Email').fill(process.env.JOURNEY_EMAIL);
  await page.getByLabel('Password').fill(process.env.JOURNEY_PASSWORD);
  await page.getByRole('button').click();
  await page.goto('/#/');
  await page.getByTestId('vendor-profile-screen').waitFor();
  // slice
  await page.goto('/#/');
});
