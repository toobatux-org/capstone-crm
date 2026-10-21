import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** In-memory access token. Local demo auth is enabled only in development builds. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly accessToken = signal<string | null>(null);
  readonly roles = signal<string[]>([]);

  setAccessToken(token: string): void {
    this.demoMode.set(false);
    this.accessToken.set(token);
    this.roles.set(this.readRoles(token));
  }

  isAdmin(): boolean {
    return this.roles().includes('ADMIN');
  }

  startDemoSession(): void {
    if (!environment.localDemoSignInEnabled) {
      throw new Error('Local demo sign-in is only available in development builds.');
    }
    this.accessToken.set(null);
    this.demoMode.set(true);
  }

  logout(): void {
    this.accessToken.set(null);
    this.roles.set([]);
  }

  private readRoles(token: string): string[] {
    const payload = token.split('.')[1];
    if (!payload) {
      return [];
    }
    try {
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { roles?: unknown };
      return Array.isArray(json.roles) ? json.roles.filter((role): role is string => typeof role === 'string') : [];
    } catch {
      return [];
    }
  }
}
