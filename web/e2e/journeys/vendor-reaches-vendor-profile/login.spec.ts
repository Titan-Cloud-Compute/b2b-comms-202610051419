import { test } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

test('vendor reaches vendor profile — login', async ({ page }) => {
  await mockAuthBackend(page);
  // slice
  await page.goto('/#/login');
  await page.getByLabel('Email').fill('vendor@acme.example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button').click();
  await page.waitForURL((url) => !url.hash.startsWith('#/login'));
});
