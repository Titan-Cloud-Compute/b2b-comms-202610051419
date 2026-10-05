import { BadRequestException, HttpStatus } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

describe('AuditLogController', () => {
  const entries = [
    { id: 'a', action: 'login', userId: 'u1', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'b', action: 'logout', userId: 'u1', createdAt: '2026-01-02T00:00:00.000Z' },
  ];
  let service: { list: jest.Mock; record: jest.Mock };
  let controller: AuditLogController;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue(entries),
      record: jest.fn().mockImplementation(async (i: { action: string; userId: string }) => ({
        id: 'c',
        ...i,
        createdAt: '2026-01-03T00:00:00.000Z',
      })),
    };
    controller = new AuditLogController(service as unknown as AuditLogService);
  });

  it('is mounted at api/admin/audit-log', () => {
    expect(Reflect.getMetadata('path', AuditLogController)).toBe('api/admin/audit-log');
  });

  it('GET returns entries in chronological order', async () => {
    await expect(controller.getApiAdminAuditLog()).resolves.toEqual(entries);
  });

  it('POST stores the entry and responds 201 with the created record', async () => {
    const created = await controller.postApiAdminAuditLog({ action: 'export', userId: 'u2' });
    expect(service.record).toHaveBeenCalledWith({ action: 'export', userId: 'u2' });
    expect(created).toMatchObject({ id: 'c', action: 'export', createdAt: expect.any(String) });
    expect(
      Reflect.getMetadata('__httpCode__', AuditLogController.prototype.postApiAdminAuditLog),
    ).toBe(HttpStatus.CREATED);
  });

  it('POST rejects a missing action', async () => {
    await expect(
      controller.postApiAdminAuditLog({ action: '', userId: 'u2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
