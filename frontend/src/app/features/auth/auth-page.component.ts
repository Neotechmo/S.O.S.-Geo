import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [FormsModule],
  template: `
    <section class="panel auth-panel">
      <h1>Iniciar sesión</h1>
      <form #form="ngForm" (ngSubmit)="login()">
        <label for="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autocomplete="username" required email [(ngModel)]="email">
        <label for="password">Contraseña</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required [(ngModel)]="password">
        <button type="submit" [disabled]="form.invalid || pending()">
          {{ pending() ? 'Iniciando sesión…' : 'Entrar' }}
        </button>
      </form>
    </section>
  `,
})
export class AuthPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly pending = signal(false);
  protected email = '';
  protected password = '';

  protected login(): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.auth.login(this.email.trim(), this.password).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/map', { replaceUrl: true }),
      // El interceptor y el servicio publican el error en el componente global.
      error: () => {},
    });
  }
}
