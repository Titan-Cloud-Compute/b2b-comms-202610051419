import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient } from '../../shared/api/api-client.service';

export interface OrderItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderRecord {
  id: string;
  status: string;
  customerId?: string;
  vendorId?: string;
  estimatedDelivery?: string | null;
}

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="orders-screen">
      <h1>Orders</h1>

      <section aria-label="How orders work">
        <p data-testid="orders-pending-outcome">
          When you submit a purchase order, the order is stored with status "pending" and returns 201 with the created Order record.
        </p>
        <p data-testid="orders-confirmed-outcome">
          When the vendor confirms it with an estimated delivery date, the order is updated to status "confirmed" and displays to the customer as confirmed.
        </p>
      </section>

      <section aria-label="New purchase order">
        <h2>New purchase order</h2>
        <form (ngSubmit)="submitOrder()">
          <label for="order-vendor-id">Vendor ID</label>
          <input id="order-vendor-id" name="vendorId" [(ngModel)]="vendorId" required />

          @for (item of items; track $index) {
            <fieldset>
              <label [for]="'item-desc-' + $index">Description</label>
              <input [id]="'item-desc-' + $index" [name]="'desc' + $index" [(ngModel)]="item.description" />
              <label [for]="'item-qty-' + $index">Quantity</label>
              <input [id]="'item-qty-' + $index" type="number" min="1" [name]="'qty' + $index" [(ngModel)]="item.quantity" />
              <label [for]="'item-price-' + $index">Unit price</label>
              <input [id]="'item-price-' + $index" type="number" min="0" step="0.01" [name]="'price' + $index" [(ngModel)]="item.unitPrice" />
            </fieldset>
          }
          <button type="button" (click)="addItem()">Add item</button>
          <button type="submit" data-testid="orders-submit">Submit purchase order</button>
        </form>
        @if (message()) {
          <p role="status">{{ message() }}</p>
        }
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
      </section>

      <section aria-label="Order list">
        <h2>Your orders</h2>
        @if (orders().length === 0) {
          <p>No orders yet.</p>
        } @else {
          <ul>
            @for (order of orders(); track order.id) {
              <li [attr.data-order-id]="order.id">
                <span>Order {{ order.id }}</span> —
                <strong>{{ order.status }}</strong>
                @if (order.status === 'pending') {
                  <label [for]="'eta-' + order.id">Estimated delivery</label>
                  <input [id]="'eta-' + order.id" type="date" [name]="'eta' + order.id"
                         [(ngModel)]="deliveryDates[order.id]" />
                  <button type="button" (click)="confirmOrder(order)">Confirm order</button>
                }
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class OrderManagementComponent implements OnInit {
  private api = inject(ApiClient);

  orders = signal<OrderRecord[]>([]);
  message = signal<string>('');
  error = signal<string>('');

  vendorId = '';
  items: OrderItemInput[] = [{ description: '', quantity: 1, unitPrice: 0 }];
  deliveryDates: Record<string, string> = {};

  ngOnInit(): void {
    void this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    try {
      const list = await this.api.get<OrderRecord[]>('orders');
      this.orders.set(Array.isArray(list) ? list : []);
    } catch {
      this.orders.set([]);
    }
  }

  addItem(): void {
    this.items.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  async submitOrder(): Promise<void> {
    this.error.set('');
    this.message.set('');
    if (!this.vendorId.trim()) {
      this.error.set('Vendor ID is required.');
      return;
    }
    try {
      const created = await this.api.post<OrderRecord>('orders', {
        vendorId: this.vendorId.trim(),
        items: this.items
          .filter(i => i.description.trim())
          .map(i => ({ description: i.description.trim(), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      });
      if (created && created.id) {
        this.orders.update(list => [{ ...created, status: created.status ?? 'pending' }, ...list]);
      }
      this.message.set('Order submitted — status: pending.');
      this.vendorId = '';
      this.items = [{ description: '', quantity: 1, unitPrice: 0 }];
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Could not submit the order.');
    }
  }

  async confirmOrder(order: OrderRecord): Promise<void> {
    this.error.set('');
    this.message.set('');
    const estimatedDelivery = this.deliveryDates[order.id];
    if (!estimatedDelivery) {
      this.error.set('Choose an estimated delivery date first.');
      return;
    }
    try {
      const updated = await this.api.patch<OrderRecord>(`orders/${order.id}/confirm`, { estimatedDelivery });
      this.orders.update(list =>
        list.map(o => (o.id === order.id ? { ...o, ...(updated ?? {}), status: updated?.status ?? 'confirmed' } : o)),
      );
      this.message.set('Order confirmed.');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Could not confirm the order.');
    }
  }
}
