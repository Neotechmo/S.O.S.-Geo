import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NamedRecord {
  id: string;
  name: string;
}

export interface CategoryInput {
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface Category extends CategoryInput {
  id: string;
}

export const professionalStatuses = {
  disponible: 'Disponible',
  en_servicio: 'En servicio',
  inactivo: 'Inactivo',
};

export interface ProfessionalInput {
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  experienceYears: number;
  status: keyof typeof professionalStatuses;
  category: string;
  zone: string | null;
}

export interface Professional extends Omit<ProfessionalInput, 'category' | 'zone'> {
  id: string;
  category: NamedRecord | null;
  zone: NamedRecord | null;
}

interface DirectoryRecords {
  categories: Category;
  professionals: Professional;
  zones: NamedRecord;
}

interface DirectoryInputs {
  categories: CategoryInput;
  professionals: ProfessionalInput;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private readonly http = inject(HttpClient);

  list<K extends keyof DirectoryRecords>(resource: K) {
    return this.http.get<ApiResponse<DirectoryRecords[K][]>>(`${environment.apiUrl}/${resource}`).pipe(
      map(response => response.data),
    );
  }

  save<K extends keyof DirectoryInputs>(resource: K, id: string | null, data: DirectoryInputs[K]) {
    const url = `${environment.apiUrl}/${resource}`;
    const request = id
      ? this.http.patch<ApiResponse<DirectoryRecords[K]>>(`${url}/${id}`, data)
      : this.http.post<ApiResponse<DirectoryRecords[K]>>(url, data);
    return request.pipe(map(response => response.data));
  }

  delete(resource: keyof DirectoryInputs, id: string) {
    return this.http.delete(`${environment.apiUrl}/${resource}/${id}`);
  }
}
