import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <a class="brand" [routerLink]="auth.isAuthenticated() ? '/map' : '/auth'">S.O.S. Geo</a>
      @if (auth.isAuthenticated()) {
        <nav aria-label="Navegación principal">
          <a routerLink="/map" routerLinkActive="active" ariaCurrentWhenActive="page">Mapa</a>
          <a routerLink="/directory" routerLinkActive="active" ariaCurrentWhenActive="page">Directorio</a>
          <a routerLink="/requests" routerLinkActive="active" ariaCurrentWhenActive="page">Solicitudes</a>
        </nav>
        <button type="button" class="secondary" (click)="logout()">Cerrar sesión</button>
      }
    </header>
  `,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }
}
