import { Body, Controller, Get, HttpCode, HttpStatus, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { SessionPayload } from '../../auth/session.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PutApiNotificationsPreferencesRequestDto } from './notification-preferences.dto';

// Minimal request shape (JwtAuthGuard populates req.session); avoids a hard
// dependency on express type declarations.
interface SessionRequest {
  session?: SessionPayload;
}

@ApiTags('notification-preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VENDOR, UserRole.CUSTOMER)
@Controller('api/notifications')
export class NotificationPreferencesController {
  constructor(private readonly notificationpreferences: NotificationPreferencesService) {}

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async putApiNotificationsPreferences(
    @Req() req: SessionRequest,
    @Body() body: PutApiNotificationsPreferencesRequestDto,
  ) {
    return this.notificationpreferences.put(req.session?.userId ?? '', body);
  }

  @Get('preferences')
  async getApiNotificationsPreferences(@Req() req: SessionRequest) {
    return this.notificationpreferences.get(req.session?.userId ?? '');
  }
}
