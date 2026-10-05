import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SharedChannelService } from './shared-channel.service';

function makePrisma() {
  const channels: Array<{ id: string; name: string; vendorId: string; vendorProfileId: string; createdAt: Date }> = [];
  const messages: Array<{ id: string; body: string; channelId: string; senderId: string }> = [];
  const profiles = [{ id: 'vp-1', userId: 'vendor-user' }];
  let seq = 0;
  return {
    channels,
    messages,
    vendorProfile: {
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) =>
        profiles.find((p) => p.userId === where.userId) ?? null),
    },
    channel: {
      create: jest.fn(async ({ data }: { data: { name: string; vendorId: string; vendorProfileId: string } }) => {
        const c = { id: `ch-${++seq}`, createdAt: new Date(), ...data };
        channels.push(c);
        return c;
      }),
      findMany: jest.fn(async ({ where }: { where: { vendorProfileId?: string } }) =>
        channels.filter((c) => !where.vendorProfileId || c.vendorProfileId === where.vendorProfileId)),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => channels.find((c) => c.id === where.id) ?? null),
    },
    message: {
      create: jest.fn(async ({ data }: { data: { body: string; channelId: string; senderId: string } }) => {
        const m = { id: `msg-${++seq}`, ...data };
        messages.push(m);
        return m;
      }),
    },
  };
}

describe('SharedChannelService', () => {
  const vendor = { userId: 'vendor-user', role: 'VENDOR' };
  const customer = { userId: 'customer-user', role: 'CUSTOMER' };

  it('vendor creates a channel visible to vendor and customer', async () => {
    const prisma = makePrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new SharedChannelService(prisma as any);
    const created = await svc.createChannel(vendor, 'Ops');
    expect(created).toEqual({ id: expect.any(String), name: 'Ops' });
    expect(prisma.channels[0].vendorId).toBe('vp-1');
    expect(await svc.listChannels(vendor)).toEqual([created]);
    expect(await svc.listChannels(customer)).toEqual([created]);
  });

  it('rejects empty names and non-vendor creators', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new SharedChannelService(makePrisma() as any);
    await expect(svc.createChannel(vendor, '  ')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.createChannel(customer, 'x')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('customer posts a message which is stored and returned', async () => {
    const prisma = makePrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new SharedChannelService(prisma as any);
    const ch = await svc.createChannel(vendor, 'Ops');
    const msg = await svc.postMessage(customer, ch.id, 'hello');
    expect(msg).toEqual({ id: expect.any(String), body: 'hello', channelId: ch.id });
    expect(prisma.messages[0]).toMatchObject({ senderId: 'customer-user', channelId: ch.id });
    await expect(svc.postMessage(customer, 'missing', 'hi')).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.postMessage(customer, ch.id, '')).rejects.toBeInstanceOf(BadRequestException);
  });
});
