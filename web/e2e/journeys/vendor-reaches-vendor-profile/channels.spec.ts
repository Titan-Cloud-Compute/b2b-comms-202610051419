import { test, expect } from '@playwright/test';
import { mockAuthBackend } from '../_hermetic-auth';

test.use({ serviceWorkers: 'block' });

test('vendor reaches vendor profile — channels', async ({ page }) => {
  await mockAuthBackend(page);
  await page.goto('/#/login');
  await page.locator('#email').fill('vendor@acme.example.com');
  await page.locator('#password').fill('password');
  await page.locator('button[type="submit"]').click();
  await page.goto('/#/channels');
  await expect(page.getByTestId('channels-screen')).toBeVisible();
});
