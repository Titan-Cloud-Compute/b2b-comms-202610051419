import { Component } from '@angular/core';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [],
  template: `
    <div class="page invoice-viewer-page" data-testid="invoices-screen">
      <h1 class="page-title">Invoices</h1>
      <p>invoice list and generator</p>
    </div>
  `,
})
export class InvoicesComponent {}
