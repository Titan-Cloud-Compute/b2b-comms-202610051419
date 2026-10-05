import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { SharedChannelService } from './shared-channel.service';
import type { PostApiChannelsIdMessagesRequestDto, PostApiChannelsRequestDto } from './shared-channel.dto';

@ApiTags('shared-channel')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/channels')
export class SharedChannelController {
  constructor(private readonly sharedchannel: SharedChannelService) {}

  private actor(req: Request) {
    const { userId, role } = req.session!;
    return { userId, role: String(role) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.VENDOR, UserRole.USER, UserRole.MANAGER, UserRole.ADMIN)
  async postApiChannels(@Req() req: Request, @Body() body: PostApiChannelsRequestDto) {
    return this.sharedchannel.createChannel(this.actor(req), body?.name);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.VENDOR, UserRole.CUSTOMER, UserRole.USER, UserRole.MANAGER, UserRole.ADMIN)
  async postApiChannelsIdMessages(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: PostApiChannelsIdMessagesRequestDto,
  ) {
    return this.sharedchannel.postMessage(this.actor(req), id, body?.body);
  }

  @Get()
  @Roles(UserRole.VENDOR, UserRole.CUSTOMER, UserRole.USER, UserRole.MANAGER, UserRole.ADMIN)
  async getApiChannels(@Req() req: Request) {
    return this.sharedchannel.listChannels(this.actor(req));
  }
}
