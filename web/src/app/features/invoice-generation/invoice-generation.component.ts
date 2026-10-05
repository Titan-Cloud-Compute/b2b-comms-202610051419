import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient, NotFoundError } from '../../shared/api/api-client';

/** POST /api/invoices request/response and GET /api/invoices/:id/download response. */
export interface CreateInvoiceRequest {
  orderId: string;
  amount: number;
}
export interface InvoiceResponse {
  id: string;
  orderId: string;
  amount: number;
}
export interface InvoiceDownloadResponse {
  id: string;
  downloadUrl: string;
}

@Component({
  selector: 'app-invoice-generation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page invoice-viewer-page" data-testid="invoices-screen">
      <h1 class="page-title">Invoices</h1>

      <section class="card">
        <h2 class="section-title">Generate invoice</h2>
        <p>Vendors generate an invoice for a confirmed order: the invoice is created and returns 201 with the invoice id available for download.</p>
        <form class="form-stack" data-testid="invoice-generate-form" (ngSubmit)="generate()">
          <label class="form-label" for="invoice-order-id">Order id</label>
          <input class="form-control" id="invoice-order-id" data-testid="invoice-order-id" name="orderId" [(ngModel)]="orderId" required />
          <label class="form-label" for="invoice-amount">Amount</label>
          <input class="form-control" id="invoice-amount" data-testid="invoice-amount" type="number" step="0.01" name="amount" [(ngModel)]="amount" required />
          <button class="btn btn-primary" type="submit" data-testid="invoice-generate-submit" [disabled]="busy">Generate invoice</button>
        </form>
      </section>

      <section class="card">
        <h2 class="section-title">Download invoice</h2>
        <p>Customers request the download link for an invoice: the response returns 200 with a downloadUrl pointing to the stored invoice.</p>
        <form class="form-stack" data-testid="invoice-download-form" (ngSubmit)="download()">
          <label class="form-label" for="invoice-id">Invoice id</label>
          <input class="form-control" id="invoice-id" data-testid="invoice-id" name="invoiceId" [(ngModel)]="invoiceId" required />
          <button class="btn btn-primary" type="submit" data-testid="invoice-download-submit" [disabled]="busy">Get download link</button>
        </form>
        @if (downloadUrl) {
          <p data-testid="invoice-download-link">
            <a [href]="downloadUrl" target="_blank" rel="noopener">Download invoice</a>
          </p>
        }
      </section>

      @if (message) {
        <p data-testid="invoice-message" role="status">{{ message }}</p>
      }
      @if (error) {
        <p data-testid="invoice-error" role="alert">{{ error }}</p>
      }

      <h2 class="section-title">Generated invoices</h2>
      <ul class="data-table invoice-viewer" data-testid="invoice-list">
        @for (inv of invoices; track inv.id) {
          <li>{{ inv.id }} — order {{ inv.orderId }} — {{ inv.amount }}</li>
        } @empty {
          <li>No invoices generated yet.</li>
        }
      </ul>
    </div>
  `,
})
export class InvoiceGenerationComponent {
  private readonly api = inject(ApiClient);

  orderId = '';
  amount: number | null = null;
  invoiceId = '';
  downloadUrl = '';
  busy = false;
  message = '';
  error = '';
  invoices: InvoiceResponse[] = [];

  constructor() {
    if (this.api instanceof MockApiClient) {
      const mock = this.api;
      const store = new Map<string, InvoiceResponse>();
      mock.registerMock<InvoiceResponse>('POST', '/api/invoices', async (body: any) => {
        const inv: InvoiceResponse = {
          id: crypto.randomUUID(),
          orderId: String(body?.orderId ?? ''),
          amount: Number(body?.amount ?? 0),
        };
        store.set(inv.id, inv);
        mock.registerMock<InvoiceDownloadResponse>('GET', `/api/invoices/${inv.id}/download`, async () => ({
          id: inv.id,
          downloadUrl: `/mock-storage/invoices/${inv.id}.pdf`,
        }));
        return inv;
      });
    }
  }

  async generate(): Promise<void> {
    this.reset();
    const orderId = this.orderId.trim();
    if (!orderId || this.amount === null || isNaN(Number(this.amount))) {
      this.error = 'Order id and amount are required.';
      return;
    }
    this.busy = true;
    try {
      const req: CreateInvoiceRequest = { orderId, amount: Number(this.amount) };
      const inv = await this.api.post<InvoiceResponse>('/api/invoices', req);
      this.invoices = [...this.invoices, inv];
      this.invoiceId = inv.id;
      this.message = `Invoice ${inv.id} created and available for download.`;
    } catch (e: any) {
      this.error = e?.message || 'Failed to generate invoice.';
    } finally {
      this.busy = false;
    }
  }

  async download(): Promise<void> {
    this.reset();
    const id = this.invoiceId.trim();
    if (!id) {
      this.error = 'Invoice id is required.';
      return;
    }
    this.busy = true;
    try {
      const res = await this.api.get<InvoiceDownloadResponse>(`/api/invoices/${encodeURIComponent(id)}/download`);
      this.downloadUrl = res.downloadUrl;
      this.message = `Download link ready for invoice ${res.id}.`;
    } catch (e: any) {
      this.error = e instanceof NotFoundError ? 'Invoice not found.' : e?.message || 'Failed to get download link.';
    } finally {
      this.busy = false;
    }
  }

  private reset(): void {
    this.message = '';
    this.error = '';
    this.downloadUrl = '';
  }
}
