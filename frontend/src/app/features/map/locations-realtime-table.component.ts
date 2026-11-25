import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MapLocation, locationStatuses } from './locations.service';

@Component({
  selector: 'app-locations-realtime-table',
  imports: [DatePipe],
  template: `
    <section class="panel" aria-labelledby="locations-table">
      <h2 id="locations-table">Ubicaciones registradas</h2>
      @if (locations().length) {
        <div class="table-scroll" tabindex="0" role="region" aria-labelledby="locations-table">
          <table aria-labelledby="locations-table">
            <thead><tr>
              <th scope="col">Nombre</th><th scope="col">Descripción</th><th scope="col">Categoría</th>
              <th scope="col">Estado</th><th scope="col">Teléfono</th><th scope="col">Profesional principal</th>
              <th scope="col">Registró</th><th scope="col">Coordenadas</th>
              <th scope="col">Creación</th><th scope="col">Última actualización</th>
            </tr></thead>
            <tbody>
              @for (row of locations(); track row.id) {
                <tr>
                  <th scope="row">{{ row.name }}</th>
                  <td>{{ row.description }}</td>
                  <td>{{ row.category?.name ?? 'Sin categoría' }}</td>
                  <td>{{ statuses[row.status] }}</td>
                  <td>{{ row.contactPhone || 'Sin teléfono' }}</td>
                  <td>{{ row.primaryProfessional?.fullName ?? 'Sin asignar' }}</td>
                  <td>{{ row.registeredBy?.name ?? 'Usuario no disponible' }}</td>
                  <td class="coordinates">
                    <small>Tipo: {{ row.location.type }}</small>
                    <small>Longitud: {{ row.location.coordinates[0] }}</small>
                    <small>Latitud: {{ row.location.coordinates[1] }}</small>
                  </td>
                  <td><time [attr.datetime]="row.createdAt">{{ row.createdAt | date:'dd/MM/yyyy HH:mm' }}</time></td>
                  <td><time [attr.datetime]="row.updatedAt">{{ row.updatedAt | date:'dd/MM/yyyy HH:mm' }}</time></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p role="status">No hay ubicaciones que coincidan con los filtros.</p>
      }
    </section>
  `,
  styles: `
    :host { display: block; margin-top: 1rem; }
    h2 { margin: 0 0 1rem; font-size: 1.2rem; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: .65rem; border-bottom: 1px solid var(--border); vertical-align: top; }
    thead { background: var(--background); }
    td:nth-child(2) { min-width: 12rem; overflow-wrap: anywhere; }
    .coordinates, time { white-space: nowrap; }
    small { display: block; }
  `,
})
export class LocationsRealtimeTableComponent {
  readonly locations = input.required<MapLocation[]>();
  protected readonly statuses = locationStatuses;
}
