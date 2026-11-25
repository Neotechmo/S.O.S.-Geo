import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const url = new URL(request.url, document.baseURI);
  const api = new URL(environment.apiUrl, document.baseURI);
  const apiPath = api.pathname.replace(/\/$/, '');

  if (url.origin !== api.origin || (url.pathname !== apiPath && !url.pathname.startsWith(apiPath + '/'))) {
    return next(request);
  }

  const auth = inject(AuthService);
  const notifications = inject(NotificationService);
  const router = inject(Router);
  const isPublicAuth = url.pathname === apiPath + '/auth/login' || url.pathname === apiPath + '/auth/register';
  const token = isPublicAuth ? null : auth.token();
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    tap({
      next: event => {
        if (!(event instanceof HttpResponse) || isPublicAuth || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
        const body: unknown = event.body;
        if (body && typeof body === 'object' && 'message' in body) {
          const { message } = body;
          if (typeof message === 'string' && message.trim()) notifications.success(message);
        }
      },
      error: (response: HttpErrorResponse) => {
        const message = response.error?.error?.message ?? response.error?.message;
        notifications.error(typeof message === 'string' && message.trim()
          ? message
          : response.status === 0
            ? 'No se pudo conectar con el servidor.'
            : 'No se pudo completar la solicitud.');

        if (response.status === 401 && token && token === auth.token()) {
          auth.logout();
          void router.navigateByUrl('/auth', { replaceUrl: true });
        }
      },
    }),
  );
};
