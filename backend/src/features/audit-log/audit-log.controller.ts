import { BadRequestException, Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AuditLogService } from './audit-log.service';
import {
  GetApiAdminAuditLogResponseDto,
  PostApiAdminAuditLogRequestDto,
} from './audit-log.dto';

@ApiTags('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin/audit-log')
export class AuditLogController {
  constructor(private readonly auditlog: AuditLogService) {}

  /** 200 — AuditEntry records in chronological order. */
  @Get()
  async getApiAdminAuditLog(): Promise<GetApiAdminAuditLogResponseDto[]> {
    return this.auditlog.list();
  }

  /** 201 — the stored AuditEntry. */
  @Post()
  @HttpCode(201)
  async postApiAdminAuditLog(
    @Body() body: PostApiAdminAuditLogRequestDto,
  ): Promise<GetApiAdminAuditLogResponseDto> {
    const action = typeof body?.action === 'string' ? body.action.trim() : '';
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    if (!action || !userId) {
      throw new BadRequestException('action and userId are required');
    }
    return this.auditlog.record({ action, userId });
  }
}
