import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel auth-panel">
      <h1>{{ registering() ? 'Crear cuenta' : 'Iniciar sesión' }}</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (registering()) {
          <label for="name">Nombre</label>
          <input id="name" type="text" formControlName="name" autocomplete="name" required
            [attr.aria-invalid]="nameInvalid" [attr.aria-describedby]="nameInvalid ? 'name-error' : null">
          @if (nameInvalid) {
            <small id="name-error" role="alert">Escribe un nombre de 3 a 80 caracteres.</small>
          }
        }
        <label for="email">Correo electrónico</label>
        <input id="email" type="email" formControlName="email" autocomplete="username" required
          [attr.aria-invalid]="emailInvalid" [attr.aria-describedby]="emailInvalid ? 'email-error' : null">
        @if (emailInvalid) {
          <small id="email-error" role="alert">Escribe un correo electrónico válido.</small>
        }
        <label for="password">Contraseña</label>
        <input id="password" type="password" formControlName="password" required
          [attr.autocomplete]="registering() ? 'new-password' : 'current-password'"
          [attr.aria-invalid]="passwordInvalid" [attr.aria-describedby]="passwordInvalid ? 'password-error' : null">
        @if (passwordInvalid) {
          <small id="password-error" role="alert">
            {{ registering() ? 'Usa al menos 8 caracteres.' : 'Escribe tu contraseña.' }}
          </small>
        }
        <button type="submit" [disabled]="pending()">
          @if (registering()) {
            {{ pending() ? 'Creando cuenta…' : 'Crear cuenta' }}
          } @else {
            {{ pending() ? 'Iniciando sesión…' : 'Iniciar sesión' }}
          }
        </button>
      </form>
      <button class="auth-switch" type="button" [disabled]="pending()" (click)="toggleMode()">
        {{ registering() ? 'Ya tengo cuenta · Iniciar sesión' : '¿No tienes cuenta? Crear cuenta' }}
      </button>
    </section>
  `,
})
export class AuthPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly registering = signal(false);
  protected readonly pending = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [{ value: '', disabled: true }, (control: AbstractControl<string>) => {
      const length = control.value.trim().length;
      return length >= 3 && length <= 80 ? null : { nameLength: true };
    }],
    email: ['', [Validators.required, Validators.pattern(/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/)]],
    password: ['', Validators.required],
  });

  protected get nameInvalid(): boolean {
    const { name } = this.form.controls;
    return name.touched && name.invalid;
  }

  protected get emailInvalid(): boolean {
    const { email } = this.form.controls;
    return email.touched && email.invalid;
  }

  protected get passwordInvalid(): boolean {
    const { password } = this.form.controls;
    return password.touched && password.invalid;
  }

  protected toggleMode(): void {
    this.registering.update(value => !value);
    const { name, email, password } = this.form.controls;
    this.form.reset({ email: email.value });
    if (this.registering()) {
      name.enable();
      password.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      name.disable();
      password.setValidators(Validators.required);
    }
    password.updateValueAndValidity();
  }

  protected submit(): void {
    if (this.pending()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, password } = this.form.getRawValue();
    this.pending.set(true);
    const request = this.registering()
      ? this.auth.register(name.trim(), email.trim(), password)
      : this.auth.login(email.trim(), password);

    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/map', { replaceUrl: true }),
      // El interceptor y el servicio publican el error en las notificaciones.
      error: () => {},
    });
  }
}
