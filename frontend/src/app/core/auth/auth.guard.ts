import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateFn = () => {
  const isSignedIn = inject(AuthSessionService).isSignedIn();
  const router = inject(Router);
  return isSignedIn ? true : router.parseUrl('/login');
};
