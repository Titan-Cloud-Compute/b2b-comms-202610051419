import { ConflictException } from '@nestjs/common';
import { CustomerInviteController } from './customer-invite.controller';
import { CustomerInviteService } from './customer-invite.service';

function makePrisma() {
  const customers: any[] = [];
  const users: any[] = [];
  let n = 0;
  return {
    customer: {
      findUnique: jest.fn(async ({ where }) => customers.find((c) => c.email === where.email) ?? null),
      create: jest.fn(async ({ data }) => {
        const c = { id: `c${++n}`, createdAt: new Date(), ...data };
        customers.push(c);
        return c;
      }),
      findMany: jest.fn(async () => [...customers]),
    },
    user: {
      findUnique: jest.fn(async ({ where }) => users.find((u) => u.email === where.email) ?? null),
      create: jest.fn(async ({ data }) => {
        const u = { id: `u${++n}`, ...data };
        users.push(u);
        return u;
      }),
    },
  };
}

describe('CustomerInviteController', () => {
  let controller: CustomerInviteController;

  beforeEach(() => {
    const service = new CustomerInviteService(makePrisma() as any);
    controller = new CustomerInviteController(service);
  });

  it('invites a customer and returns invitationSent true', async () => {
    const res = await controller.postApiAdminCustomersInvite({ email: 'Buyer@Corp.example.com' });
    expect(res).toEqual({ customerId: expect.any(String), email: 'buyer@corp.example.com', invitationSent: true });
    const list = await controller.getApiAdminCustomers();
    expect(list).toEqual([{ id: res.customerId, email: 'buyer@corp.example.com' }]);
  });

  it('rejects a duplicate invite with 409', async () => {
    await controller.postApiAdminCustomersInvite({ email: 'dup@corp.example.com' });
    await expect(controller.postApiAdminCustomersInvite({ email: 'dup@corp.example.com' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
