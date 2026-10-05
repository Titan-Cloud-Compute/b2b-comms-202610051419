import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, ConflictError, MockApiClient } from '../../shared/api/api-client';

interface CustomerListItem {
  id: string;
  email: string;
}

interface InviteResponse {
  customerId: string;
  email: string;
  invitationSent: boolean;
}

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page admin-customers-page" data-testid="admin-customers-screen">
      <h1 class="page-title">Customer Management</h1>
      <p>Invite a customer by email. On success, a Customer record is created and returns 201 with invitationSent true.
        Inviting an email that is already registered is rejected: the response returns 409 error indicating the customer already exists.</p>

      <form class="form-stack" data-testid="customer-invite-form" (ngSubmit)="invite()">
        <label class="form-label" for="invite-email">Customer email</label>
        <input class="form-control" id="invite-email" data-testid="customer-invite-email" type="email" name="email"
               [(ngModel)]="email" required />
        <button class="btn btn-primary" type="submit" data-testid="customer-invite-submit" [disabled]="busy">Invite</button>
      </form>

      @if (message) {
        <p data-testid="customer-invite-message" role="status">{{ message }}</p>
      }
      @if (error) {
        <p data-testid="customer-invite-error" role="alert">{{ error }}</p>
      }

      <h2 class="section-title">Customers</h2>
      <ul data-testid="customer-list">
        @for (c of customers; track c.id) {
          <li>{{ c.email }}</li>
        } @empty {
          <li>No customers yet.</li>
        }
      </ul>
    </div>
  `,
})
export class AdminCustomersComponent implements OnInit {
  private readonly api = inject(ApiClient);

  email = '';
  busy = false;
  message = '';
  error = '';
  customers: CustomerListItem[] = [];

  constructor() {
    if (this.api instanceof MockApiClient) {
      const store: CustomerListItem[] = [];
      this.api.registerMock('GET', '/api/admin/customers', async () => [...store]);
      this.api.registerMock('POST', '/api/admin/customers/invite', async (body: any) => {
        const email = String(body?.email ?? '').trim().toLowerCase();
        if (store.some((c) => c.email === email)) {
          throw new ConflictError('Customer already exists');
        }
        const item = { id: crypto.randomUUID(), email };
        store.push(item);
        return { customerId: item.id, email, invitationSent: true } as InviteResponse;
      });
    }
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.customers = await this.api.get<CustomerListItem[]>('/api/admin/customers');
    } catch {
      this.customers = [];
    }
  }

  async invite(): Promise<void> {
    const email = this.email.trim();
    if (!email) return;
    this.busy = true;
    this.message = '';
    this.error = '';
    try {
      const res = await this.api.post<InviteResponse>('/api/admin/customers/invite', { email });
      if (res.invitationSent) {
        this.message = `Invitation sent to ${res.email}.`;
      }
      this.email = '';
      await this.load();
    } catch (e) {
      this.error = e instanceof ConflictError ? 'Customer already exists.' : 'Could not send the invitation.';
    } finally {
      this.busy = false;
    }
  }
}
