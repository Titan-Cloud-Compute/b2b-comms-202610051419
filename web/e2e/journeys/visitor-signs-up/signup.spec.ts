import { test } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

test('visitor signs up — signup', async ({ page }) => {
  await mockAuthBackend(page);
  // slice
  await page.goto('/#/signup');
  await page.getByLabel('Email').fill('newuser@example.com');
  await page.getByLabel('Password').fill('Password1!');
  await page.getByRole('button').click();
  await page.getByText('Account created').waitFor();
});
