import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NamedRecord } from '../directory/directory.service';
import { LocationFilters, emptyLocationFilters, locationStatuses } from './locations.service';

@Component({
  selector: 'app-location-filter-bar',
  imports: [ReactiveFormsModule],
  template: `
    <form class="panel" [formGroup]="form" (ngSubmit)="apply()">
      <fieldset [disabled]="disabled()">
        <legend>Filtrar ubicaciones</legend>
        <label>Buscar por nombre
          <input type="search" formControlName="search" maxlength="80" placeholder="Nombre de la ubicación">
        </label>
        <label>Categoría
          <select formControlName="category">
            <option value="">Todas</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>
        <label>Estado
          <select formControlName="status">
            <option value="">Todos</option>
            @for (status of statusOptions; track status) {
              <option [value]="status">{{ statuses[status] }}</option>
            }
          </select>
        </label>
        <div class="actions">
          <button type="submit">Aplicar</button>
          <button type="button" class="secondary" (click)="clear()">Limpiar</button>
        </div>
      </fieldset>
    </form>
  `,
  styles: `
    :host { display: block; margin-bottom: 1rem; }
    fieldset {
      border: 0; padding: 0; margin: 0; min-width: 0;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
      gap: .75rem; align-items: end;
    }
    legend { font-weight: 700; margin-bottom: .75rem; }
    label { display: grid; gap: .25rem; }
    input, select {
      width: 100%; min-height: 2.5rem; padding: .4rem .55rem;
      background: var(--background); color: var(--text); font: inherit;
      border: 1px solid var(--input-border); border-radius: .5rem;
    }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    .secondary { background: var(--background); border: 1px solid var(--border); }
  `,
})
export class LocationFilterBarComponent {
  readonly categories = input.required<NamedRecord[]>();
  readonly disabled = input(false);
  readonly filtersChange = output<LocationFilters>();
  protected readonly statuses = locationStatuses;
  protected readonly statusOptions = Object.keys(locationStatuses) as (keyof typeof locationStatuses)[];
  protected readonly form = inject(FormBuilder).nonNullable.group(emptyLocationFilters);

  protected apply(): void {
    this.filtersChange.emit(this.form.getRawValue());
  }

  protected clear(): void {
    this.form.reset();
    this.apply();
  }
}
