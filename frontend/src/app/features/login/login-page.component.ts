import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="login-page">
      <header class="page-heading">
        <h2>{{ registering() ? 'Create account' : 'Sign in' }}</h2>
        <p>{{ registering() ? 'New accounts are created as agents.' : 'Use your Northstar CRM account.' }}</p>
      </header>

      <form (ngSubmit)="submit()">
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            name="username"
            [(ngModel)]="username"
            autocomplete="username"
            required
            data-testid="username"
          />
        </div>

        @if (registering()) {
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              [(ngModel)]="email"
              placeholder="name@northstar.lab"
              autocomplete="email"
              required
              data-testid="email"
            />
          </div>
        }

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            [(ngModel)]="password"
            [attr.autocomplete]="registering() ? 'new-password' : 'current-password'"
            required
            data-testid="password"
          />
        </div>

        @if (error()) {
          <p class="field-error" role="alert">{{ error() }}</p>
        }

        <div class="actions">
          <button type="submit" data-testid="sign-in" [disabled]="submitting()">
            {{ submitLabel() }}
          </button>
          @if (registering()) {
            <button type="button" class="secondary" data-testid="back-to-sign-in" (click)="showLogin()" [disabled]="submitting()">
              Back to sign in
            </button>
          } @else {
            <button type="button" class="secondary" data-testid="register" (click)="showRegister()" [disabled]="submitting()">
              Register
            </button>
            @if (localDemoSignInEnabled) {
              <button
                type="button"
                class="secondary"
                data-testid="test-sign-in"
                (click)="startDemo()"
                [disabled]="submitting()"
              >
                Open local demo
              </button>
            }
          }
        </div>
      </form>
      @if (!registering() && localDemoSignInEnabled) {
        <p class="probe">Uses sample data in this browser. No server connection or account is required.</p>
      }
    </section>
  `,
  styles: `
    :host { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 6.5rem); }
    .login-page { width: 100%; max-width: 28rem; background: #fff; border: 1px solid #d5d9d6; border-radius: 6px; padding: 1.5rem; }
    .page-heading { border-bottom: 1px solid #d5d9d6; margin-bottom: 1.5rem; }
    .page-heading p { color: #59645d; }
    .page-heading h2 { margin-bottom: 0.35rem; }
    form { display: grid; gap: 1rem; }
    .field { display: grid; gap: 0.4rem; }
    label { font-weight: 600; }
    input { box-sizing: border-box; width: 100%; border: 1px solid #87938b; border-radius: 3px; padding: 0.65rem; font: inherit; background: #fff; color: #18221b; }
    input::placeholder { color: #8b978f; }
    input:focus, button:focus-visible { outline: 2px solid #176b54; outline-offset: 2px; }
    .field-error { margin: 0; color: #9d2929; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    button { border: 0; border-radius: 3px; padding: 0.65rem 1rem; background: #176b54; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    button.secondary { background: #fff; color: #176b54; border: 1px solid #176b54; }
    button:disabled { cursor: wait; opacity: 0.65; }
  `,
})
export class LoginPageComponent {
  private readonly api = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  username = '';
  email = '';
  password = '';
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly registering = signal(false);
  readonly localDemoSignInEnabled = environment.localDemoSignInEnabled;

  submitLabel(): string {
    if (this.submitting()) {
      return this.registering() ? 'Creating account...' : 'Signing in...';
    }
    return this.registering() ? 'Create account' : 'Sign in';
  }

  showRegister(): void {
    this.error.set('');
    this.registering.set(true);
  }

  showLogin(): void {
    this.error.set('');
    this.registering.set(false);
  }

  submit(): void {
    if (this.registering()) {
      this.register();
      return;
    }
    this.login();
  }

  startDemo(): void {
    if (!this.localDemoSignInEnabled || this.submitting() || this.registering()) {
      return;
    }
    this.session.startDemoSession();
    void this.router.navigate(['/customers']);
  }

  private login(): void {
    this.error.set('');
    this.submitting.set(true);
    this.api.login(this.username, this.password).subscribe({
      next: (response) => this.finish(response.token),
      error: () => {
        this.submitting.set(false);
        this.error.set('Sign-in failed. Check the username and password.');
      },
    });
  }

  private register(): void {
    this.error.set('');
    this.submitting.set(true);
    this.api.register(this.username.trim(), this.email.trim(), this.password).subscribe({
      next: (response) => this.finish(response.token),
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(this.registrationError(err));
      },
    });
  }

  private registrationError(err: HttpErrorResponse): string {
    if (!err.status) {
      return 'Could not reach the server. Check your connection and try again.';
    }

    const detail = this.problemDetail(err.error);
    if (detail === 'Username already exists' || detail === 'Email already exists') {
      return `${detail}. Choose different account details.`;
    }
    if (err.status === 400) {
      return detail ?? 'Check the username, email, and password, then try again.';
    }
    return 'Could not create the account. Please try again.';
  }

  private problemDetail(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('detail' in error)) {
      return null;
    }
    return typeof error.detail === 'string' ? error.detail : null;
  }

  private finish(token: string): void {
    this.session.setAccessToken(token);
    this.submitting.set(false);
    void this.router.navigate(['/customers']);
  }
}
