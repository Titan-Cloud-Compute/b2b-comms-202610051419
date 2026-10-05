import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('admin reaches customer management — admin-customers', async ({ page }) => {
  await page.goto('/#/');
  // setup
  await page.goto('/#/');
  await page.getByLabel('Email').fill(process.env.JOURNEY_EMAIL);
  await page.getByLabel('Password').fill(process.env.JOURNEY_PASSWORD);
  await page.getByRole('button').click();
  // slice
  await page.goto('/#/');
});
