import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import type { SessionPayload } from '../../auth/session.types';
import type {
  GetApiInvoicesIdDownloadResponseDto,
  PostApiInvoicesResponseDto,
} from './invoice-generation.dto';

const ORDER_STATUS_CONFIRMED = 'confirmed';

@Injectable()
export class InvoiceGenerationService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['Invoice', 'Order', 'Customer', 'VendorProfile'] as const);
  }

  async create(session: SessionPayload, orderId: string, amount: number): Promise<PostApiInvoicesResponseDto> {
    const order = await this.model('Order').findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('order not found');
    if (session.role !== 'ADMIN') {
      const vendor = await this.model('VendorProfile').findUnique({ where: { userId: session.userId } });
      if (!vendor || vendor.id !== order.vendorId) {
        throw new ForbiddenException('order belongs to another vendor');
      }
    }
    if (order.status !== ORDER_STATUS_CONFIRMED) {
      throw new BadRequestException('invoices can only be generated for confirmed orders');
    }
    const existing = await this.model('Invoice').findUnique({ where: { orderId } });
    if (existing) throw new ConflictException('an invoice already exists for this order');
    const invoice = await this.model('Invoice').create({ data: { orderId, amount } });
    return { id: invoice.id, orderId: invoice.orderId, amount: invoice.amount };
  }

  async getDownload(session: SessionPayload, id: string): Promise<GetApiInvoicesIdDownloadResponseDto> {
    const invoice = await this.model('Invoice').findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('invoice not found');
    if (session.role !== 'ADMIN') {
      const order = await this.model('Order').findUnique({ where: { id: invoice.orderId } });
      if (!order) throw new NotFoundException('order not found');
      let allowed = false;
      if (session.role === 'CUSTOMER') {
        const customer = await this.model('Customer').findUnique({ where: { userId: session.userId } });
        allowed = !!customer && customer.id === order.customerId;
      } else if (session.role === 'VENDOR') {
        const vendor = await this.model('VendorProfile').findUnique({ where: { userId: session.userId } });
        allowed = !!vendor && vendor.id === order.vendorId;
      }
      if (!allowed) throw new ForbiddenException('not allowed to download this invoice');
    }
    return { id: invoice.id, downloadUrl: `/api/invoices/${invoice.id}/file` };
  }
}
