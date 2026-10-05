import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  GetApiChannelsResponseDto,
  PostApiChannelsIdMessagesResponseDto,
  PostApiChannelsResponseDto,
} from './shared-channel.dto';

export interface ChannelActor {
  userId: string;
  role: string;
}

@Injectable()
export class SharedChannelService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['Channel', 'Message', 'VendorProfile', 'User'] as const);
  }

  /** Roles that own channels (vendor side). CUSTOMER is the only non-owner role. */
  private isOwnerRole(role: string): boolean {
    return role !== 'CUSTOMER';
  }

  /** Get the caller's VendorProfile, creating one from the user's email if missing. */
  private async getOrCreateProfile(userId: string) {
    const existing = await this.model('VendorProfile').findUnique({ where: { userId } });
    if (existing) return existing;
    const user = await this.model('User').findUnique({ where: { id: userId } });
    if (!user) return null;
    return this.model('VendorProfile').upsert({
      where: { userId },
      update: {},
      create: { userId, companyName: user.email, contactEmail: user.email },
    });
  }

  async createChannel(actor: ChannelActor, name: unknown): Promise<PostApiChannelsResponseDto> {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) throw new BadRequestException('name is required');
    if (!this.isOwnerRole(actor.role)) throw new ForbiddenException('only vendors can create channels');
    const profile = await this.getOrCreateProfile(actor.userId);
    if (!profile) throw new ForbiddenException('vendor profile required to create a channel');
    const channel = await this.model('Channel').create({
      data: { name: trimmed, vendorId: profile.id, vendorProfileId: profile.id },
    });
    return { id: channel.id, name: channel.name };
  }

  async listChannels(actor: ChannelActor): Promise<GetApiChannelsResponseDto[]> {
    let where = {};
    if (actor.role === 'VENDOR') {
      const profile = await this.getOrCreateProfile(actor.userId);
      if (!profile) return [];
      where = { vendorProfileId: profile.id };
    }
    const channels = await this.model('Channel').findMany({ where, orderBy: { createdAt: 'desc' } });
    return channels.map((c) => ({ id: c.id, name: c.name }));
  }

  async postMessage(
    actor: ChannelActor,
    channelId: string,
    body: unknown,
  ): Promise<PostApiChannelsIdMessagesResponseDto> {
    const text = typeof body === 'string' ? body.trim() : '';
    if (!text) throw new BadRequestException('body is required');
    const channel = await this.model('Channel').findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('channel not found');
    if (actor.role === 'VENDOR') {
      const profile = await this.getOrCreateProfile(actor.userId);
      if (!profile || profile.id !== channel.vendorProfileId) {
        throw new ForbiddenException('not a member of this channel');
      }
    }
    const message = await this.model('Message').create({
      data: { body: text, channelId: channel.id, senderId: actor.userId },
    });
    return { id: message.id, body: message.body, channelId: message.channelId };
  }
}
