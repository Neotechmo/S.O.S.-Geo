import { Component, input, output, signal } from '@angular/core';

@Component({
  template: `
    @if (name(); as zoneName) {
      <h2>{{ zoneName }}</h2>
      @if (confirming()) {
        <p>¿Eliminar esta zona?</p>
        <div class="actions">
          <button type="button" [disabled]="busy()" (click)="removed.emit()">Confirmar eliminación</button>
          <button type="button" class="secondary" [disabled]="busy()" (click)="confirming.set(false)">Cancelar</button>
        </div>
      } @else {
        <div class="actions">
          <button type="button" [disabled]="busy()" (click)="editRequested.emit()">Editar zona</button>
          <button type="button" class="secondary" [disabled]="busy()" (click)="confirming.set(true)">Eliminar zona</button>
        </div>
      }
    } @else {
      <h2>Nueva zona</h2>
      <form (submit)="submit($event, zoneName.value)">
        <label>Nombre de la zona
          <input #zoneName required maxlength="80" [disabled]="busy()">
        </label>
        <div class="actions">
          <button type="submit" [disabled]="busy()">Guardar zona</button>
          <button type="button" class="secondary" [disabled]="busy()" (click)="closed.emit()">Cancelar</button>
        </div>
      </form>
    }
    @if (busy()) { <p role="status">Procesando…</p> }
    @if (error()) { <p role="alert">{{ error() }}</p> }
  `,
  styles: `
    :host { display: block; width: min(16rem, 62vw); overflow-wrap: anywhere; }
    h2 { margin: 0 0 .5rem; font-size: 1rem; }
    label { display: grid; gap: .25rem; margin-bottom: .5rem; }
    input {
      width: 100%; padding: .35rem; border: 1px solid var(--input-border);
      border-radius: .35rem; background: var(--background); color: var(--text);
    }
    .actions { display: flex; flex-wrap: wrap; gap: .4rem; }
    .secondary { background: var(--background); border: 1px solid var(--border); }
    [role="alert"] { color: color-mix(in srgb, var(--alert) 75%, var(--text)); }
  `,
})
export class ZonePopupComponent {
  readonly name = input<string>();
  readonly saved = output<string>();
  readonly removed = output<void>();
  readonly editRequested = output<void>();
  readonly closed = output<void>();
  readonly busy = signal(false);
  readonly error = signal('');
  protected readonly confirming = signal(false);

  protected submit(event: Event, value: string): void {
    event.preventDefault();
    if (this.busy()) return;
    const name = value.trim();
    if (name.length < 3 || name.length > 80) {
      this.error.set('Escribe un nombre de 3 a 80 caracteres.');
      return;
    }
    this.saved.emit(name);
  }
}
