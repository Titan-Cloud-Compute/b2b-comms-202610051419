import { Injectable, inject } from '@angular/core';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

export interface Channel {
  id: string;
  name: string;
}

export interface ChannelMessage {
  id: string;
  body: string;
  channelId: string;
}

/** Shared-channel API: GET/POST /api/channels and POST /api/channels/:id/messages. */
@Injectable({ providedIn: 'root' })
export class ChannelsService {
  private readonly api = inject(ApiClient);

  constructor() {
    if (this.api instanceof MockApiClient) this.registerMocks(this.api);
  }

  listChannels(): Promise<Channel[]> {
    return this.api.get<Channel[]>('/api/channels');
  }

  createChannel(name: string): Promise<Channel> {
    return this.api.post<Channel>('/api/channels', { name });
  }

  postMessage(channelId: string, body: string): Promise<ChannelMessage> {
    return this.api.post<ChannelMessage>(`/api/channels/${encodeURIComponent(channelId)}/messages`, { body });
  }

  /** In-memory mocks for USE_MOCKS mode. Message route is registered per channel on create. */
  private registerMocks(mock: MockApiClient): void {
    const channels: Channel[] = [];
    let seq = 0;
    const nextId = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
    const registerMessages = (channelId: string) =>
      mock.registerMock('POST', `/api/channels/${encodeURIComponent(channelId)}/messages`, async (b) => ({
        id: nextId(),
        body: String((b as { body?: string })?.body ?? ''),
        channelId,
      }));
    mock.registerMock('GET', '/api/channels', async () => [...channels]);
    mock.registerMock('POST', '/api/channels', async (b) => {
      const ch = { id: nextId(), name: String((b as { name?: string })?.name ?? '') };
      channels.unshift(ch);
      registerMessages(ch.id);
      return ch;
    });
  }
}
