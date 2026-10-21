import { Injectable, signal } from '@angular/core';

/** In-memory access token. Not written to localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly accessToken = signal<string | null>(null);
  readonly username = signal<string | null>(null);
  readonly roles = signal<string[]>([]);

  setAccessToken(token: string): void {
    const payload = this.readPayload(token);
    this.accessToken.set(token);
    this.username.set(payload.username);
    this.roles.set(payload.roles);
  }

  isSignedIn(): boolean {
    return this.accessToken() !== null;
  }

  isAdmin(): boolean {
    return this.roles().includes('ADMIN');
  }

  logout(): void {
    this.accessToken.set(null);
    this.username.set(null);
    this.roles.set([]);
  }

  private readPayload(token: string): { username: string | null; roles: string[] } {
    const payload = token.split('.')[1];
    if (!payload) {
      return { username: null, roles: [] };
    }
    try {
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
        sub?: unknown;
        roles?: unknown;
      };
      const username = typeof json.sub === 'string' ? json.sub : null;
      const roles = Array.isArray(json.roles)
        ? json.roles.filter((role): role is string => typeof role === 'string')
        : [];
      return { username, roles };
    } catch {
      return { username: null, roles: [] };
    }
  }
}
