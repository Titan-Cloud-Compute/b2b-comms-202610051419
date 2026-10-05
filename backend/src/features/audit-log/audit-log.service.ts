import { Injectable } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiAdminAuditLogResponseDto,
  PostApiAdminAuditLogRequestDto,
} from './audit-log.dto';

@Injectable()
export class AuditLogService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['AuditEntry'] as const);
  }

  /** All audit entries, oldest first (chronological order). */
  async list(): Promise<GetApiAdminAuditLogResponseDto[]> {
    const rows = await this.model('AuditEntry').findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Persist one audit entry and return the created record. */
  async record(input: PostApiAdminAuditLogRequestDto): Promise<GetApiAdminAuditLogResponseDto> {
    const r = await this.model('AuditEntry').create({
      data: { action: input.action, userId: input.userId },
    });
    return {
      id: r.id,
      action: r.action,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
