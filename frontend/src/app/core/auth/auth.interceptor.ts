import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from './auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthSessionService).accessToken();

  // Early return for missing token/outside URL
  if (!token || !req.url.startsWith(environment.apiBaseUrl) || req.url.includes('/api/v1/auth/')) {
    return next(req);
  }

  // Object clone
  return next(
    req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'X-Correlation-ID' : 'lab-request-001',
        }
      }
    )
  );
};
