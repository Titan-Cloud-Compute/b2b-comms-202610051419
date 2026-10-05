/**
 * Self-service signup: POST /api/auth/signup is open to anyone — just an email
 * and a password, no registration token required — and new (non-bootstrap)
 * accounts get role VENDOR.
 */

import { AuthService } from './auth.service';
import { SignupSchema } from './signup.schema';

function makeService(existingUsers: number) {
  const create = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({ id: 'u-1', ...data }),
  );
  const count = jest.fn().mockResolvedValue(existingUsers);
  const tokenFindUnique = jest.fn();
  const tokenUpdateMany = jest.fn();
  const tx = {
    user: { count, create },
    registrationToken: {
      findUnique: tokenFindUnique,
      updateMany: tokenUpdateMany,
      update: jest.fn(),
    },
  };
  const prisma = {
    runAsAdmin: (fn: (t: typeof tx) => unknown) => fn(tx),
  } as unknown as ConstructorParameters<typeof AuthService>[0];
  const jwt = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
  const service = new AuthService(prisma, jwt as never, {} as never, {} as never);
  return { service, create, tokenFindUnique, tokenUpdateMany };
}

describe('AuthService.signup — open self-service', () => {
  it('creates a VENDOR account without a registration token', async () => {
    const { service, create, tokenFindUnique, tokenUpdateMany } = makeService(3);
    const { user, token } = await service.signup({
      email: 'NewUser@Example.com',
      password: 'Password1!',
    });

    expect(tokenFindUnique).not.toHaveBeenCalled();
    expect(tokenUpdateMany).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      email: 'newuser@example.com',
      role: 'VENDOR',
    });
    expect(user.role).toBe('VENDOR');
    expect(user.email).toBe('newuser@example.com');
    expect(token).toBe('jwt-token');
  });

  it('still makes the very first (bootstrap) user an ADMIN', async () => {
    const { service, create } = makeService(0);
    const { user } = await service.signup({
      email: 'first@example.com',
      password: 'Password1!',
    });
    expect(create.mock.calls[0][0].data.role).toBe('ADMIN');
    expect(user.role).toBe('ADMIN');
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const { service } = makeService(3);
    await expect(
      service.signup({ email: 'a@example.com', password: 'short' }),
    ).rejects.toThrow();
  });
});

describe('SignupSchema — self-service', () => {
  it('accepts an email + password body with no registration token', () => {
    const parsed = SignupSchema.safeParse({
      email: 'newuser@example.com',
      password: 'Password1!',
    });
    expect(parsed.success).toBe(true);
  });
});
