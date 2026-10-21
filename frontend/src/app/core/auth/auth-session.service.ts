import { Injectable, signal } from '@angular/core';

/** In-memory access token. Not written to localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly accessToken = signal<string | null>(null);

  setAccessToken(token: string): void {
    this.accessToken.set(token);
  }

  logout(): void {
    this.accessToken.set(null);
  }
}
