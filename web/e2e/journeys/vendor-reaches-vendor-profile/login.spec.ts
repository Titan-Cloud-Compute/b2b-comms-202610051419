import { test, expect } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

// Hermetic run: the static dist has no backend. Answer the auth API from the
// seed and switch the app to its mock/client-side auth path before any app
// script executes.
test.beforeEach(async ({ page }) => {
  await mockAuthBackend(page);
  await page.addInitScript(() => {
    (window as unknown as { __USE_MOCKS__?: boolean }).__USE_MOCKS__ = true;
  });
});

test('vendor reaches vendor profile — login', async ({ page }) => {
  await page.goto('/#/login');
  await page.getByLabel('Email').fill('vendor@acme.example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/#\/login/);
  await expect(page).toHaveURL(/#\/orders/);
});
