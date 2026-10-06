import { Component, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService, User } from '../shared/auth.service';
import { StickyFooterComponent } from '../shared/sticky-footer.component';
import { AuthApi } from '../shared/api/auth-api.service';
import {
  UnauthorizedError,
  BadRequestError,
} from '../shared/api/api-errors';
import { PREVIEW_MODE } from '../shared/preview/preview-mode';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StickyFooterComponent],
  styleUrl: './login.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="login-page" @fadeIn>
      <div class="login-container">
        <!-- Sign-in form only. The brand copy and product journey live on the
             public /about page (linked below) so nothing competes with the
             single action on this screen. -->
      <div class="form-panel">
        <div class="form-container">
          <img src="brand/logo.svg" alt="" width="40" height="40" class="auth-logo">
          <h2 class="form-title">{{ 'Sign In' }}</h2>
          <p class="form-subtitle">{{ 'Access your company profile' }}</p>

          <form (ngSubmit)="onLogin()" class="login-form">
            @if (error()) {
              <div class="error-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                {{ error() }}
              </div>
            }

            <div class="form-group">
              <label for="email">{{ 'Email' }}</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="martin@example.bg"
                required
                autocomplete="email"
              />
              @if (emailError()) {
                <small class="field-error">{{ emailError() }}</small>
              }
            </div>

            <div class="form-group">
              <label for="password">{{ 'Password' }}</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <a routerLink="/forgot-password" class="forgot-link">{{ 'Forgot password?' }}</a>
              @if (passwordError()) {
                <small class="field-error">{{ passwordError() }}</small>
              }
            </div>

            <button type="submit" class="btn-primary" [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span>
                {{ 'Signing in...' }}
              } @else {
                {{ 'Sign In' }}
              }
            </button>
          </form>

          <div class="signup-link">
            <p>No account yet? <a routerLink="/signup">Sign up</a></p>
            <p class="about-link">
              <a routerLink="/about">{{ 'About this platform' }}</a>
            </p>
          </div>

        </div>
      </div>
    </div>

    <app-sticky-footer></app-sticky-footer>
  </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal<string | null>(null);
  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  isLoading = signal(false);

  /** True only in the static design-review build (see preview-mode.ts). */
  previewMode = PREVIEW_MODE;

  auth = inject(AuthService);
  private authApi = inject(AuthApi);
  private route = inject(ActivatedRoute);
  private destroyed = false;

  constructor(private router: Router) {
    inject(DestroyRef).onDestroy(() => { this.destroyed = true; });
  }

  private validate(): boolean {
    let ok = true;
    this.emailError.set(null);
    this.passwordError.set(null);

    if (!this.email) {
      this.emailError.set('Email is required');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError.set('Please enter a valid email address');
      ok = false;
    }

    if (!this.password) {
      this.passwordError.set('Password is required');
      ok = false;
    } else if (this.password.length < 4) {
      this.passwordError.set('Password is too short');
      ok = false;
    }

    return ok;
  }

  async onLogin() {
    if (!this.validate()) return;

    // Static design-review preview: there is no backend to ask, and awaiting a
    // request that cannot succeed would strand the reviewer on this screen with
    // a generic error. validate() has already required a non-empty,
    // address-shaped email and a non-empty password — in the preview that IS
    // the whole credential check, resolved here in the client.
    if (PREVIEW_MODE || environment.useMocks) {
      this.previewSignIn();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.authApi.login({
        email: this.email,
        password: this.password,
      });
      this.auth.setUser({
        id: result.id,
        email: result.email,
        name: result.email.split('@')[0],
        role: this.mapRole(result.role),
      });
      this.routeForRole();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        this.error.set(
          'Invalid email or password',
        );
      } else if (err instanceof BadRequestError) {
        this.error.set(
          'Invalid login data',
        );
      } else {
        this.error.set(
          'Something went wrong. Please try again.',
        );
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Role-based landing: admins go to customer management, everyone else
   * (vendor, customer, user) to /orders. A safe internal returnUrl from the
   * session-expiry redirect wins for non-admins.
   */
  private routeForRole() {
    // The user already left /login, so a late login response must not hijack
    // their navigation (card 13b76614).
    if (this.destroyed) return;
    if (this.auth.hasAdminRole()) {
      this.router.navigate(['/admin/customers']);
      return;
    }
    // INTERNAL paths only — '/x...' but not '//x' — so the query param can
    // never become an open redirect.
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  /**
   * Preview/hermetic-only sign-in (no backend): set the session locally. The
   * demo seed accounts map to their roles; any other address containing
   * "admin" is an admin, everything else a customer.
   */
  private previewSignIn() {
    const email = this.email.trim().toLowerCase();
    const seeded: Record<string, User['role']> = {
      'admin@b2b-portal.example.com': 'ADMIN',
      'vendor@acme.example.com': 'VENDOR',
      'buyer@corp.example.com': 'CUSTOMER',
    };
    const role: User['role'] =
      seeded[email] ?? (/admin/i.test(email) ? 'ADMIN' : 'CUSTOMER');
    this.auth.setUser({
      id: 'preview-' + role.toLowerCase(),
      email,
      name: email.split('@')[0],
      role,
    });
    this.routeForRole();
  }

  private mapRole(backendRole: string): User['role'] {
    switch (backendRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'MANAGER':
      case 'VENDOR':
      case 'CUSTOMER':
        return backendRole;
      default:
        return 'USER';
    }
  }
}
