/**
 * Token-less self-signup creates a VENDOR user.
 *
 * Verifies that:
 *   1. POST /api/auth/signup without a registrationToken creates a user with
 *      role VENDOR and lower-cased email, and never touches registrationToken.
 *   2. The VENDOR role is assigned even when the user table is empty (count=0),
 *      i.e. there is no "first user becomes ADMIN" bootstrap any more.
 *   3. A password shorter than 8 characters is rejected with BadRequestException.
 */

import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';

function makeService(userCountResult = 1) {
  const userCreate = jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'newuser@example.com',
    role: UserRole.VENDOR,
    passwordHash: 'hashed',
    name: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    firmId: null,
    grantedModelIds: [],
    defaultLlmModelId: null,
  } as unknown as User);

  const userCount = jest.fn().mockResolvedValue(userCountResult);

  const findUnique = jest.fn();
  const update = jest.fn().mockResolvedValue({});
  const updateMany = jest.fn().mockResolvedValue({ count: 0 });

  const tx = {
    user: { count: userCount, create: userCreate },
    registrationToken: { findUnique, update, updateMany },
  };

  const prisma = {
    runAsAdmin: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  } as unknown as ConstructorParameters<typeof AuthService>[0];

  const service = new AuthService(prisma, {} as never, {} as never, {} as never);

  // Prevent real JWT signing and model-grant DB writes
  jest.spyOn(service, 'issueToken').mockResolvedValue('mock-jwt');
  jest.spyOn(service as any, 'applyModelGrant').mockResolvedValue(undefined);

  return { service, userCreate, userCount, findUnique, update, updateMany };
}

describe('AuthService.signup — token-less self-signup creates VENDOR', () => {
  it('creates user with role VENDOR and lower-cased email; never queries registrationToken', async () => {
    const { service, userCreate, findUnique } = makeService();

    const result = await service.signup({
      email: 'NewUser@Example.com',
      password: 'Password1!',
    });

    expect(result).toBeDefined();
    expect(userCreate).toHaveBeenCalledTimes(1);
    const createData = userCreate.mock.calls[0][0].data as { role: string; email: string };
    expect(createData.role).toBe(UserRole.VENDOR);
    expect(createData.email).toBe('newuser@example.com');

    // No token supplied → registration token table must not be touched
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('assigns VENDOR even when the user table is empty (count=0 — no ADMIN bootstrap)', async () => {
    const { service, userCreate } = makeService(0);

    await service.signup({
      email: 'first@example.com',
      password: 'Password1!',
    });

    expect(userCreate).toHaveBeenCalledTimes(1);
    const createData = userCreate.mock.calls[0][0].data as { role: string };
    expect(createData.role).toBe(UserRole.VENDOR);
  });

  it('rejects a 7-character password with BadRequestException', async () => {
    const { service } = makeService();

    await expect(
      service.signup({ email: 'user@example.com', password: 'Short1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
