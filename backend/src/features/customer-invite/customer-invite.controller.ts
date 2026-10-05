import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { CustomerInviteService } from './customer-invite.service';
import { PostApiAdminCustomersInviteRequestDto } from './customer-invite.dto';

@ApiTags('customer-invite')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin/customers')
export class CustomerInviteController {
  constructor(private readonly customerinvite: CustomerInviteService) {}

  @Post('invite')
  @HttpCode(201)
  async postApiAdminCustomersInvite(@Body() body: PostApiAdminCustomersInviteRequestDto) {
    return this.customerinvite.invite(body?.email);
  }

  @Get()
  async getApiAdminCustomers() {
    return this.customerinvite.list();
  }
}
