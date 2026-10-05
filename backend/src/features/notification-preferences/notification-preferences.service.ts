import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiNotificationsPreferencesResponseDto,
  PutApiNotificationsPreferencesResponseDto,
} from './notification-preferences.dto';

@Injectable()
export class NotificationPreferencesService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['NotificationPreference'] as const);
  }

  async get(userId: string): Promise<GetApiNotificationsPreferencesResponseDto> {
    if (!userId) throw new UnauthorizedException('not authenticated');
    const row = await this.model('NotificationPreference').findUnique({ where: { userId } });
    if (!row) return { userId, orderAlerts: true, messageAlerts: true };
    return { userId: row.userId, orderAlerts: row.orderAlerts, messageAlerts: row.messageAlerts };
  }

  async put(userId: string, body: unknown): Promise<PutApiNotificationsPreferencesResponseDto> {
    if (!userId) throw new UnauthorizedException('not authenticated');
    const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const { orderAlerts, messageAlerts } = b;
    if (typeof orderAlerts !== 'boolean' || typeof messageAlerts !== 'boolean') {
      throw new BadRequestException('orderAlerts and messageAlerts must be booleans');
    }
    const row = await this.model('NotificationPreference').upsert({
      where: { userId },
      create: { userId, orderAlerts, messageAlerts },
      update: { orderAlerts, messageAlerts },
    });
    return { userId: row.userId, orderAlerts: row.orderAlerts, messageAlerts: row.messageAlerts };
  }
}
