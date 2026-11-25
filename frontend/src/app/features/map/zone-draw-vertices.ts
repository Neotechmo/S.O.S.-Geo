import type * as L from 'leaflet';

interface GeomanPolygonDraft {
  _markers: L.Marker[];
  _layer: L.Polyline & { _latlngInfo: unknown[] };
  _layerGroup: L.LayerGroup;
  _syncHintLine(): void;
  _setTooltipText(): void;
}

export function enableDraftVertexRemoval(map: L.Map): void {
  map.on('pm:drawstart', ({ shape, workingLayer }) => {
    if (shape !== 'Polygon') return;
    workingLayer.on('pm:vertexadded', ({ marker }) => {
      // Geoman only supports undoing the last vertex in its drawing toolbar.
      // Keep its temporary markers, path and metadata aligned when removing any other vertex.
      const draft = map.pm.Draw.Polygon as unknown as GeomanPolygonDraft;
      if (draft._markers.indexOf(marker) <= 0) return;
      marker.getElement()?.setAttribute('aria-label', 'Quitar vértice');
      marker.on('click', () => removeVertex(draft, marker));
    });
  });
}

function removeVertex(draft: GeomanPolygonDraft, marker: L.Marker): void {
  const index = draft._markers.indexOf(marker);
  if (index <= 0) return; // The first vertex closes the polygon.
  const coordinates = draft._layer.getLatLngs() as L.LatLng[];
  coordinates.splice(index, 1);
  draft._layer.setLatLngs(coordinates);
  draft._layer._latlngInfo.splice(index, 1);
  draft._markers.splice(index, 1);
  draft._layerGroup.removeLayer(marker);
  draft._syncHintLine();
  draft._setTooltipText();
}
