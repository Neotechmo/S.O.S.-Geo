import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Coordinates, LocationInput, MapLocation, locationStatuses } from './locations.service';

@Component({
  imports: [ReactiveFormsModule],
  template: `
    @if (editing()) {
      <h2>{{ record() ? 'Editar ubicación' : 'Nueva ubicación' }}</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <fieldset [disabled]="busy()">
          <label>Nombre <input formControlName="name" required maxlength="80"></label>
          <label>Descripción <textarea formControlName="description" required maxlength="250" rows="2"></textarea></label>
          <label>Categoría
            <select formControlName="category" required>
              <option value="" disabled>Selecciona una categoría</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>
          <label>Estado
            <select formControlName="status">
              @for (status of statusOptions; track status) {
                <option [value]="status">{{ statuses[status] }}</option>
              }
            </select>
          </label>
          @if (validationError()) {
            <p role="alert">{{ validationError() }}</p>
          }
          <div class="actions">
            <button type="submit" [disabled]="!categories().length">Guardar</button>
            <button type="button" class="secondary" (click)="cancel()">Cancelar</button>
          </div>
        </fieldset>
      </form>
    } @else if (record(); as location) {
      <h2>{{ location.name }}</h2>
      <p class="description">{{ location.description }}</p>
      <p>{{ location.category?.name ?? 'Sin categoría' }} · {{ statuses[location.status] }}</p>
      @if (confirmingDelete()) {
        <p>¿Eliminar esta ubicación?</p>
        <div class="actions">
          <button type="button" [disabled]="busy()" (click)="removed.emit()">Confirmar eliminación</button>
          <button type="button" class="secondary" [disabled]="busy()" (click)="confirmingDelete.set(false)">Cancelar</button>
        </div>
      } @else {
        <div class="actions">
          <button type="button" [disabled]="busy()" (click)="beginEdit()">Editar</button>
          <button type="button" class="secondary" [disabled]="busy()" (click)="confirmingDelete.set(true)">Eliminar</button>
        </div>
      }
    }
    <p class="coordinates">Latitud {{ coordinates()[1].toFixed(6) }} · Longitud {{ coordinates()[0].toFixed(6) }}</p>
    @if (busy()) { <p role="status">Procesando…</p> }
    @if (error()) { <p role="alert">{{ error() }}</p> }
  `,
  styles: `
    :host { display: block; width: min(18rem, 62vw); overflow-wrap: anywhere; }
    h2 { margin: 0 0 .5rem; font-size: 1rem; }
    fieldset { display: grid; gap: .45rem; border: 0; margin: 0; padding: 0; min-width: 0; }
    label { display: grid; gap: .2rem; }
    input, textarea, select {
      width: 100%; padding: .35rem; border: 1px solid var(--input-border); border-radius: .35rem;
      background: var(--background); color: var(--text); font: inherit;
    }
    textarea { resize: vertical; }
    .description { white-space: pre-wrap; }
    .actions { display: flex; flex-wrap: wrap; gap: .4rem; }
    .secondary { background: var(--background); border: 1px solid var(--border); }
    [role="alert"] { color: color-mix(in srgb, var(--alert) 75%, var(--text)); }
    .coordinates { font-size: .75rem; }
  `,
})
export class LocationPopupComponent {
  readonly record = input<MapLocation | null>(null);
  readonly coordinates = input.required<Coordinates>();
  readonly categories = input<{ id: string; name: string }[]>([]);
  readonly saved = output<LocationInput>();
  readonly removed = output<void>();
  readonly closed = output<void>();
  readonly editStarted = output<void>();

  readonly busy = signal(false);
  readonly error = signal('');
  readonly editing = signal(false);
  protected readonly confirmingDelete = signal(false);
  protected readonly validationError = signal('');
  protected readonly statuses = locationStatuses;
  protected readonly statusOptions = Object.keys(locationStatuses) as LocationInput['status'][];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: '',
    description: '',
    category: '',
    status: 'activo' as LocationInput['status'],
  });

  beginEdit(): void {
    const record = this.record();
    this.form.reset(record ? {
      name: record.name,
      description: record.description,
      category: record.category?.id ?? '',
      status: record.status,
    } : undefined);
    this.validationError.set('');
    this.error.set('');
    this.editing.set(true);
    this.editStarted.emit();
  }

  protected cancel(): void {
    if (!this.record()) {
      this.closed.emit();
      return;
    }
    this.editing.set(false);
    this.error.set('');
  }

  protected submit(): void {
    if (this.busy()) return;
    const values = this.form.getRawValue();
    const name = values.name.trim();
    const description = values.description.trim();

    if (name.length < 4 || name.length > 80 || description.length < 10 || description.length > 250 || !values.category) {
      this.validationError.set('Escribe un nombre de 4 a 80 caracteres y una descripción de 10 a 250. Selecciona una categoría.');
      return;
    }

    this.validationError.set('');
    this.saved.emit({ ...values, name, description });
  }
}
