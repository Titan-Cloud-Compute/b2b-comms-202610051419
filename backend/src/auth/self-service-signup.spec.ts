/**
 * Self-service signup: anyone can create an account with just an email and a
 * password — no registration token. New (non-bootstrap) accounts get the
 * VENDOR role.
 */

import { AuthService } from './auth.service';
import { SignupSchema } from './signup.schema';

function makeService(existingUsers: number) {
  const create = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({ id: 'u-1', ...data }),
  );
  const count = jest.fn().mockResolvedValue(existingUsers);
  const tokenFindUnique = jest.fn();
  const tx = {
    user: { count, create },
    registrationToken: { findUnique: tokenFindUnique },
  };
  const prisma = {
    runAsAdmin: (fn: (t: typeof tx) => unknown) => fn(tx),
  } as unknown as ConstructorParameters<typeof AuthService>[0];
  const jwt = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
  const service = new AuthService(prisma, jwt as never, {} as never, {} as never);
  return { service, create, tokenFindUnique };
}

describe('Self-service signup', () => {
  it('accepts an email + password body with no registration token', () => {
    const parsed = SignupSchema.safeParse({
      email: 'newuser@example.com',
      password: 'Password1!',
    });
    expect(parsed.success).toBe(true);
  });

  it('creates a VENDOR account when no registration token is supplied', async () => {
    const { service, create, tokenFindUnique } = makeService(3);

    const { user, token } = await service.signup({
      email: 'NewUser@Example.com',
      password: 'Password1!',
    });

    expect(tokenFindUnique).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      email: 'newuser@example.com',
      role: 'VENDOR',
    });
    expect(user.role).toBe('VENDOR');
    expect(token).toBe('jwt-token');
  });

  it('still makes the very first (bootstrap) user an ADMIN', async () => {
    const { service, create } = makeService(0);

    await service.signup({ email: 'first@example.com', password: 'Password1!' });

    expect(create.mock.calls[0][0].data.role).toBe('ADMIN');
  });
});
