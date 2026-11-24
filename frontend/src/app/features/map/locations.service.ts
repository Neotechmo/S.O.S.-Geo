import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
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
}

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/locations`;

  list() {
    return this.http.get<{ data: MapLocation[] }>(this.url).pipe(map(response => response.data));
  }

  create(data: LocationInput, [longitude, latitude]: Coordinates) {
    return this.http.post<{ data: MapLocation }>(this.url, { ...data, latitude, longitude }).pipe(
      map(response => response.data),
    );
  }

  update(id: string, data: LocationInput) {
    return this.http.patch<{ data: MapLocation }>(`${this.url}/${id}`, data).pipe(
      map(response => response.data),
    );
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
