import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** In-memory access token. Not written to localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly accessToken = signal<string | null>(null);
  readonly demoMode = signal(false);
  readonly isSignedIn = computed(() => this.accessToken() !== null || this.demoMode());
  readonly isAdmin = computed(() => this.tokenRoles().includes('ADMIN'));

  setAccessToken(token: string): void {
    this.demoMode.set(false);
    this.accessToken.set(token);
  }

  startDemoSession(): void {
    if (!environment.testSignInEnabled) {
      throw new Error('Local demo sign-in is only available in development builds.');
    }
    this.accessToken.set(null);
    this.demoMode.set(true);
  }

  logout(): void {
    this.accessToken.set(null);
    this.demoMode.set(false);
  }

  private tokenRoles(): string[] {
    const token = this.accessToken();
    const encodedPayload = token?.split('.')[1];
    if (!encodedPayload) return [];

    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(
        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')),
        (character) => character.charCodeAt(0),
      );
      const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (typeof payload !== 'object' || payload === null || !('roles' in payload) || !Array.isArray(payload.roles)) {
        return [];
      }
      return payload.roles.filter((role): role is string => typeof role === 'string');
    } catch {
      return [];
    }
  }
}
