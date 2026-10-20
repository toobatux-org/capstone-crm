import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section>
      <h2>Sign in</h2>
      <form (ngSubmit)="login()">
        <label for="username">Username</label>
        <input
          id="username"
          name="username"
          [(ngModel)]="username"
          autocomplete="username"
          required
          data-testid="username"
        />
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          [(ngModel)]="password"
          autocomplete="current-password"
          required
          data-testid="password"
        />
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
        <button type="submit" data-testid="sign-in" [disabled]="submitting()">
          {{ submitting() ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      <p>XSS probe (must stay text): {{ xssProbe }}</p>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly api = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  username = 'agent';
  password = '';
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly xssProbe = '<img src=x onerror=alert(1)> CUS-1001';

  login(): void {
    this.error.set('');
    this.submitting.set(true);
    this.api.login(this.username, this.password).subscribe({
      next: (response) => {
        this.session.setAccessToken(response.token);
        this.submitting.set(false);
        void this.router.navigate(['/interactions']);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Sign-in failed. Check the username and password.');
      },
    });
  }
}
