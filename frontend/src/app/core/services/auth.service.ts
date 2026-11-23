import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

const TOKEN_KEY = 'sos-geo.token';
const DEMO_SESSION_KEY = 'sos-geo.demo-session';

interface LoginResponse {
  token: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationService);
  private readonly storedToken = signal(localStorage.getItem(TOKEN_KEY));
  private readonly demoSession = signal(
    !!environment.demoAccount && sessionStorage.getItem(DEMO_SESSION_KEY) === 'active',
  );
  readonly token = this.storedToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this.token() || this.demoSession());

  login(email: string, password: string) {
    const demoAccount = environment.demoAccount;
    if (demoAccount && email.toLowerCase() === demoAccount.email) {
      if (password !== demoAccount.password) {
        const message = 'La contraseña del usuario de prueba es incorrecta.';
        this.notifications.error(message);
        return throwError(() => new Error(message));
      }
      this.logout();
      sessionStorage.setItem(DEMO_SESSION_KEY, 'active');
      this.demoSession.set(true);
      this.notifications.success('Sesión de prueba iniciada.');
      return of(undefined);
    }

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      map(({ token, message }) => {
        if (!token?.trim()) {
          const error = 'El servidor no devolvió un token de sesión.';
          this.notifications.error(error);
          throw new Error(error);
        }
        this.logout();
        localStorage.setItem(TOKEN_KEY, token);
        this.storedToken.set(token);
        this.notifications.success(message?.trim() || 'Sesión iniciada.');
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    this.storedToken.set(null);
    this.demoSession.set(false);
  }
}
