import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import type { SessionPayload } from '../../auth/session.types';
import { InvoiceGenerationService } from './invoice-generation.service';

function sessionOf(req: Request): SessionPayload {
  if (!req.session) throw new UnauthorizedException('not authenticated');
  return req.session;
}

@ApiTags('invoice-generation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/invoices')
export class InvoiceGenerationController {
  constructor(private readonly invoicegeneration: InvoiceGenerationService) {}

  @Post()
  @HttpCode(201)
  @Roles(UserRole.VENDOR)
  async postApiInvoices(@Req() req: Request, @Body() body: unknown) {
    const b = (body ?? {}) as Record<string, unknown>;
    const orderId = typeof b.orderId === 'string' ? b.orderId.trim() : '';
    if (!orderId) throw new BadRequestException('orderId is required');
    const amount = typeof b.amount === 'string' && b.amount.trim() !== '' ? Number(b.amount) : b.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('amount must be a non-negative number');
    }
    return this.invoicegeneration.create(sessionOf(req), orderId, amount);
  }

  @Get(':id/download')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  async getApiInvoicesIdDownload(@Req() req: Request, @Param('id') id: string) {
    return this.invoicegeneration.getDownload(sessionOf(req), id);
  }
}
