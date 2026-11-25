import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ComponentRef, DestroyRef, ElementRef, OnDestroy, ViewContainerRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { Observable, finalize, forkJoin, of } from 'rxjs';
import { DirectoryService, NamedRecord } from '../directory/directory.service';
import { LocationFilterBarComponent } from './location-filter-bar.component';
import { LocationPopupComponent } from './location-popup.component';
import { LocationsRealtimeTableComponent } from './locations-realtime-table.component';
import { Coordinates, LocationFilters, LocationInput, LocationsService, MapLocation, emptyLocationFilters } from './locations.service';

@Component({
  imports: [LocationFilterBarComponent, LocationsRealtimeTableComponent],
  providers: [LocationsService],
  template: `
    <h1>Mapa de ubicaciones</h1>
    <p>Haz clic en el mapa para registrar un punto. Abre un marcador para editarlo o eliminarlo.</p>
    <app-location-filter-bar [categories]="categories()" [disabled]="loading() || busy()"
      (filtersChange)="applyFilters($event)" />
    @if (loading()) { <p role="status">Cargando ubicaciones…</p> }
    @if (loadFailed()) {
      <p role="alert">{{ loaded() ? 'No se pudieron aplicar los filtros. Se mantienen los resultados anteriores.' : 'No se pudieron cargar las ubicaciones o categorías.' }}</p>
      <button type="button" (click)="load()">Reintentar</button>
    } @else if (!loading() && !categories().length) {
      <p>Registra una categoría en el directorio para agregar ubicaciones.</p>
    }
    <div #mapCanvas class="map-canvas" role="region" aria-label="Mapa interactivo de ubicaciones"></div>
    <ng-container #popupHost />
    @if (loaded()) {
      <app-locations-realtime-table [locations]="locations()" />
    }
  `,
  styles: `
    h1 { margin: 0; }
    .map-canvas { height: clamp(24rem, 65vh, 44rem); border: 1px solid var(--border); border-radius: .9rem; z-index: 0; }
  `,
})
export class MapDashboardPageComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(LocationsService);
  private readonly directory = inject(DirectoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('mapCanvas');
  private readonly popupHost = viewChild.required('popupHost', { read: ViewContainerRef });
  private readonly markers = new Map<string, { marker: L.Marker; record: MapLocation }>();
  private readonly markerIcon = L.divIcon({ className: 'location-marker', iconSize: [44, 44], iconAnchor: [22, 22] });
  private map!: L.Map;
  private requestedFilters = emptyLocationFilters;
  private activePopup?: { popup: L.Popup; component: ComponentRef<LocationPopupComponent>; observer: ResizeObserver };

  protected readonly categories = signal<NamedRecord[]>([]);
  protected readonly locations = this.api.locations;
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly loaded = signal(false);
  protected readonly busy = signal(false);

  constructor() {
    effect(() => this.syncMarkers(this.locations()));
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.canvas().nativeElement).setView([21.122, -101.682], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.loading() || !this.loaded() || this.busy()) return;
      const { lng, lat } = event.latlng.wrap();
      this.openPopup([lng, lat], null);
    });
    this.map.on('popupclose', (event: L.PopupEvent) => {
      if (this.activePopup?.popup !== event.popup) return;
      this.activePopup.observer.disconnect();
      this.popupHost().clear();
      this.activePopup = undefined;
    });
    // The map container must be rendered before Leaflet can measure it.
    queueMicrotask(() => {
      if (!this.destroyRef.destroyed) this.load();
    });
  }

  ngOnDestroy(): void {
    this.activePopup?.observer.disconnect();
    this.map?.off('popupclose');
    this.map?.remove();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.map.closePopup();
    forkJoin({
      locations: this.api.list(this.requestedFilters),
      categories: this.loaded() ? of(this.categories()) : this.directory.list('categories'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ locations, categories }) => {
        this.categories.set(categories);
        this.loaded.set(true);
        if (locations.length) {
          const points = locations.map(({ location: { coordinates: [lng, lat] } }) => L.latLng(lat, lng));
          this.map.fitBounds(L.latLngBounds(points), { maxZoom: 15, padding: [30, 30] });
        }
      },
      error: () => this.loadFailed.set(true),
    });
  }

  protected applyFilters(filters: LocationFilters): void {
    if (this.loading() || this.busy()) return;
    this.requestedFilters = filters;
    this.load();
  }

  private syncMarkers(locations: MapLocation[]): void {
    const visibleIds = new Set(locations.map(location => location.id));
    for (const [id, { marker }] of this.markers) {
      if (visibleIds.has(id)) continue;
      marker.remove();
      this.markers.delete(id);
    }
    for (const location of locations) {
      if (this.markers.get(location.id)?.record !== location) this.upsertMarker(location);
    }
  }

  private upsertMarker(record: MapLocation): void {
    const [lng, lat] = record.location.coordinates;
    this.markers.get(record.id)?.marker.remove();
    const marker = L.marker([lat, lng], { icon: this.markerIcon, title: record.name, alt: record.name })
      .on('click', () => this.openPopup(record.location.coordinates, record))
      .addTo(this.map);
    marker.getElement()?.setAttribute('aria-label', record.name);
    this.markers.set(record.id, { marker, record });
  }

  private openPopup([lng, lat]: Coordinates, record: MapLocation | null): void {
    if (this.busy() || this.loading()) return;
    this.map.closePopup();
    if (record) this.focusLocation(lat, lng, 16);
    const component = this.popupHost().createComponent(LocationPopupComponent);
    component.setInput('record', record);
    component.setInput('coordinates', [lng, lat]);
    component.setInput('categories', this.categories());
    if (!record) component.instance.beginEdit();

    const popup = L.popup({ className: 'location-popup', maxHeight: 360 })
      .setLatLng([lat, lng])
      .setContent(component.location.nativeElement);
    const observer = new ResizeObserver(() => {
      if (this.activePopup?.popup !== popup) return;
      const focused = document.activeElement;
      popup.update();
      if (focused instanceof HTMLElement && component.location.nativeElement.contains(focused)) {
        focused.focus({ preventScroll: true });
      }
    });
    this.activePopup = { popup, component, observer };
    component.instance.saved.subscribe(data => this.save(data, [lng, lat], record, component));
    component.instance.closed.subscribe(() => this.map.closePopup(popup));
    component.instance.editStarted.subscribe(() => this.focusLocation(lat, lng, 17));
    if (record) component.instance.removed.subscribe(() => this.remove(record, component));
    component.changeDetectorRef.detectChanges();
    popup.openOn(this.map);
    observer.observe(component.location.nativeElement);
  }

  private focusLocation(lat: number, lng: number, minimumZoom: number): void {
    const zoom = Math.max(this.map.getZoom(), minimumZoom);
    const point = this.map.project([lat, lng], zoom);
    // Leave room above the point for its popup.
    const offset = Math.min(this.map.getSize().y / 4, 130);
    const center = this.map.unproject(point.subtract([0, offset]), zoom);
    this.map.setView(center, zoom, { animate: false });
  }

  private save(data: LocationInput, coordinates: Coordinates, record: MapLocation | null,
    component: ComponentRef<LocationPopupComponent>): void {
    const request = record ? this.api.update(record.id, data) : this.api.create(data, coordinates);
    this.mutate(request, component, saved => {
      if (this.activePopup?.component !== component) return;
      if (!this.locations().includes(saved)) {
        this.map.closePopup(this.activePopup.popup);
        return;
      }
      if (!record) {
        this.openPopup(saved.location.coordinates, saved);
        return;
      }
      component.setInput('record', saved);
      component.instance.editing.set(false);
    });
  }

  private remove(record: MapLocation, component: ComponentRef<LocationPopupComponent>): void {
    this.mutate(this.api.delete(record.id), component, () => {
      if (this.activePopup?.component === component) this.map.closePopup(this.activePopup.popup);
    });
  }

  private mutate<T>(request: Observable<T>, component: ComponentRef<LocationPopupComponent>,
    success: (value: T) => void): void {
    if (this.busy() || this.loading()) return;
    this.busy.set(true);
    component.instance.busy.set(true);
    component.instance.error.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.busy.set(false);
      if (this.activePopup?.component === component) component.instance.busy.set(false);
    })).subscribe({
      next: value => {
        this.busy.set(false);
        success(value);
      },
      error: (error: HttpErrorResponse) => {
        if (this.activePopup?.component === component) {
          component.instance.error.set(error.error?.error?.message ?? 'No se pudo completar la operación.');
        }
      },
    });
  }
}
