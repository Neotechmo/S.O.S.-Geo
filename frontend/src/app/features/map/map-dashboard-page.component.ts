import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ComponentRef, DestroyRef, ElementRef, OnDestroy, ViewContainerRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import type { Polygon } from 'geojson';
import '@geoman-io/leaflet-geoman-free';
import { Observable, finalize, forkJoin, of } from 'rxjs';
import { DirectoryService, NamedRecord } from '../directory/directory.service';
import { ZonePopupComponent } from './zone-popup.component';
import { enableDraftVertexRemoval } from './zone-draw-vertices';
import { MapZone, ZonesService } from './zones.service';
import { LocationFilterBarComponent } from './location-filter-bar.component';
import { LocationPopupComponent } from './location-popup.component';
import { LocationsRealtimeTableComponent } from './locations-realtime-table.component';
import { Coordinates, LocationFilters, LocationInput, LocationsService, MapLocation, emptyLocationFilters, locationStatuses } from './locations.service';

const kilometers = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

@Component({
  imports: [LocationFilterBarComponent, LocationsRealtimeTableComponent],
  providers: [LocationsService],
  template: `
    <h1>Mapa de ubicaciones</h1>
    <p>Haz clic en el mapa para registrar un punto. Abre un marcador para editarlo o eliminarlo.</p>
    <app-location-filter-bar [categories]="categories()" [disabled]="loading() || busy() || drawingZone() || hasZoneDraft() || relocating() || !!zoneEdit()"
      (filtersChange)="applyFilters($event)" />
    @if (loading()) { <p role="status">Cargando ubicaciones…</p> }
    @if (loadFailed()) {
      <p role="alert">{{ loaded() ? 'No se pudieron aplicar los filtros. Se mantienen los resultados anteriores.' : 'No se pudieron cargar las ubicaciones o categorías.' }}</p>
      <button type="button" [disabled]="busy() || drawingZone() || hasZoneDraft() || relocating() || !!zoneEdit()" (click)="load()">Reintentar</button>
    } @else if (!loading() && !categories().length) {
      <p>Registra una categoría en el directorio para agregar ubicaciones.</p>
    }
    <div class="zone-actions">
      <button type="button" [disabled]="locating() || drawingZone() || hasZoneDraft() || busy() || relocating() || !!zoneEdit()"
        (click)="locateDevice()">{{ locating() ? 'Buscando tu ubicación…' : 'Mi ubicación' }}</button>
      <button type="button" [attr.aria-pressed]="drawingZone()"
        [disabled]="!drawingZone() && (zonesLoading() || zonesFailed() || loading() || busy() || hasZoneDraft() || relocating() || !!zoneEdit())"
        (click)="toggleZoneDrawing()">Dibujar zona</button>
      @if (drawingZone()) {
        <span role="status">Pulsa un vértice para quitarlo. El primero cierra el polígono cuando hay al menos tres. Pulsa Dibujar zona de nuevo para descartar el trazo.</span>
      }
      @if (zonesLoading()) { <span role="status">Cargando zonas…</span> }
      @if (zonesFailed()) {
        <span role="alert">No se pudieron cargar las zonas.</span>
        <button type="button" [disabled]="!!zoneEdit()" (click)="loadZones()">Reintentar zonas</button>
      }
    </div>
    @if (relocating()) {
      <div class="zone-actions">
        <span role="status">Selecciona la nueva ubicación en el mapa.</span>
        <button type="button" [disabled]="!candidate()" (click)="finishRelocation(true)">Usar este punto</button>
        <button type="button" (click)="finishRelocation(false)">Cancelar selección</button>
      </div>
    }
    @if (zoneEdit(); as edit) {
      <form class="panel zone-editor" (submit)="$event.preventDefault(); saveZoneEdit(zoneName.value)">
        <h2>Editar zona</h2>
        <label>Nombre de la zona <input #zoneName [value]="edit.zone.name" required maxlength="80" [disabled]="busy()"></label>
        <p>Arrastra los vértices para ampliar o reducir la zona. Arrastra un punto intermedio para crear un vértice.</p>
        <div class="zone-actions">
          <button type="submit" [disabled]="busy()">{{ busy() ? 'Guardando…' : 'Guardar cambios' }}</button>
          <button type="button" [disabled]="busy()" (click)="cancelZoneEdit()">Cancelar edición</button>
        </div>
        @if (zoneEditError()) { <p role="alert">{{ zoneEditError() }}</p> }
      </form>
    }
    @if (locationError()) { <p role="alert">{{ locationError() }}</p> }
    <div #mapCanvas class="map-canvas" role="region" aria-label="Mapa interactivo de ubicaciones"></div>
    <ng-container #popupHost />
    @if (devicePosition()) {
      <section class="panel nearby-panel" aria-labelledby="nearby-services">
        <h2 id="nearby-services">Servicios más cercanos</h2>
        <p>Distancia en línea recta desde tu ubicación. Se aplican los filtros del mapa.</p>
        @if (loading()) {
          <p role="status">Cargando puntos de atención…</p>
        } @else if (!loaded()) {
          <p>Reintenta la carga de ubicaciones para ver los servicios cercanos.</p>
        } @else if (nearbyServices().length) {
          <ol class="nearby-list">
            @for (service of nearbyServices(); track service.location.id) {
              <li>
                <button type="button" [disabled]="busy() || drawingZone() || hasZoneDraft() || relocating() || !!zoneEdit()"
                  (click)="showNearbyService(service.location)">{{ service.location.name }}</button>
                <span>{{ formatDistance(service.meters) }} · {{ service.location.category?.name ?? 'Sin categoría' }}
                  · {{ statuses[service.location.status] }}</span>
              </li>
            }
          </ol>
        } @else {
          <p>No hay puntos de atención para los filtros seleccionados.</p>
        }
      </section>
    }
    @if (loaded()) {
      <app-locations-realtime-table [locations]="locations()" />
    }
  `,
  styles: `
    h1 { margin: 0; }
    .zone-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; margin: .75rem 0; }
    .zone-actions button[aria-pressed="true"] { outline: 2px solid var(--brand); outline-offset: 2px; }
    .map-canvas { height: clamp(24rem, 65vh, 44rem); border: 1px solid var(--border); border-radius: .9rem; z-index: 0; }
    .zone-editor { margin-bottom: .75rem; }
    .zone-editor h2 { margin-top: 0; font-size: 1.2rem; }
    .zone-editor label { display: grid; gap: .25rem; max-width: 24rem; }
    .zone-editor input { background: var(--background); color: var(--text); padding: .4rem .55rem; border: 1px solid var(--input-border); border-radius: .35rem; }
    .nearby-panel { margin-top: 1rem; }
    .nearby-panel h2 { margin: 0; font-size: 1.2rem; }
    .nearby-list { margin-bottom: 0; padding-inline-start: 1.5rem; }
    .nearby-list li + li { margin-top: .5rem; }
    .nearby-list span { display: inline-block; margin-inline-start: .5rem; }
  `,
})
export class MapDashboardPageComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(LocationsService);
  private readonly zonesApi = inject(ZonesService);
  private readonly directory = inject(DirectoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('mapCanvas');
  private readonly popupHost = viewChild.required('popupHost', { read: ViewContainerRef });
  private readonly markers = new Map<string, { marker: L.Marker; record: MapLocation }>();
  private readonly markerIcon = L.divIcon({ className: 'location-marker', iconSize: [44, 44], iconAnchor: [22, 22] });
  private map!: L.Map;
  private readonly zoneLayers = new Map<string, L.GeoJSON>();
  private deviceLayers?: L.LayerGroup;
  private relocationMarker?: L.CircleMarker;
  private requestedFilters = emptyLocationFilters;
  private activePopup?: {
    popup: L.Popup;
    component: ComponentRef<LocationPopupComponent | ZonePopupComponent>;
    observer: ResizeObserver;
    onClose?: () => void;
  };

  protected readonly categories = signal<NamedRecord[]>([]);
  protected readonly locations = this.api.locations;
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly loaded = signal(false);
  protected readonly busy = signal(false);
  protected readonly relocating = signal(false);
  protected readonly candidate = signal<Coordinates | null>(null);
  protected readonly drawingZone = signal(false);
  protected readonly hasZoneDraft = signal(false);
  protected readonly zonesLoading = signal(true);
  protected readonly zonesFailed = signal(false);
  protected readonly zoneEdit = signal<{ zone: MapZone; draft: L.Polygon } | null>(null);
  protected readonly zoneEditError = signal('');
  protected readonly locating = signal(false);
  protected readonly locationError = signal('');
  protected readonly devicePosition = signal<L.LatLng | null>(null);
  protected readonly statuses = locationStatuses;
  protected readonly nearbyServices = computed(() => {
    const position = this.devicePosition();
    if (!position) return [];
    return this.locations().map(location => {
      const [lng, lat] = location.location.coordinates;
      return { location, meters: position.distanceTo([lat, lng]) };
    }).sort((left, right) => left.meters - right.meters).slice(0, 5);
  });

  constructor() {
    effect(() => this.syncMarkers(this.locations()));
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.canvas().nativeElement, { zoomControl: false }).setView([21.122, -101.682], 13);
    L.control.zoom({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(this.map);
    this.map.pm.setLang('es');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.loading() || !this.loaded() || this.busy() || this.drawingZone() || this.hasZoneDraft() || this.zoneEdit()) return;
      const { lng, lat } = event.latlng.wrap();
      if (this.relocating()) {
        this.candidate.set([lng, lat]);
        this.relocationMarker?.remove();
        this.relocationMarker = L.circleMarker([lat, lng], {
          radius: 11, color: '#f97316', fillOpacity: .55, dashArray: '4 3', interactive: false,
        }).addTo(this.map);
        return;
      }
      this.openPopup([lng, lat], null);
    });
    this.map.on('pm:drawend', () => this.drawingZone.set(false));
    enableDraftVertexRemoval(this.map);
    this.map.on('pm:create', ({ layer }) => {
      if (layer instanceof L.Polygon) this.openZoneDraft(layer);
    });
    this.map.on('popupclose', (event: L.PopupEvent) => {
      if (this.activePopup?.popup !== event.popup) return;
      const { observer, onClose } = this.activePopup;
      this.activePopup = undefined;
      observer.disconnect();
      this.popupHost().clear();
      onClose?.();
    });
    // The map container must be rendered before Leaflet can measure it.
    queueMicrotask(() => {
      if (this.destroyRef.destroyed) return;
      this.load();
      this.loadZones();
    });
  }

  ngOnDestroy(): void {
    this.zoneEdit()?.draft.pm.disable();
    this.activePopup?.observer.disconnect();
    this.map?.off('popupclose');
    this.map?.pm.disableDraw();
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
        if (locations.length && !this.devicePosition()) {
          const points = locations.map(({ location: { coordinates: [lng, lat] } }) => L.latLng(lat, lng));
          this.map.fitBounds(L.latLngBounds(points), { maxZoom: 15, padding: [30, 30] });
        }
      },
      error: () => this.loadFailed.set(true),
    });
  }

  protected locateDevice(): void {
    if (this.locating() || this.drawingZone() || this.hasZoneDraft() || this.busy()) return;
    this.locationError.set('');
    if (!window.isSecureContext) {
      this.locationError.set('Abre la aplicación desde HTTPS o localhost para usar la ubicación del dispositivo.');
      return;
    }
    if (!navigator.geolocation) {
      this.locationError.set('Este navegador no permite obtener la ubicación del dispositivo.');
      return;
    }

    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (this.destroyRef.destroyed) return;
        const position = L.latLng(coords.latitude, coords.longitude);
        this.devicePosition.set(position);
        this.locating.set(false);
        this.deviceLayers?.remove();
        this.deviceLayers = L.layerGroup([
          L.circle(position, { radius: coords.accuracy, color: '#3b82f6', weight: 1, fillOpacity: .12, interactive: false }),
          L.circleMarker(position, {
            radius: 8, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1, interactive: false,
          }).bindTooltip('Tu ubicación', { permanent: true, direction: 'top', offset: [0, -10] }),
        ]).addTo(this.map);

        if (!this.drawingZone() && !this.hasZoneDraft() && !this.busy() && !this.relocating() && !this.zoneEdit()) {
          this.map.closePopup();
          const closest = this.nearbyServices()[0]?.location.location.coordinates;
          if (closest) {
            const bounds = L.latLngBounds([position, L.latLng(closest[1], closest[0])]);
            this.map.fitBounds(bounds, { maxZoom: 16, padding: [42, 42] });
          } else {
            this.map.setView(position, 16);
          }
        }
      },
      error => {
        if (this.destroyRef.destroyed) return;
        this.locating.set(false);
        this.locationError.set(error.code === 1
          ? 'Permite el acceso a tu ubicación en el navegador e inténtalo de nuevo.'
          : 'No se pudo obtener tu ubicación. Inténtalo de nuevo.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  protected formatDistance(meters: number): string {
    return meters < 1000 ? `${Math.round(meters)} m` : `${kilometers.format(meters / 1000)} km`;
  }

  protected showNearbyService(location: MapLocation): void {
    this.openPopup(location.location.coordinates, location);
    this.canvas().nativeElement.scrollIntoView({ block: 'nearest' });
  }

  protected applyFilters(filters: LocationFilters): void {
    if (this.loading() || this.busy() || this.drawingZone() || this.hasZoneDraft() || this.relocating() || this.zoneEdit()) return;
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
    const marker = L.marker([lat, lng], { icon: this.markerIcon, title: record.name, alt: record.name, bubblingMouseEvents: true })
      .on('click', event => {
        if (this.relocating()) return;
        L.DomEvent.stopPropagation(event);
        this.openPopup(record.location.coordinates, record);
      })
      .addTo(this.map);
    const element = marker.getElement();
    element?.setAttribute('aria-label', record.name);
    if (record.category?.color) {
      element?.style.setProperty('--location-marker-color', record.category.color);
    }
    this.markers.set(record.id, { marker, record });
  }

  private openPopup([lng, lat]: Coordinates, record: MapLocation | null): void {
    if (this.busy() || this.loading() || this.drawingZone() || this.hasZoneDraft() || this.relocating() || this.zoneEdit()) return;
    this.map.closePopup();
    if (record) this.focusLocation(lat, lng, 16);
    const component = this.popupHost().createComponent(LocationPopupComponent);
    component.setInput('record', record);
    component.setInput('coordinates', [lng, lat]);
    component.setInput('categories', this.categories());
    if (!record) component.instance.beginEdit();

    const popup = L.popup({ className: 'location-popup', maxHeight: 360, closeOnClick: false }).setLatLng([lat, lng]);
    component.instance.saved.subscribe(({ data, coordinates }) => this.save(data, coordinates, record, component));
    component.instance.closed.subscribe(() => this.map.closePopup(popup));
    component.instance.editStarted.subscribe(() => {
      const position = popup.getLatLng();
      if (position) this.focusLocation(position.lat, position.lng, 17);
    });
    component.instance.moveRequested.subscribe(() => {
      this.relocating.set(true);
      popup.getElement()?.style.setProperty('visibility', 'hidden');
    });
    if (record) component.instance.removed.subscribe(() => this.remove(record, component));
    this.mountPopup(popup, component, () => this.clearRelocation());
  }

  protected finishRelocation(useCandidate: boolean): void {
    const active = this.activePopup;
    const candidate = this.candidate();
    if (!this.relocating() || !active || (useCandidate && !candidate)) return;
    const component = active.component.instance;
    if (useCandidate && component instanceof LocationPopupComponent) {
      component.selectedCoordinates.set(candidate);
    }
    this.clearRelocation();
    active.popup.getElement()?.style.removeProperty('visibility');
    active.popup.update();
    active.popup.getElement()?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
  }

  private clearRelocation(): void {
    this.relocationMarker?.remove();
    this.relocationMarker = undefined;
    this.candidate.set(null);
    this.relocating.set(false);
  }

  private mountPopup(popup: L.Popup, component: ComponentRef<LocationPopupComponent | ZonePopupComponent>,
    onClose?: () => void): void {
    const content = component.location.nativeElement as HTMLElement;
    const observer = new ResizeObserver(() => {
      if (this.activePopup?.popup !== popup) return;
      const focused = document.activeElement;
      popup.update();
      if (focused instanceof HTMLElement && content.contains(focused)) {
        focused.focus({ preventScroll: true });
      }
    });
    this.activePopup = { popup, component, observer, onClose };
    component.changeDetectorRef.detectChanges();
    popup.setContent(content).openOn(this.map);
    const popupElement = popup.getElement();
    if (popupElement) {
      // Cancel can detach the popup before Leaflet inspects the click target.
      L.DomEvent.on(popupElement, 'click', L.DomEvent.stopPropagation);
      popupElement.querySelector('.leaflet-popup-close-button')?.setAttribute('aria-label', 'Cerrar ventana');
    }
    observer.observe(content);
  }

  protected toggleZoneDrawing(): void {
    if (this.drawingZone()) {
      this.map.pm.disableDraw();
      return;
    }
    this.map.closePopup();
    this.drawingZone.set(true);
    this.map.pm.enableDraw('Polygon', { allowSelfIntersection: false, snappable: false });
  }

  protected loadZones(): void {
    this.zonesLoading.set(true);
    this.zonesFailed.set(false);
    this.zonesApi.list().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.zonesLoading.set(false)),
    ).subscribe({
      next: zones => {
        for (const zone of zones) this.addZone(zone);
        if (zones.length && !this.locations().length && !this.devicePosition()) {
          const bounds = L.featureGroup([...this.zoneLayers.values()]).getBounds();
          this.map.fitBounds(bounds, { maxZoom: 15, padding: [30, 30] });
        }
      },
      error: () => this.zonesFailed.set(true),
    });
  }

  private addZone(zone: MapZone): void {
    this.zoneLayers.get(zone.id)?.remove();
    const layer = L.geoJSON(zone.area, { style: { color: zone.color, weight: 2, fillOpacity: .24 } })
      .on('click', (event: L.LeafletMouseEvent) => {
        if (this.drawingZone() || this.relocating() || this.zoneEdit()) return;
        L.DomEvent.stopPropagation(event);
        if (!this.busy() && !this.hasZoneDraft()) this.openZonePopup(zone, event.latlng);
      })
      .addTo(this.map);
    this.zoneLayers.set(zone.id, layer);
  }

  private openZoneDraft(layer: L.Polygon): void {
    const area = this.readPolygon(layer);
    if (!area) {
      layer.remove();
      return;
    }

    this.map.closePopup();
    this.hasZoneDraft.set(true);
    const position = layer.getBounds().getCenter();
    const component = this.popupHost().createComponent(ZonePopupComponent);
    const popup = L.popup({ className: 'location-popup', closeOnClick: false }).setLatLng(position);
    component.instance.closed.subscribe(() => this.map.closePopup(popup));
    component.instance.saved.subscribe(name => {
      this.mutate(this.zonesApi.create(name, area), component, zone => {
        this.addZone(zone);
        if (this.activePopup?.component === component) this.openZonePopup(zone, position);
      });
    });
    this.mountPopup(popup, component, () => {
      layer.remove();
      this.hasZoneDraft.set(false);
    });
  }

  private openZonePopup(zone: MapZone, position: L.LatLng): void {
    this.map.closePopup();
    const component = this.popupHost().createComponent(ZonePopupComponent);
    component.setInput('name', zone.name);
    const popup = L.popup({ className: 'location-popup' }).setLatLng(position);
    component.instance.editRequested.subscribe(() => this.startZoneEdit(zone));
    component.instance.removed.subscribe(() => {
      this.mutate(this.zonesApi.delete(zone.id), component, () => {
        this.zoneLayers.get(zone.id)?.remove();
        this.zoneLayers.delete(zone.id);
        if (this.activePopup?.component === component) this.map.closePopup(popup);
      });
    });
    this.mountPopup(popup, component);
  }

  private startZoneEdit(zone: MapZone): void {
    if (this.busy() || this.loading() || this.zoneEdit()) return;
    this.map.closePopup();
    this.zoneLayers.get(zone.id)?.remove();
    const rings = zone.area.coordinates.map(ring => ring.map(([lng, lat]) => L.latLng(lat, lng)));
    const draft = L.polygon(rings, { color: zone.color, weight: 2, fillOpacity: .24 }).addTo(this.map);
    this.zoneEditError.set('');
    this.zoneEdit.set({ zone, draft });
    this.map.fitBounds(draft.getBounds(), { maxZoom: 17, padding: [35, 35] });
    this.enableZoneVertexEditing(draft);
  }

  private enableZoneVertexEditing(draft: L.Polygon): void {
    draft.pm.enable({ allowSelfIntersection: false, snappable: false, removeLayerBelowMinVertexCount: false });
  }

  protected cancelZoneEdit(): void {
    const edit = this.zoneEdit();
    if (!edit || this.busy()) return;
    this.closeZoneEdit(edit.zone);
  }

  protected saveZoneEdit(value: string): void {
    const edit = this.zoneEdit();
    if (!edit || this.busy()) return;
    const name = value.trim();
    if (name.length < 3 || name.length > 80) {
      this.zoneEditError.set('Escribe un nombre de 3 a 80 caracteres.');
      return;
    }
    const area = this.readPolygon(edit.draft);
    if (!area) {
      this.zoneEditError.set('La zona debe conservar un polígono válido.');
      return;
    }

    this.zoneEditError.set('');
    this.busy.set(true);
    edit.draft.pm.disable();
    this.zonesApi.update(edit.zone.id, name, area).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: saved => this.closeZoneEdit(saved),
      error: (error: HttpErrorResponse) => {
        this.zoneEditError.set(error.error?.error?.message ?? 'No se pudo guardar la zona.');
        this.enableZoneVertexEditing(edit.draft);
      },
    });
  }

  private closeZoneEdit(zone: MapZone): void {
    const edit = this.zoneEdit();
    if (!edit) return;
    edit.draft.pm.disable();
    edit.draft.remove();
    this.zoneEdit.set(null);
    this.addZone(zone);
    const center = this.zoneLayers.get(zone.id)?.getBounds().getCenter();
    if (center) this.openZonePopup(zone, center);
  }

  private readPolygon(layer: L.Polygon): Polygon | null {
    const area = layer.toGeoJSON(false).geometry;
    if (area.type !== 'Polygon') return null;
    // MongoDB expects longitudes in [-180, 180], including in repeated world copies.
    return {
      type: 'Polygon',
      coordinates: area.coordinates.map(ring => ring.map(([lng, lat]) => [L.Util.wrapNum(lng, [-180, 180], true), lat])),
    };
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
    const request = record
      ? this.api.update(record.id, data, component.instance.selectedCoordinates() ?? undefined)
      : this.api.create(data, coordinates);
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
      component.setInput('coordinates', saved.location.coordinates);
      component.instance.selectedCoordinates.set(null);
      component.instance.editing.set(false);
      const [longitude, latitude] = saved.location.coordinates;
      this.activePopup.popup.setLatLng([latitude, longitude]);
    });
  }

  private remove(record: MapLocation, component: ComponentRef<LocationPopupComponent>): void {
    this.mutate(this.api.delete(record.id), component, () => {
      if (this.activePopup?.component === component) this.map.closePopup(this.activePopup.popup);
    });
  }

  private mutate<T>(request: Observable<T>, component: ComponentRef<LocationPopupComponent | ZonePopupComponent>,
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
