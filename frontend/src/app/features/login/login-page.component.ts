import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  template: `
    <section>
      <button type="button" (click)="login()">Sign in</button>
      <!-- <p>Mock login stores a demo Bearer token in memory only — not localStorage.</p>
      <p>XSS probe (must stay text): {{ xssProbe }}</p> -->
    </section>
  `,
})
export class LoginPageComponent {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly xssProbe = '<img src=x onerror=alert(1)> CUS-1001';

  login(): void {
    this.session.loginMock();
    void this.router.navigate(['/interactions']);
  }
}
