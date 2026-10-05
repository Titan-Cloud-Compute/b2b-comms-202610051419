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

test('visitor signs up — signup', async ({ page }) => {
  await page.goto('/#/signup');
  await page.getByLabel('Email').fill('newuser@example.com');
  await page.getByLabel('Password').fill('Password1!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Account created')).toBeVisible();
  await expect(page).toHaveURL(/#\/orders/);
});
