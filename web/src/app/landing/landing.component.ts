import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="landing-page" data-testid="landing-page">
      <header class="landing-header">
        <span class="landing-brand">Workspace Portal</span>
        <nav class="landing-auth">
          <a routerLink="/signup" class="link-secondary" data-testid="landing-signup">Sign up</a>
          <a routerLink="/login" class="link-secondary" data-testid="landing-signin">Sign in</a>
        </nav>
      </header>

      <main class="landing-main">
        <section class="landing-hero">
          <h1 class="landing-title" data-testid="landing-headline">B2B Vendor &amp; Customer Workspace Portal</h1>
          <p class="landing-subtitle" data-testid="landing-subheadline">Streamline onboarding, communications, and invoicing between vendors and customers in one place.</p>
          <a routerLink="/dashboard" class="btn-primary" data-testid="landing-cta-primary">Get Started</a>
        </section>

        <section class="landing-benefits" aria-label="Highlights">
          @for (h of highlights; track h.id) {
            <article class="benefit-card" [attr.data-testid]="h.id">
              <p class="benefit-text">{{ h.text }}</p>
            </article>
          }
        </section>

        <section class="landing-roles" aria-label="Get started by role">
          <a routerLink="/dashboard" class="btn-primary" data-testid="landing-cta-admin">Get Started</a>
          <a routerLink="/orders" class="btn-outline" data-testid="landing-cta-vendor">View Orders</a>
          <a routerLink="/invoices" class="btn-outline" data-testid="landing-cta-customer">Track Invoices</a>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }
    .landing-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }
    .landing-brand {
      font-weight: 700;
      color: var(--color-primary);
    }
    .landing-auth {
      display: flex;
      gap: 1rem;
    }
    .link-secondary {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .link-secondary:hover {
      color: var(--color-primary-hover);
    }
    .landing-main {
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      box-sizing: border-box;
    }
    .landing-hero {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .landing-title {
      font-size: 2.25rem;
      line-height: 1.2;
      font-weight: 700;
      margin: 0 0 0.75rem;
      color: var(--color-text-primary);
    }
    .landing-subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin: 0 auto 1.75rem;
      max-width: 640px;
    }
    .btn-primary,
    .btn-outline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.75rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      text-decoration: none;
      font-size: 1rem;
      border: 1px solid var(--color-primary);
    }
    .btn-primary {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
    .btn-primary:hover {
      background: var(--color-primary-hover);
    }
    .btn-outline {
      background: var(--color-surface);
      color: var(--color-primary);
    }
    .btn-outline:hover {
      background: var(--color-primary-light);
    }
    .landing-benefits {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .benefit-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 1.5rem;
    }
    .benefit-text {
      margin: 0;
      color: var(--color-text-primary);
      font-weight: 500;
    }
    .landing-roles {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }
    @media (min-width: 768px) {
      .landing-title {
        font-size: 2.75rem;
      }
      .landing-benefits {
        grid-template-columns: repeat(3, 1fr);
      }
      .landing-roles {
        flex-direction: row;
        justify-content: center;
      }
    }
  `]
})
export class LandingComponent {
  readonly highlights = [
    { id: 'landing-highlight-0', text: 'Shared channels for real-time vendor-customer communication' },
    { id: 'landing-highlight-1', text: 'Integrated invoice management and approval workflows' },
    { id: 'landing-highlight-2', text: 'Role-based access for admins, vendors, and customers' },
  ];
}
