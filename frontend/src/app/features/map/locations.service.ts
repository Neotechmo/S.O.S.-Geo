import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export const locationStatuses = {
  activo: 'Activo',
  en_servicio: 'En servicio',
  inactivo: 'Inactivo',
};

export type Coordinates = [longitude: number, latitude: number];

export interface LocationInput {
  name: string;
  description: string;
  category: string;
  status: keyof typeof locationStatuses;
}

export interface MapLocation extends Omit<LocationInput, 'category'> {
  id: string;
  category: { id: string; name: string; color: string } | null;
  location: { type: 'Point'; coordinates: Coordinates };
  contactPhone: string;
  primaryProfessional: { id: string; fullName: string } | null;
  registeredBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationFilters {
  search: string;
  category: string;
  status: '' | LocationInput['status'];
}

export const emptyLocationFilters: LocationFilters = { search: '', category: '', status: '' };

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/locations`;
  private readonly rows = signal<MapLocation[]>([]);
  private activeFilters = emptyLocationFilters;
  readonly locations = this.rows.asReadonly();

  list(filters: LocationFilters = emptyLocationFilters) {
    const params = { ...filters, search: filters.search.trim() };
    return this.http.get<{ data: MapLocation[] }>(this.url, { params }).pipe(
      map(response => response.data),
      tap(locations => {
        this.activeFilters = params;
        this.rows.set(locations);
      }),
    );
  }

  create(data: LocationInput, [longitude, latitude]: Coordinates) {
    return this.http.post<{ data: MapLocation }>(this.url, { ...data, latitude, longitude }).pipe(
      map(response => response.data),
      tap(location => this.syncSaved(location)),
    );
  }

  update(id: string, data: LocationInput, coordinates?: Coordinates) {
    const body = coordinates ? { ...data, longitude: coordinates[0], latitude: coordinates[1] } : data;
    return this.http.patch<{ data: MapLocation }>(`${this.url}/${id}`, body).pipe(
      map(response => response.data),
      tap(location => this.syncSaved(location)),
    );
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/${id}`).pipe(
      tap(() => this.rows.update(rows => rows.filter(row => row.id !== id))),
    );
  }

  private syncSaved(location: MapLocation): void {
    const { search, category, status } = this.activeFilters;
    const term = search.toLowerCase();
    // The list endpoint searches both name and description.
    const matches = (!category || location.category?.id === category)
      && (!status || location.status === status)
      && (!term || [location.name, location.description].some(text => text.toLowerCase().includes(term)));

    this.rows.update(rows => {
      const remaining = rows.filter(row => row.id !== location.id);
      if (!matches) return remaining;
      return [...remaining, location].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
    });
  }
}
