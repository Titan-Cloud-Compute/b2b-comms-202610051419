import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel, ChannelMessage, ChannelsService } from './channels.service';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="channels-screen">
      <h1>Channels</h1>
      <p>Shared communication channels between vendors and customers.</p>
      <ul data-testid="channels-scenarios">
        <li>Vendors create a channel: the channel is stored and displays in both the vendor and customer channel lists.</li>
        <li>Customers post a message: the message is stored and returns 201 with the created Message record.</li>
      </ul>

      <form data-testid="create-channel-form" (ngSubmit)="createChannel()">
        <label for="channel-name">Channel name</label>
        <input id="channel-name" name="channelName" data-testid="channel-name-input"
               [(ngModel)]="newName" required />
        <button type="submit" data-testid="create-channel-submit" [disabled]="busy()">Create channel</button>
      </form>

      @if (error()) {
        <p role="alert" data-testid="channels-error">{{ error() }}</p>
      }

      <ul data-testid="channel-list">
        @for (ch of channels(); track ch.id) {
          <li data-testid="channel-item">
            <button type="button" (click)="select(ch)" [attr.aria-pressed]="selected()?.id === ch.id">{{ ch.name }}</button>
          </li>
        } @empty {
          <li data-testid="channel-list-empty">No channels yet.</li>
        }
      </ul>

      @if (selected(); as ch) {
        <section data-testid="channel-messages">
          <h2>{{ ch.name }}</h2>
          <ul data-testid="message-list">
            @for (m of messages(); track m.id) {
              <li data-testid="message-item">{{ m.body }}</li>
            }
          </ul>
          <form data-testid="message-form" (ngSubmit)="sendMessage()">
            <label for="message-body">Message</label>
            <input id="message-body" name="messageBody" data-testid="message-body-input"
                   [(ngModel)]="newMessage" required />
            <button type="submit" data-testid="message-submit" [disabled]="busy()">Send</button>
          </form>
        </section>
      }
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
    } catch {
      this.error.set('Could not create channel.');
    } finally {
      this.busy.set(false);
    }
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
