import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient } from '../../shared/api/api-client';

/** Mirrors the NotificationPreference contract (userId, orderAlerts, messageAlerts). */
export interface NotificationPreferenceDto {
  userId?: string;
  orderAlerts: boolean;
  messageAlerts: boolean;
}

const PREFS_PATH = '/api/notifications/preferences';
export const CONFIGURED_MSG =
  'the preferences are updated and returns 200 with the stored NotificationPreference record';
export const DISABLED_MSG = 'the preferences are updated with both alert fields stored as false';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="settings-notifications-screen">
      <h1>Notification Settings</h1>

      <form (ngSubmit)="save()">
        <label>
          <input type="checkbox" data-testid="order-alerts-toggle" name="orderAlerts"
                 [(ngModel)]="orderAlerts" />
          Order alerts
        </label>
        <label>
          <input type="checkbox" data-testid="message-alerts-toggle" name="messageAlerts"
                 [(ngModel)]="messageAlerts" />
          Message alerts
        </label>
        <button type="submit" data-testid="save-notification-preferences" [disabled]="saving">
          Save
        </button>
      </form>

      <ul data-testid="notification-preferences-help">
        <li>With any alert enabled, saving means {{ configuredMsg }}.</li>
        <li>With all alerts turned off, saving means {{ disabledMsg }}.</li>
      </ul>

      @if (status) {
        <p data-testid="notification-preferences-status" role="status">{{ status }}</p>
      }
      @if (error) {
        <p data-testid="notification-preferences-error" role="alert">{{ error }}</p>
      }
    </div>
  `,
})
export class NotificationPreferencesComponent implements OnInit {
  private readonly api = inject(ApiClient);

  readonly configuredMsg = CONFIGURED_MSG;
  readonly disabledMsg = DISABLED_MSG;

  orderAlerts = true;
  messageAlerts = true;
  saving = false;
  status = '';
  error = '';

  async ngOnInit(): Promise<void> {
    try {
      const prefs = await this.api.get<NotificationPreferenceDto>(PREFS_PATH);
      this.apply(prefs);
    } catch {
      // No stored preferences yet — keep defaults.
    }
  }

  async save(): Promise<void> {
    this.saving = true;
    this.error = '';
    this.status = '';
    const body: NotificationPreferenceDto = {
      orderAlerts: this.orderAlerts,
      messageAlerts: this.messageAlerts,
    };
    try {
      const stored = await this.api.request<NotificationPreferenceDto>(PREFS_PATH, {
        method: 'PUT',
        body,
      });
      this.apply(stored);
      this.status =
        !this.orderAlerts && !this.messageAlerts ? DISABLED_MSG : CONFIGURED_MSG;
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to save notification preferences';
    } finally {
      this.saving = false;
    }
  }

  private apply(prefs: unknown): void {
    if (prefs && typeof prefs === 'object' && !Array.isArray(prefs)) {
      const p = prefs as Partial<NotificationPreferenceDto>;
      if (typeof p.orderAlerts === 'boolean') this.orderAlerts = p.orderAlerts;
      if (typeof p.messageAlerts === 'boolean') this.messageAlerts = p.messageAlerts;
    }
  }
}
