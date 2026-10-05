import { BadRequestException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PrismaService } from '../../prisma/prisma.service';

type Row = { id: string; userId: string; orderAlerts: boolean; messageAlerts: boolean };

function makePrisma() {
  const rows: Row[] = [];
  let seq = 0;
  return {
    rows,
    notificationPreference: {
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) =>
        rows.find((r) => r.userId === where.userId) ?? null),
      upsert: jest.fn(
        async ({ where, create, update }: {
          where: { userId: string };
          create: Omit<Row, 'id'>;
          update: Partial<Row>;
        }) => {
          const existing = rows.find((r) => r.userId === where.userId);
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const r = { id: `np-${++seq}`, ...create };
          rows.push(r);
          return r;
        },
      ),
    },
  };
}

describe('NotificationPreferences', () => {
  it('is mounted at /api/notifications/preferences', () => {
    expect(Reflect.getMetadata(PATH_METADATA, NotificationPreferencesController)).toBe('api/notifications');
    const proto = NotificationPreferencesController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, proto.getApiNotificationsPreferences)).toBe('preferences');
    expect(Reflect.getMetadata(PATH_METADATA, proto.putApiNotificationsPreferences)).toBe('preferences');
  });

  it('GET returns defaults when nothing is stored', async () => {
    const prisma = makePrisma();
    const svc = new NotificationPreferencesService(prisma as unknown as PrismaService);
    await expect(svc.get('u1')).resolves.toEqual({ userId: 'u1', orderAlerts: true, messageAlerts: true });
  });

  it('PUT stores and returns the NotificationPreference record', async () => {
    const prisma = makePrisma();
    const svc = new NotificationPreferencesService(prisma as unknown as PrismaService);
    await expect(svc.put('u1', { orderAlerts: true, messageAlerts: false })).resolves.toEqual({
      userId: 'u1', orderAlerts: true, messageAlerts: false,
    });
    await expect(svc.get('u1')).resolves.toEqual({ userId: 'u1', orderAlerts: true, messageAlerts: false });
  });

  it('PUT with all alerts false stores both fields as false', async () => {
    const prisma = makePrisma();
    const svc = new NotificationPreferencesService(prisma as unknown as PrismaService);
    await svc.put('u1', { orderAlerts: true, messageAlerts: true });
    await expect(svc.put('u1', { orderAlerts: false, messageAlerts: false })).resolves.toEqual({
      userId: 'u1', orderAlerts: false, messageAlerts: false,
    });
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.rows[0]).toMatchObject({ orderAlerts: false, messageAlerts: false });
  });

  it('PUT rejects non-boolean fields', async () => {
    const prisma = makePrisma();
    const svc = new NotificationPreferencesService(prisma as unknown as PrismaService);
    await expect(svc.put('u1', { orderAlerts: 'yes', messageAlerts: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
