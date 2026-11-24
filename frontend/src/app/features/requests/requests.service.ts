import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NamedRecord } from '../directory/directory.service';

export const requestStatuses = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
};

export const requestPriorities = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export interface RequestInput {
  title: string;
  description: string;
  status: keyof typeof requestStatuses;
  priority: keyof typeof requestPriorities;
  contactName: string;
  contactPhone: string;
  category: string;
  location: string;
  professional: string | null;
}

export interface ServiceRequest extends Omit<RequestInput, 'category' | 'location' | 'professional'> {
  id: string;
  folio: string;
  category: NamedRecord | null;
  location: NamedRecord | null;
  professional: { id: string; fullName: string } | null;
  requestedBy: NamedRecord | null;
}

export interface RequestFilters {
  search: string;
  status: string;
  priority: string;
  category: string;
  location: string;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/service-requests`;

  list(filters: RequestFilters) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    return this.http.get<ApiResponse<ServiceRequest[]>>(this.url, { params }).pipe(
      map(response => response.data),
    );
  }

  listLocations() {
    return this.http.get<ApiResponse<NamedRecord[]>>(`${environment.apiUrl}/locations`).pipe(
      map(response => response.data),
    );
  }

  save(id: string | null, data: RequestInput) {
    return id ? this.http.patch(`${this.url}/${id}`, data) : this.http.post(this.url, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
