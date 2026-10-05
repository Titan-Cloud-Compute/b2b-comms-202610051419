import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApi } from '../shared/api/auth-api.service';
import { BadRequestError, ConflictError } from '../shared/api/api-errors';

/**
 * Self-service sign-up: a single step with one Email field, one Password
 * field and one submit button. The server creates the account (new accounts
 * get the VENDOR role); on success the page shows "Account created".
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
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" style="fill: var(--color-primary)"/>
            <path d="M14 24L22 32L34 16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>Create Account</h1>
        <p class="subtitle">Join the Enterprise Platform</p>

        @if (created()) {
          <div class="success-message" role="status">Account created</div>
        }

        <form (ngSubmit)="onSignup()" class="signup-form">
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
              Sign up
            }
          </button>
        </form>

        <div class="divider">
          <span>or</span>
        </div>

        <p class="login-link">
          Already have an account?
          <a routerLink="/login">Sign in</a>
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
  created = signal(false);

  private authApi = inject(AuthApi);

  async onSignup() {
    this.error.set(null);
    this.created.set(false);

    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email.trim())) {
      this.error.set('Please enter a valid email address');
      return;
    }

    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authApi.signup({
        email: this.email.trim(),
        password: this.password,
      });
      this.created.set(true);
      this.password = '';
    } catch (err) {
      if (err instanceof ConflictError) {
        this.error.set('An account with this email already exists');
      } else if (err instanceof BadRequestError) {
        this.error.set('Invalid signup data');
      } else {
        this.error.set('Signup failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
