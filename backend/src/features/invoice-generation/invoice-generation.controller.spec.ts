import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLES_KEY } from '../../auth/roles.guard';
import { InvoiceGenerationController } from './invoice-generation.controller';
import { InvoiceGenerationService } from './invoice-generation.service';

type OrderRow = { id: string; status: string; customerId: string; vendorId: string };
type InvoiceRow = { id: string; orderId: string; amount: number };

function makePrisma() {
  const orders: OrderRow[] = [
    { id: 'order-confirmed', status: 'confirmed', customerId: 'cust-1', vendorId: 'vendor-1' },
    { id: 'order-pending', status: 'pending', customerId: 'cust-1', vendorId: 'vendor-1' },
  ];
  const invoices: InvoiceRow[] = [];
  let seq = 0;
  return {
    invoices,
    customer: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        where.userId === 'cust-user' ? { id: 'cust-1', userId: 'cust-user' } : null,
    },
    vendorProfile: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        where.userId === 'vendor-user' ? { id: 'vendor-1', userId: 'vendor-user' } : null,
    },
    order: {
      findUnique: async ({ where }: { where: { id: string } }) => orders.find(o => o.id === where.id) ?? null,
    },
    invoice: {
      findUnique: async ({ where }: { where: { id?: string; orderId?: string } }) =>
        invoices.find(i => (where.id ? i.id === where.id : i.orderId === where.orderId)) ?? null,
      create: async ({ data }: { data: { orderId: string; amount: number } }) => {
        const row = { id: `inv-${++seq}`, orderId: data.orderId, amount: data.amount };
        invoices.push(row);
        return row;
      },
    },
  };
}

const customerReq = { session: { userId: 'cust-user', role: 'CUSTOMER', firmId: null } } as never;
const otherCustomerReq = { session: { userId: 'other', role: 'CUSTOMER', firmId: null } } as never;
const vendorReq = { session: { userId: 'vendor-user', role: 'VENDOR', firmId: null } } as never;

describe('InvoiceGenerationController', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let controller: InvoiceGenerationController;

  beforeEach(() => {
    prisma = makePrisma();
    controller = new InvoiceGenerationController(new InvoiceGenerationService(prisma as never));
  });

  it('is mounted at api/invoices', () => {
    expect(Reflect.getMetadata('path', InvoiceGenerationController)).toBe('api/invoices');
    expect(Reflect.getMetadata('path', InvoiceGenerationController.prototype.postApiInvoices)).toBe('/');
    expect(Reflect.getMetadata('path', InvoiceGenerationController.prototype.getApiInvoicesIdDownload)).toBe(
      ':id/download',
    );
  });

  it('restricts POST to vendors and allows customers to download', () => {
    expect(Reflect.getMetadata(ROLES_KEY, InvoiceGenerationController.prototype.postApiInvoices)).toEqual(['VENDOR']);
    expect(Reflect.getMetadata(ROLES_KEY, InvoiceGenerationController.prototype.getApiInvoicesIdDownload)).toEqual(
      expect.arrayContaining(['CUSTOMER', 'VENDOR', 'ADMIN']),
    );
    expect(Reflect.getMetadata('__httpCode__', InvoiceGenerationController.prototype.postApiInvoices)).toBe(201);
  });

  it('vendor generates an invoice for a confirmed order and customer downloads it', async () => {
    const created = await controller.postApiInvoices(vendorReq, { orderId: 'order-confirmed', amount: 125.5 });
    expect(created).toEqual({ id: expect.any(String), orderId: 'order-confirmed', amount: 125.5 });
    expect(prisma.invoices).toHaveLength(1);

    const dl = await controller.getApiInvoicesIdDownload(customerReq, created.id);
    expect(dl.id).toBe(created.id);
    expect(dl.downloadUrl).toContain(created.id);
  });

  it('validates the body', async () => {
    await expect(controller.postApiInvoices(vendorReq, { amount: 1 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.postApiInvoices(vendorReq, { orderId: 'order-confirmed', amount: -1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects unconfirmed, missing and duplicate orders', async () => {
    await expect(controller.postApiInvoices(vendorReq, { orderId: 'order-pending', amount: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(controller.postApiInvoices(vendorReq, { orderId: 'nope', amount: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await controller.postApiInvoices(vendorReq, { orderId: 'order-confirmed', amount: 1 });
    await expect(controller.postApiInvoices(vendorReq, { orderId: 'order-confirmed', amount: 1 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('404s on unknown invoice and 403s for an unrelated customer', async () => {
    await expect(controller.getApiInvoicesIdDownload(customerReq, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    const created = await controller.postApiInvoices(vendorReq, { orderId: 'order-confirmed', amount: 1 });
    await expect(controller.getApiInvoicesIdDownload(otherCustomerReq, created.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
