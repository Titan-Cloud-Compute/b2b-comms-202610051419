import { test } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

test('admin reaches customer management — login', async ({ page }) => {
  await mockAuthBackend(page);
  // slice
  await page.goto('/#/login');
  await page.getByLabel('Email').fill('admin@b2b-portal.example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button').click();
  await page.getByTestId('admin-customers-screen').waitFor();
});
