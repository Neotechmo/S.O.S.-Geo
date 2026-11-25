import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import type { Polygon } from 'geojson';
import { environment } from '../../../environments/environment';

export interface MapZone {
  id: string;
  name: string;
  color: string;
  area: Polygon;
}

@Injectable({ providedIn: 'root' })
export class ZonesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/zones`;

  list() {
    return this.http.get<{ data: MapZone[] }>(this.url).pipe(map(response => response.data));
  }

  create(name: string, area: Polygon) {
    return this.http.post<{ data: MapZone }>(this.url, { name, area }).pipe(map(response => response.data));
  }

  update(id: string, name: string, area: Polygon) {
    return this.http.patch<{ data: MapZone }>(`${this.url}/${id}`, { name, area }).pipe(map(response => response.data));
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
