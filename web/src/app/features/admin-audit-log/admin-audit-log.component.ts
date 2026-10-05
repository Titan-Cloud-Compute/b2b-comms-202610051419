import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient } from '../../shared/api/api-client.service';

/** AuditEntry — mirrors the shared data model (id, action, userId, createdAt). */
export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-audit-log',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="admin-audit-log-screen">
      <h1>Audit Log</h1>

      <section>
        <p>When the admin opens the audit log section, a list of AuditEntry records is displayed in chronological order returns 200.</p>
        <p>When the system records an action in the audit log, the AuditEntry is stored and returns 201 with the created record.</p>
      </section>

      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }

      <div data-testid="audit-log-list">
        @if (loading()) {
          <p>Loading entries…</p>
        } @else if (entries().length === 0) {
          <p>No audit entries yet.</p>
        } @else {
          <table>
            <thead>
              <tr><th>Action</th><th>User</th><th>Created</th></tr>
            </thead>
            <tbody>
              @for (e of entries(); track e.id) {
                <tr>
                  <td>{{ e.action }}</td>
                  <td>{{ e.userId }}</td>
                  <td>{{ e.createdAt }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <form data-testid="audit-log-record-form" (ngSubmit)="record()">
        <label>Action <input name="action" [(ngModel)]="action" required /></label>
        <label>User id <input name="userId" [(ngModel)]="userId" required /></label>
        <button type="submit" [disabled]="saving() || !action || !userId">Record entry</button>
      </form>
      @if (lastCreated()) {
        <p>Recorded "{{ lastCreated()!.action }}" at {{ lastCreated()!.createdAt }}.</p>
      }
    </div>
  `,
})
export class AdminAuditLogComponent implements OnInit {
  private readonly api = inject(ApiClient);

  readonly entries = signal<AuditEntry[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastCreated = signal<AuditEntry | null>(null);

  action = '';
  userId = '';

  ngOnInit(): void {
    void this.load();
  }

  private sort(list: AuditEntry[]): AuditEntry[] {
    return [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<AuditEntry[]>('admin/audit-log');
      this.entries.set(this.sort(Array.isArray(res) ? res : []));
    } catch {
      this.error.set('Could not load the audit log.');
    } finally {
      this.loading.set(false);
    }
  }

  async record(): Promise<void> {
    if (!this.action || !this.userId) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const created = await this.api.post<AuditEntry>('admin/audit-log', {
        action: this.action,
        userId: this.userId,
      });
      if (created && created.id) {
        const entry: AuditEntry = { ...created, userId: created.userId ?? this.userId };
        this.entries.set(this.sort([...this.entries(), entry]));
        this.lastCreated.set(entry);
      }
      this.action = '';
      this.userId = '';
    } catch {
      this.error.set('Could not record the audit entry.');
    } finally {
      this.saving.set(false);
    }
  }
}
