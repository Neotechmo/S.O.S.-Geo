import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { Observable, finalize, forkJoin } from 'rxjs';
import { Category, DirectoryService, NamedRecord, Professional, professionalStatuses } from './directory.service';

const regionNames = new Intl.DisplayNames('es', { type: 'region' });
const countryDialCodes = getCountries().map(country => ({
  country,
  name: regionNames.of(country) ?? country,
  dialCode: `+${getCountryCallingCode(country)}`,
})).sort((left, right) => left.name.localeCompare(right.name, 'es'));

const dialCodeByCountry = new Map<string, string>(
  countryDialCodes.map(({ country, dialCode }) => [country, dialCode]),
);

function getDialPrefix(country: string): string {
  return dialCodeByCountry.get(country) ?? (country === '+' ? '+' : '');
}

const categoryIcons = new Map([
  ['car', { label: 'Automóvil', path: 'M5 17h14a2 2 0 0 0 2-2v-3l-2-2-2-5H7l-2 5-2 2v3a2 2 0 0 0 2 2Zm0 0v2m14-2v2M5 10h14M7 14h1m8 0h1' }],
  ['droplet', { label: 'Gota', path: 'M12 2C9 6 5 10 5 14a7 7 0 0 0 14 0c0-4-4-8-7-12Z' }],
  ['zap', { label: 'Rayo', path: 'm13 2-9 12h7l-1 8 10-12h-7l1-8Z' }],
  ['key', { label: 'Llave', path: 'M15 3a6 6 0 0 0-5.6 8.2L3 17.6V21h4v-3h3v-3h2.5A6 6 0 1 0 15 3Zm2 5h.01' }],
  ['wrench', { label: 'Herramienta', path: 'M21 7a6 6 0 0 1-8 5.7L6 20a2 2 0 0 1-3-3l7.3-7A6 6 0 0 1 17 2l-4 4 1 3 3 1 4-4Z' }],
]);

function textLength(min: number, max: number) {
  return (control: AbstractControl<string>) => {
    const length = control.value.trim().length;
    return length >= min && length <= max ? null : { textLength: true };
  };
}

function upsert<T extends { id: string }>(records: T[], saved: T, name: (record: T) => string): T[] {
  return [...records.filter(record => record.id !== saved.id), saved]
    .sort((left, right) => name(left).localeCompare(name(right), 'es'));
}

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './directory-admin-page.component.html',
  styleUrl: './directory-admin-page.component.css',
})
export class DirectoryAdminPageComponent {
  private readonly api = inject(DirectoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forms = inject(FormBuilder).nonNullable;

  protected readonly section = signal<'categories' | 'professionals'>('categories');
  protected readonly categories = signal<Category[]>([]);
  protected readonly professionals = signal<Professional[]>([]);
  protected readonly zones = signal<NamedRecord[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly busy = signal(false);
  protected readonly deleteError = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected readonly professionalId = signal<string | null>(null);
  protected readonly statuses = professionalStatuses;
  protected readonly dialCodes = countryDialCodes;
  protected readonly legacyDialCode = signal<string | null>(null);
  protected readonly icons = categoryIcons;

  protected readonly categoryForm = this.forms.group({
    name: this.forms.control('', textLength(3, 60)),
    description: this.forms.control('', textLength(10, 200)),
    color: this.forms.control('#6366f1', Validators.pattern(/^#[0-9a-f]{6}$/i)),
    icon: this.forms.control('', textLength(1, 30)),
    isActive: true,
  });

  protected readonly professionalForm = this.forms.group({
    fullName: this.forms.control('', textLength(4, 90)),
    specialty: this.forms.control('', textLength(4, 100)),
    phoneCountry: 'MX',
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    email: ['', [Validators.required, Validators.pattern(/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/)]],
    experienceYears: this.forms.control(0, [
      Validators.required, Validators.min(0), Validators.max(60),
      (control: AbstractControl) => Number.isInteger(control.value) ? null : { integer: true },
    ]),
    status: this.forms.control<Professional['status']>('disponible'),
    category: ['', Validators.required],
    zone: '',
  }, {
    validators: (form: AbstractControl) => {
      const { phoneCountry, phone } = form.getRawValue();
      const length = getDialPrefix(phoneCountry).length + phone.length;
      return length >= 10 && length <= 15 ? null : { phoneLength: true };
    },
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    forkJoin({
      categories: this.api.list('categories'),
      professionals: this.api.list('professionals'),
      zones: this.api.list('zones'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ categories, professionals, zones }) => {
        this.categories.set(categories);
        this.professionals.set(professionals);
        this.zones.set(zones);
      },
      error: () => this.loadFailed.set(true),
    });
  }

  protected editCategory(category: Category): void {
    this.categoryId.set(category.id);
    this.categoryForm.reset(category);
  }

  protected resetCategory(): void {
    this.categoryId.set(null);
    this.categoryForm.reset();
  }

  protected saveCategory(): void {
    this.categoryForm.markAllAsTouched();
    if (this.busy() || this.categoryForm.invalid) return;
    const { name, description, icon, ...fields } = this.categoryForm.getRawValue();
    this.mutate(this.api.save('categories', this.categoryId(), {
      ...fields, name: name.trim(), description: description.trim(), icon: icon.trim(),
    }), category => {
      this.categories.update(rows => upsert(rows, category, row => row.name));
      this.professionals.update(rows => rows.map(row => row.category?.id === category.id
        ? { ...row, category }
        : row));
      this.resetCategory();
    });
  }

  protected editProfessional(professional: Professional): void {
    this.professionalId.set(professional.id);
    const phone = professional.phone.trim().replace(/[^0-9+]/g, '');
    const parsedCountry = phone.startsWith('+') ? parsePhoneNumberFromString(phone)?.country : undefined;
    const matchingCountry = parsedCountry ?? countryDialCodes.find(({ dialCode }) => phone.startsWith(dialCode))?.country;
    const phoneCountry = matchingCountry ?? (phone.startsWith('+') ? '+' : '');
    this.legacyDialCode.set(matchingCountry ? null : phoneCountry);
    this.professionalForm.reset({
      ...professional,
      phoneCountry,
      phone: phone.slice(getDialPrefix(phoneCountry).length).replace(/[^0-9]/g, ''),
      category: professional.category?.id ?? '',
      zone: professional.zone?.id ?? '',
    });
  }

  protected resetProfessional(): void {
    this.professionalId.set(null);
    this.legacyDialCode.set(null);
    this.professionalForm.reset();
  }

  protected keepPhoneDigits(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '');
    if (input.value !== digits) {
      input.value = digits;
      this.professionalForm.controls.phone.setValue(digits);
    }
  }

  protected saveProfessional(): void {
    this.professionalForm.markAllAsTouched();
    if (this.busy() || this.professionalForm.invalid) return;
    const { fullName, specialty, phoneCountry, phone, email, zone, ...fields } = this.professionalForm.getRawValue();
    this.mutate(this.api.save('professionals', this.professionalId(), {
      ...fields, fullName: fullName.trim(), specialty: specialty.trim(),
      phone: getDialPrefix(phoneCountry) + phone, email: email.trim(), zone: zone || null,
    }), professional => {
      this.professionals.update(rows => upsert(rows, professional, row => row.fullName));
      this.resetProfessional();
    });
  }

  protected deleteCategory(category: Category): void {
    if (this.busy() || !window.confirm(`¿Eliminar la categoría «${category.name}»?`)) return;
    this.mutate(this.api.delete('categories', category.id), () => {
      this.categories.update(rows => rows.filter(row => row.id !== category.id));
      if (this.categoryId() === category.id) this.resetCategory();
      if (this.professionalForm.controls.category.value === category.id) {
        this.professionalForm.controls.category.reset();
      }
    }, (error: HttpErrorResponse) => {
      if (error.status === 400) {
        this.deleteError.set(error.error?.error?.message || 'No se pudo eliminar la categoría.');
      }
    });
  }

  protected deleteProfessional(professional: Professional): void {
    if (this.busy() || !window.confirm(`¿Eliminar a «${professional.fullName}» del directorio?`)) return;
    this.mutate(this.api.delete('professionals', professional.id), () => {
      this.professionals.update(rows => rows.filter(row => row.id !== professional.id));
      if (this.professionalId() === professional.id) this.resetProfessional();
    });
  }

  private mutate<T>(request: Observable<T>, next: (value: T) => void, error = (_: HttpErrorResponse) => {}): void {
    this.deleteError.set('');
    this.busy.set(true);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({ next, error });
  }
}
