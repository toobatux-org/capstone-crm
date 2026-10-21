import { Injectable, signal } from '@angular/core';

/** In-memory access token. Not written to localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly accessToken = signal<string | null>(null);
  readonly roles = signal<string[]>([]);

  setAccessToken(token: string): void {
    this.accessToken.set(token);
    this.roles.set(this.readRoles(token));
  }

  isAdmin(): boolean {
    return this.roles().includes('ADMIN');
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
