import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
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
import type { CreateOrderItemDto } from './order-management.dto';
import { OrderManagementService } from './order-management.service';

function sessionOf(req: Request): SessionPayload {
  if (!req.session) throw new UnauthorizedException('not authenticated');
  return req.session;
}

function parseItems(raw: unknown): CreateOrderItemDto[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new BadRequestException('items must be an array');
  return raw.map((r, idx) => {
    const item = (r ?? {}) as Record<string, unknown>;
    const description = typeof item.description === 'string' ? item.description.trim() : '';
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (!description) throw new BadRequestException(`items[${idx}].description is required`);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException(`items[${idx}].quantity must be a positive integer`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new BadRequestException(`items[${idx}].unitPrice must be a non-negative number`);
    }
    return { description, quantity, unitPrice };
  });
}

@ApiTags('order-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/orders')
export class OrderManagementController {
  constructor(private readonly ordermanagement: OrderManagementService) {}

  @Post()
  @HttpCode(201)
  @Roles(UserRole.CUSTOMER)
  async postApiOrders(@Req() req: Request, @Body() body: unknown) {
    const b = (body ?? {}) as Record<string, unknown>;
    const vendorId = typeof b.vendorId === 'string' ? b.vendorId.trim() : '';
    if (!vendorId) throw new BadRequestException('vendorId is required');
    return this.ordermanagement.create(sessionOf(req), vendorId, parseItems(b.items));
  }

  @Patch(':id/confirm')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async patchApiOrdersIdConfirm(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const b = (body ?? {}) as Record<string, unknown>;
    const estimatedDelivery = typeof b.estimatedDelivery === 'string' ? b.estimatedDelivery.trim() : '';
    if (!estimatedDelivery || Number.isNaN(Date.parse(estimatedDelivery))) {
      throw new BadRequestException('estimatedDelivery must be a valid date');
    }
    return this.ordermanagement.confirm(sessionOf(req), id, estimatedDelivery);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  async getApiOrders(@Req() req: Request) {
    return this.ordermanagement.list(sessionOf(req));
  }
}
