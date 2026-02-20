import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/mapStore';
import {
  BASIC_STYLE,
  SATELLITE_STYLE,
  ROMANIA_CENTER,
  ROMANIA_ZOOM,
  LABELS_LAYER_ID,
  SATELLITE_LABELS_LAYER_ID,
} from '../../styles/mapStyles';
import romaniaBorder from '../../data/romaniaBorder';
import type { Route, SearchResult } from '../../types';

const BORDER_SOURCE = 'romania-border';
const BORDER_FILL_LAYER = 'romania-border-fill';
const BORDER_LINE_LAYER = 'romania-border-line';

// Determina care layer ID de labels e activ pentru stilul curent
function getLabelsLayerId(mapType: string) {
  return mapType === 'satellite' ? SATELLITE_LABELS_LAYER_ID : LABELS_LAYER_ID;
}

// Determina zoom-ul maxim potrivit in functie de tipul rezultatului selectat
function getMaxZoomForType(type: SearchResult['type']): number {
  switch (type) {
    case 'highway': return 11;  // autostrada - arata traseul complet
    case 'road':    return 12;  // drum national
    case 'street':  return 15;  // strada
    case 'city':    return 13;  // localitate
    default:        return 14;
  }
}

export function useMapInstance() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    mapType,
    labels,
    border,
    routes,
    highlightedFeature,
  } = useMapStore();

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    const style = mapType === 'satellite' ? SATELLITE_STYLE : BASIC_STYLE;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: ROMANIA_CENTER,
      zoom: ROMANIA_ZOOM,
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      // Romania border source
      map.addSource(BORDER_SOURCE, {
        type: 'geojson',
        data: romaniaBorder,
      });
      map.addLayer({
        id: BORDER_FILL_LAYER,
        type: 'fill',
        source: BORDER_SOURCE,
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 0,
        },
      });
      map.addLayer({
        id: BORDER_LINE_LAYER,
        type: 'line',
        source: BORDER_SOURCE,
        paint: {
          'line-color': border.color,
          'line-width': border.width,
          'line-opacity': border.visible ? 1 : 0,
        },
        layout: { visibility: 'visible' },
      });

      // Aplica starea curenta a labels dupa load
      const labelsLayerId = getLabelsLayerId(mapType);
      if (map.getLayer(labelsLayerId)) {
        const hasAnyLabel = labels.cities || labels.counties || labels.villages || labels.roads;
        map.setLayoutProperty(labelsLayerId, 'visibility', hasAnyLabel ? 'visible' : 'none');
      }
    });

    mapRef.current = map;
    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map type (style)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = mapType === 'satellite' ? SATELLITE_STYLE : BASIC_STYLE;
    map.setStyle(style);
    map.once('styledata', () => {
      // Re-add border layer after style change
      if (!map.getSource(BORDER_SOURCE)) {
        map.addSource(BORDER_SOURCE, { type: 'geojson', data: romaniaBorder });
      }
      if (!map.getLayer(BORDER_FILL_LAYER)) {
        map.addLayer({
          id: BORDER_FILL_LAYER,
          type: 'fill',
          source: BORDER_SOURCE,
          paint: { 'fill-color': 'transparent', 'fill-opacity': 0 },
        });
      }
      if (!map.getLayer(BORDER_LINE_LAYER)) {
        map.addLayer({
          id: BORDER_LINE_LAYER,
          type: 'line',
          source: BORDER_SOURCE,
          paint: {
            'line-color': border.color,
            'line-width': border.width,
            'line-opacity': border.visible ? 1 : 0,
          },
        });
      }
      // Re-aplica labels visibility dupa style change
      const labelsLayerId = getLabelsLayerId(mapType);
      if (map.getLayer(labelsLayerId)) {
        const hasAnyLabel = labels.cities || labels.counties || labels.villages || labels.roads;
        map.setLayoutProperty(labelsLayerId, 'visibility', hasAnyLabel ? 'visible' : 'none');
      }
      // Re-add routes after style change
      routes.forEach(route => addRouteLayer(map, route));
    });
  }, [mapType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update border
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(BORDER_LINE_LAYER)) return;
    map.setPaintProperty(BORDER_LINE_LAYER, 'line-color', border.color);
    map.setPaintProperty(BORDER_LINE_LAYER, 'line-width', border.width);
    map.setPaintProperty(BORDER_LINE_LAYER, 'line-opacity', border.visible ? 1 : 0);
  }, [border]);

  // Update labels visibility - toggle overlay layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const labelsLayerId = getLabelsLayerId(mapType);
    if (!map.getLayer(labelsLayerId)) return;
    // Daca oricare label e activ, aratam overlay-ul; altfel il ascundem
    const hasAnyLabel = labels.cities || labels.counties || labels.villages || labels.roads;
    map.setLayoutProperty(labelsLayerId, 'visibility', hasAnyLabel ? 'visible' : 'none');
  }, [labels, mapType]);

  // Manage route layers (fara markeri)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncRouteLayers(map, routes);
  }, [routes]);

  // Fly to highlighted feature
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !highlightedFeature) return;

    const maxZoom = getMaxZoomForType(highlightedFeature.type);

    if (highlightedFeature.bbox) {
      map.fitBounds(
        [[highlightedFeature.bbox[0], highlightedFeature.bbox[1]],
         [highlightedFeature.bbox[2], highlightedFeature.bbox[3]]],
        { padding: 80, maxZoom, duration: 1200 }
      );
    } else {
      map.flyTo({
        center: [highlightedFeature.lng, highlightedFeature.lat],
        zoom: Math.min(maxZoom, 14),
        duration: 1200,
      });
    }
  }, [highlightedFeature]);

  return { containerRef, mapRef, initMap };
}

function addRouteLayer(map: maplibregl.Map, route: Route) {
  if (!route.geometry) return;
  const sourceId = `route-${route.id}`;
  const layerId = `route-line-${route.id}`;
  const casingId = `route-casing-${route.id}`;

  if (map.getSource(sourceId)) {
    (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: route.geometry,
    });
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: route.geometry },
    });
    // Casing (outline)
    map.addLayer({
      id: casingId,
      type: 'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#000000',
        'line-width': 8,
        'line-opacity': 0.4,
      },
    });
    // Main route line
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': route.color,
        'line-width': 5,
        'line-opacity': 0.95,
      },
    });
  }
}

function syncRouteLayers(map: maplibregl.Map, routes: Route[]) {
  // Add/update route layers (fara markeri - doar linia)
  routes.forEach(route => {
    if (route.geometry) {
      addRouteLayer(map, route);
    }
    // Update paint properties for color changes
    const layerId = `route-line-${route.id}`;
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-color', route.color);
    }
  });

  // Remove layers for deleted routes
  const validRouteIds = new Set(routes.map(r => r.id));
  const styleLayers = map.getStyle().layers ?? [];
  styleLayers.forEach(layer => {
    const match = layer.id.match(/^route-(line|casing)-(.+)$/);
    if (match && !validRouteIds.has(match[2])) {
      map.removeLayer(layer.id);
    }
  });

  const styleSources = map.getStyle().sources ?? {};
  Object.keys(styleSources).forEach(sourceId => {
    const match = sourceId.match(/^route-(.+)$/);
    if (match && !validRouteIds.has(match[1])) {
      try { map.removeSource(sourceId); } catch { /* ignore */ }
    }
  });
}
