import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import type { SessionPayload } from '../../auth/session.types';
import type {
  CreateOrderItemDto,
  GetApiOrdersResponseDto,
  PatchApiOrdersIdConfirmResponseDto,
  PostApiOrdersResponseDto,
} from './order-management.dto';

export const ORDER_STATUS_PENDING = 'pending';
export const ORDER_STATUS_CONFIRMED = 'confirmed';

@Injectable()
export class OrderManagementService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['Order', 'OrderItem', 'Customer', 'VendorProfile'] as const);
  }

  private async customerFor(userId: string) {
    const customer = await this.model('Customer').findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('no customer profile for this user');
    return customer;
  }

  private async vendorFor(userId: string) {
    const vendor = await this.model('VendorProfile').findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('no vendor profile for this user');
    return vendor;
  }

  async create(
    session: SessionPayload,
    vendorId: string,
    items: CreateOrderItemDto[],
  ): Promise<PostApiOrdersResponseDto> {
    const customer = await this.customerFor(session.userId);
    const order = await this.model('Order').create({
      data: {
        status: ORDER_STATUS_PENDING,
        customerId: customer.id,
        vendorId,
        orderItems: items.length
          ? { create: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })) }
          : undefined,
      },
    });
    return { id: order.id, status: order.status, customerId: order.customerId };
  }

  async confirm(
    session: SessionPayload,
    id: string,
    estimatedDelivery: string,
  ): Promise<PatchApiOrdersIdConfirmResponseDto> {
    const order = await this.model('Order').findUnique({ where: { id } });
    if (!order) throw new NotFoundException('order not found');
    if (session.role !== 'ADMIN') {
      const vendor = await this.vendorFor(session.userId);
      if (order.vendorId !== vendor.id) throw new ForbiddenException('order belongs to another vendor');
    }
    if (order.status !== ORDER_STATUS_PENDING) {
      throw new BadRequestException(`order is ${order.status}, only pending orders can be confirmed`);
    }
    const updated = await this.model('Order').update({
      where: { id },
      data: { status: ORDER_STATUS_CONFIRMED },
    });
    return { id: updated.id, status: updated.status, estimatedDelivery };
  }

  async list(session: SessionPayload): Promise<GetApiOrdersResponseDto[]> {
    let where: { customerId?: string; vendorId?: string } = {};
    if (session.role === 'CUSTOMER') {
      where = { customerId: (await this.customerFor(session.userId)).id };
    } else if (session.role === 'VENDOR') {
      where = { vendorId: (await this.vendorFor(session.userId)).id };
    }
    const orders = await this.model('Order').findMany({ where, orderBy: { createdAt: 'desc' } });
    return orders.map(o => ({ id: o.id, status: o.status, customerId: o.customerId, vendorId: o.vendorId }));
  }
}
