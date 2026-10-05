import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../shared/auth.service';
import { AuthApi } from '../shared/api/auth-api.service';
import { ConflictError, BadRequestError } from '../shared/api/api-errors';
import { ToastService } from '../shared/api/toast.service';
import { PREVIEW_MODE } from '../shared/preview/preview-mode';
import { environment } from '../../environments/environment';

/**
 * Self-service sign-up: one step, email + password. Open to anyone; the
 * backend creates the account with role VENDOR and starts the session. On
 * success the visitor sees "Account created" and lands on /orders.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: './signup.component.css',
  template: `
    <div class="signup-container">
      <div class="signup-card">
        <div class="logo">
          <img src="brand/logo.svg" alt="" width="48" height="48" class="auth-logo">
        </div>
        <h1>Create Account</h1>
        <p class="subtitle">Join the Vendor and Customer Workspace Portal</p>

        <form (ngSubmit)="onSignup()" class="signup-form" novalidate>
          @if (error()) {
            <div class="error-message" role="alert">{{ error() }}</div>
          }

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              name="email"
              placeholder="email@company.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Min 8 characters"
              required
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="btn-primary" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Creating account...
            } @else {
              Create account
            }
          </button>
        </form>

        <p class="login-link">
          Already have an account?
          <a routerLink="/login">Log in</a>
        </p>
      </div>
    </div>
  `
})
export class SignupComponent {
  email = '';
  password = '';
  error = signal<string | null>(null);
  isLoading = signal(false);

  private auth = inject(AuthService);
  private authApi = inject(AuthApi);
  private toast = inject(ToastService);
  private router = inject(Router);

  async onSignup() {
    this.error.set(null);
    const email = this.email.trim();

    if (!email || !this.password) {
      this.error.set('Please enter your email and password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      this.error.set('Please enter a valid email address');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    this.isLoading.set(true);
    try {
      let user: Pick<User, 'id' | 'email' | 'role'>;
      if (PREVIEW_MODE || environment.useMocks) {
        // Hermetic / preview build: there is no backend to call, so the new
        // account (role VENDOR, same as the server default) is created locally.
        user = { id: 'preview-' + email, email, role: 'VENDOR' };
      } else {
        const result = await this.authApi.signup({ email, password: this.password });
        user = { id: result.id, email: result.email, role: result.role };
      }
      this.auth.setUser({ ...user, name: email.split('@')[0] });
      this.toast.show('Account created', 'success');
      void this.router.navigate(['/orders']);
    } catch (err) {
      if (err instanceof ConflictError) {
        this.error.set('An account with this email already exists');
      } else if (err instanceof BadRequestError) {
        this.error.set('Please check your email and password');
      } else {
        this.error.set('Signup failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
