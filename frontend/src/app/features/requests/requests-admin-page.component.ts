import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize, forkJoin } from 'rxjs';
import { countryDialCodes, getDialPrefix, keepPhoneDigits, splitPhone, validatePhoneLength } from '../../shared/forms/phone';
import { DirectoryService, NamedRecord, Professional } from '../directory/directory.service';
import { RequestFilters, RequestInput, RequestsService, ServiceRequest, requestPriorities, requestStatuses } from './requests.service';

function textLength(min: number, max: number) {
  return (control: AbstractControl<string>) => {
    const length = control.value.trim().length;
    return length >= min && length <= max ? null : { textLength: true };
  };
}

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './requests-admin-page.component.html',
  styleUrl: './requests-admin-page.component.css',
})
export class RequestsAdminPageComponent {
  private readonly api = inject(RequestsService);
  private readonly directory = inject(DirectoryService);
  private readonly forms = inject(FormBuilder).nonNullable;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<NamedRecord[]>([]);
  protected readonly locations = signal<NamedRecord[]>([]);
  protected readonly professionals = signal<Professional[]>([]);
  protected readonly requests = signal<ServiceRequest[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly catalogFailed = signal(false);
  protected readonly listFailed = signal(false);
  protected readonly dialCodes = countryDialCodes;
  protected readonly legacyDialCode = signal<string | null>(null);
  protected readonly statuses = requestStatuses;
  protected readonly priorities = requestPriorities;
  protected readonly statusOptions = Object.keys(requestStatuses) as RequestInput['status'][];
  protected readonly priorityOptions = Object.keys(requestPriorities) as RequestInput['priority'][];

  protected readonly filters = this.forms.group({ search: '', status: '', priority: '', category: '', location: '' });
  private appliedFilters: RequestFilters = this.filters.getRawValue();

  protected readonly editor = this.forms.group({
    title: this.forms.control('', textLength(4, 90)),
    description: this.forms.control('', textLength(10, 300)),
    status: this.forms.control<RequestInput['status']>('pendiente'),
    priority: this.forms.control<RequestInput['priority']>('media'),
    contactName: this.forms.control('', textLength(3, 80)),
    phoneCountry: 'MX',
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    category: ['', Validators.required],
    location: ['', Validators.required],
    professional: '',
  }, { validators: validatePhoneLength });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.catalogFailed.set(false);
    forkJoin({
      categories: this.directory.list('categories'),
      locations: this.api.listLocations(),
      professionals: this.directory.list('professionals'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ categories, locations, professionals }) => {
        this.categories.set(categories);
        this.locations.set(locations);
        this.professionals.set(professionals);
        this.loadRequests();
      },
      error: () => {
        this.catalogFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected applyFilters(): void {
    const values = this.filters.getRawValue();
    this.appliedFilters = { ...values, search: values.search.trim() };
    this.loadRequests();
  }

  protected clearFilters(): void {
    this.filters.reset();
    this.applyFilters();
  }

  protected loadRequests(): void {
    this.loading.set(true);
    this.listFailed.set(false);
    this.api.list(this.appliedFilters).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: requests => this.requests.set(requests),
      error: () => this.listFailed.set(true),
    });
  }

  protected edit(request: ServiceRequest, title: HTMLInputElement): void {
    this.editingId.set(request.id);
    const { legacyDialCode, ...phoneFields } = splitPhone(request.contactPhone);
    this.legacyDialCode.set(legacyDialCode);
    this.editor.reset({
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      contactName: request.contactName,
      ...phoneFields,
      category: request.category?.id ?? '',
      location: request.location?.id ?? '',
      professional: request.professional?.id ?? '',
    });
    title.focus();
  }

  protected reset(): void {
    this.editingId.set(null);
    this.legacyDialCode.set(null);
    this.editor.reset();
  }

  protected keepPhoneDigits(event: Event): void {
    keepPhoneDigits(event, this.editor.controls.phone);
  }

  protected save(): void {
    this.editor.markAllAsTouched();
    if (this.busy() || this.loading() || this.editor.invalid) return;

    const { title, description, contactName, phoneCountry, phone, professional, ...fields } = this.editor.getRawValue();
    this.mutate(this.api.save(this.editingId(), {
      ...fields,
      title: title.trim(),
      description: description.trim(),
      contactName: contactName.trim(),
      contactPhone: getDialPrefix(phoneCountry) + phone,
      professional: professional || null,
    }), () => this.reset());
  }

  protected remove(request: ServiceRequest): void {
    if (this.busy() || !window.confirm(`¿Eliminar la solicitud «${request.folio}»?`)) return;
    this.mutate(this.api.delete(request.id), () => {
      if (this.editingId() === request.id) this.reset();
    });
  }

  private mutate(request: Observable<unknown>, onSuccess: () => void): void {
    this.busy.set(true);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: () => {
        onSuccess();
        this.loadRequests();
      },
      error: () => {}, // El interceptor muestra el mensaje de la API.
    });
  }
}
