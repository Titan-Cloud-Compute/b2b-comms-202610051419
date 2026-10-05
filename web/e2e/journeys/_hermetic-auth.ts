/**
 * Hermetic auth backend for the journey specs.
 *
 * The hermetic Playwright config serves only the built SPA, so the auth API is
 * answered in-browser from this seed. The seed mirrors the demo accounts the
 * auth-entry card names (all with password "password"); self-service signup
 * creates VENDOR accounts, exactly like the real backend.
 */
import type { Page } from '@playwright/test';

type SeedUser = { id: string; email: string; password: string; role: string };

export const SEED_USERS: SeedUser[] = [
  { id: 'seed-admin', email: 'admin@b2b-portal.example.com', password: 'password', role: 'ADMIN' },
  { id: 'seed-vendor', email: 'vendor@acme.example.com', password: 'password', role: 'VENDOR' },
  { id: 'seed-customer', email: 'buyer@corp.example.com', password: 'password', role: 'CUSTOMER' },
];

export async function mockAuthBackend(page: Page): Promise<void> {
  const users: SeedUser[] = SEED_USERS.map((u) => ({ ...u }));
  let current: SeedUser | null = null;

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const apiPath = new URL(req.url()).pathname.replace(/^.*\/api\//, '');
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const body = (() => {
      try {
        return (req.postDataJSON() ?? {}) as { email?: string; password?: string };
      } catch {
        return {} as { email?: string; password?: string };
      }
    })();
    const email = String(body.email ?? '').trim().toLowerCase();

    if (method === 'POST' && apiPath === 'auth/login') {
      const user = users.find((u) => u.email === email && u.password === body.password);
      if (!user) return json({ message: 'invalid credentials' }, 401);
      current = user;
      return json({ id: user.id, email: user.email, role: user.role });
    }
    if (method === 'POST' && apiPath === 'auth/signup') {
      if (!email.includes('@') || String(body.password ?? '').length < 8) {
        return json({ message: 'invalid signup data' }, 400);
      }
      if (users.some((u) => u.email === email)) {
        return json({ message: 'email already registered' }, 409);
      }
      const user = { id: `u-${users.length + 1}`, email, password: String(body.password), role: 'VENDOR' };
      users.push(user);
      current = user;
      return json({ id: user.id, email: user.email, role: user.role }, 201);
    }
    if (method === 'GET' && apiPath === 'users/me') {
      return current
        ? json({ id: current.id, email: current.email, role: current.role })
        : json({ message: 'Unauthorized' }, 401);
    }
    if (method === 'GET') return json([]);
    return json({ ok: true });
  });
}
