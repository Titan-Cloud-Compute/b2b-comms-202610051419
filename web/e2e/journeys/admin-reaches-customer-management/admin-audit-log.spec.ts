import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('admin reaches customer management — admin-audit-log', async ({ page }) => {
  await page.goto('/#/');
  // setup
  await page.goto('/#/');
  await page.getByLabel('Email').fill(process.env.JOURNEY_EMAIL);
  await page.getByLabel('Password').fill(process.env.JOURNEY_PASSWORD);
  await page.getByRole('button').click();
  await page.goto('/#/');
  await page.getByTestId('admin-customers-screen').waitFor();
  // slice
  await page.goto('/#/');
});
