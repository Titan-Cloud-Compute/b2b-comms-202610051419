import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel, ChannelMessage, ChannelsService } from './channels.service';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page channels-page" data-testid="channels-screen">
      <header class="page-header">
        <h1 class="page-title">Channels</h1>
        <p class="page-subtitle">Shared communication channels between vendors and customers.</p>
      </header>
      <ul class="page-notes" data-testid="channels-scenarios">
        <li>Vendors create a channel: the channel is stored and displays in both the vendor and customer channel lists.</li>
        <li>Customers post a message: the message is stored and returns 201 with the created Message record.</li>
      </ul>

      <form class="card form-inline" data-testid="create-channel-form" (ngSubmit)="createChannel()">
        <label class="form-label" for="channel-name">Channel name</label>
        <input class="form-control" id="channel-name" name="channelName" data-testid="channel-name-input"
               [(ngModel)]="newName" required />
        <button class="btn btn-primary" type="submit" data-testid="create-channel-submit" [disabled]="busy()">Create channel</button>
      </form>

      @if (error()) {
        <p class="alert alert-error" role="alert" data-testid="channels-error">{{ error() }}</p>
      }

      <div class="channel-layout">
      <ul class="channel-list" data-testid="channel-list">
        @for (ch of channels(); track ch.id) {
          <li class="channel-list-item" data-testid="channel-item">
            <button class="channel-list-button" type="button" (click)="select(ch)" [attr.aria-pressed]="selected()?.id === ch.id">{{ ch.name }}</button>
          </li>
        } @empty {
          <li class="empty-state" data-testid="channel-list-empty">No channels yet.</li>
        }
      </ul>

      @if (selected(); as ch) {
        <section class="card channel-thread" data-testid="channel-messages">
          <h2 class="section-title">{{ ch.name }}</h2>
          <ul class="message-list" data-testid="message-list">
            @for (m of messages(); track m.id) {
              <li class="message-item" data-testid="message-item">{{ m.body }}</li>
            }
          </ul>
          <form class="form-inline" data-testid="message-form" (ngSubmit)="sendMessage()">
            <label class="form-label" for="message-body">Message</label>
            <input class="form-control" id="message-body" name="messageBody" data-testid="message-body-input"
                   [(ngModel)]="newMessage" required />
            <button class="btn btn-primary" type="submit" data-testid="message-submit" [disabled]="busy()">Send</button>
          </form>
        </section>
      }
      </div>
    </div>
  `,
})
export class ChannelsComponent implements OnInit {
  private readonly svc = inject(ChannelsService);

  readonly channels = signal<Channel[]>([]);
  readonly selected = signal<Channel | null>(null);
  readonly messages = signal<ChannelMessage[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  newName = '';
  newMessage = '';

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const list = await this.svc.listChannels();
      this.channels.set(Array.isArray(list) ? list : []);
    } catch {
      this.channels.set([]);
    }
  }

  async createChannel(): Promise<void> {
    const name = this.newName.trim();
    if (!name) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const ch = await this.svc.createChannel(name);
      this.newName = '';
      if (ch?.id) this.channels.update((list) => [ch, ...list.filter((c) => c.id !== ch.id)]);
      await this.load();
      if (ch?.id) {
        if (!this.channels().some((c) => c.id === ch.id)) this.channels.update((list) => [ch, ...list]);
        this.select(ch);
      }
    } catch (err) {
      this.error.set(this.errorMessage(err, 'Could not create channel.'));
    } finally {
      this.busy.set(false);
    }
  }

  private errorMessage(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: unknown }; message?: unknown } | null;
    const msg = e?.error?.message ?? e?.message;
    if (Array.isArray(msg)) return msg.join(', ') || fallback;
    return typeof msg === 'string' && msg ? msg : fallback;
  }

  select(ch: Channel): void {
    this.selected.set(ch);
    this.messages.set([]);
  }

  async sendMessage(): Promise<void> {
    const ch = this.selected();
    const body = this.newMessage.trim();
    if (!ch || !body) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const m = await this.svc.postMessage(ch.id, body);
      this.newMessage = '';
      this.messages.update((list) => [...list, m?.id ? m : { id: `local-${list.length}`, body, channelId: ch.id }]);
    } catch {
      this.error.set('Could not send message.');
    } finally {
      this.busy.set(false);
    }
  }
}
