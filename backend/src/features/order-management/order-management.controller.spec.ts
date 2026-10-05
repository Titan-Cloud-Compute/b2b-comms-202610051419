import 'reflect-metadata';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ROLES_KEY } from '../../auth/roles.guard';
import { OrderManagementController } from './order-management.controller';
import { OrderManagementService } from './order-management.service';

type OrderRow = { id: string; status: string; customerId: string; vendorId: string; createdAt: Date };

function makePrisma() {
  const orders: OrderRow[] = [];
  let seq = 0;
  return {
    orders,
    customer: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        where.userId === 'cust-user' ? { id: 'cust-1', userId: 'cust-user' } : null,
    },
    vendorProfile: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        where.userId === 'vendor-user' ? { id: 'vendor-1', userId: 'vendor-user' } : null,
    },
    order: {
      create: async ({ data }: { data: Omit<OrderRow, 'id' | 'createdAt'> }) => {
        const row: OrderRow = {
          id: `order-${++seq}`,
          status: data.status,
          customerId: data.customerId,
          vendorId: data.vendorId,
          createdAt: new Date(),
        };
        orders.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { id: string } }) => orders.find(o => o.id === where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Partial<OrderRow> }) => {
        const row = orders.find(o => o.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
      findMany: async ({ where }: { where: Partial<OrderRow> }) =>
        orders.filter(o =>
          (!where.customerId || o.customerId === where.customerId) &&
          (!where.vendorId || o.vendorId === where.vendorId)),
    },
  };
}

const customerReq = { session: { userId: 'cust-user', role: 'CUSTOMER', firmId: null } } as never;
const vendorReq = { session: { userId: 'vendor-user', role: 'VENDOR', firmId: null } } as never;

describe('OrderManagementController', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let controller: OrderManagementController;

  beforeEach(() => {
    prisma = makePrisma();
    controller = new OrderManagementController(new OrderManagementService(prisma as never));
  });

  it('is mounted at api/orders', () => {
    expect(Reflect.getMetadata('path', OrderManagementController)).toBe('api/orders');
  });

  it('customer creates order → stored as pending with 201', async () => {
    const res = await controller.postApiOrders(customerReq, {
      vendorId: 'vendor-1',
      items: [{ description: 'Widgets', quantity: 3, unitPrice: 9.5 }],
    });
    expect(res).toEqual({ id: 'order-1', status: 'pending', customerId: 'cust-1' });
    expect(prisma.orders[0].status).toBe('pending');
    expect(Reflect.getMetadata('__httpCode__', OrderManagementController.prototype.postApiOrders)).toBe(201);
  });

  it('rejects create without vendorId', async () => {
    await expect(controller.postApiOrders(customerReq, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('vendor confirms a pending order → confirmed and visible to the customer', async () => {
    const created = await controller.postApiOrders(customerReq, { vendorId: 'vendor-1' });
    const res = await controller.patchApiOrdersIdConfirm(vendorReq, created.id, { estimatedDelivery: '2026-11-01' });
    expect(res).toMatchObject({ id: created.id, status: 'confirmed' });
    const list = await controller.getApiOrders(customerReq);
    expect(list).toEqual([expect.objectContaining({ id: created.id, status: 'confirmed' })]);
  });

  it('rejects confirm without a valid estimatedDelivery', async () => {
    const created = await controller.postApiOrders(customerReq, { vendorId: 'vendor-1' });
    await expect(
      controller.patchApiOrdersIdConfirm(vendorReq, created.id, { estimatedDelivery: 'nope' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("vendor cannot confirm another vendor's order", async () => {
    const created = await controller.postApiOrders(customerReq, { vendorId: 'vendor-2' });
    await expect(
      controller.patchApiOrdersIdConfirm(vendorReq, created.id, { estimatedDelivery: '2026-11-01' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('applies role checks per endpoint', () => {
    const roles = (fn: unknown) => Reflect.getMetadata(ROLES_KEY, fn as object);
    expect(roles(OrderManagementController.prototype.postApiOrders)).toEqual(['CUSTOMER']);
    expect(roles(OrderManagementController.prototype.patchApiOrdersIdConfirm)).toEqual(['VENDOR', 'ADMIN']);
    expect(roles(OrderManagementController.prototype.getApiOrders)).toEqual(['CUSTOMER', 'VENDOR', 'ADMIN']);
  });
});
