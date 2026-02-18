import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/mapStore';
import { BASIC_STYLE, SATELLITE_STYLE, ROMANIA_CENTER, ROMANIA_ZOOM } from '../../styles/mapStyles';
import romaniaBorder from '../../data/romaniaBorder';
import type { Route } from '../../types';

const BORDER_SOURCE = 'romania-border';
const BORDER_FILL_LAYER = 'romania-border-fill';
const BORDER_LINE_LAYER = 'romania-border-line';

export function useMapInstance() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

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
          'line-color': '#1565C0',
          'line-width': 2,
          'line-opacity': 1,
          'line-dasharray': [1, 0],
        },
        layout: { visibility: 'visible' },
      });
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

  // Update labels visibility via raster tile opacity trick + overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // For raster tiles we control label visibility via a Maplibre overlay source
    // In a real vector tiles implementation, you'd toggle specific layers
    // Here we add/remove a label overlay source
    const hasAnyLabel = labels.cities || labels.counties || labels.villages || labels.roads;

    if (map.getLayer('osm-tiles')) {
      map.setPaintProperty('osm-tiles', 'raster-opacity', hasAnyLabel ? 0.85 : 0.95);
    }
    if (map.getLayer('esri-sat')) {
      // satellite - labels via separate layer
    }
  }, [labels]);

  // Manage route layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncRouteLayers(map, routes, markersRef.current);
  }, [routes]);

  // Fly to highlighted feature
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !highlightedFeature) return;
    if (highlightedFeature.bbox) {
      map.fitBounds(
        [[highlightedFeature.bbox[0], highlightedFeature.bbox[1]], [highlightedFeature.bbox[2], highlightedFeature.bbox[3]]],
        { padding: 80, maxZoom: 16, duration: 1200 }
      );
    } else {
      map.flyTo({ center: [highlightedFeature.lng, highlightedFeature.lat], zoom: 14, duration: 1200 });
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

function syncRouteLayers(map: maplibregl.Map, routes: Route[], markers: Map<string, maplibregl.Marker>) {
  // Add/update route layers
  routes.forEach(route => {
    if (route.geometry) {
      addRouteLayer(map, route);
    }

    // Update paint properties for color changes
    const layerId = `route-line-${route.id}`;
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-color', route.color);
    }

    // Add waypoint markers
    route.waypoints.forEach((wp, idx) => {
      const markerId = `${route.id}-${wp.id}`;
      if (!markers.has(markerId)) {
        const el = createMarkerElement(idx === 0 ? 'A' : idx === route.waypoints.length - 1 ? 'B' : `${idx}`, route.color);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([wp.lng, wp.lat])
          .setPopup(new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
            `<div style="font-family: sans-serif; font-size: 13px; padding: 2px 4px; color: #1a1a2e"><strong>${wp.name}</strong></div>`
          ))
          .addTo(map);
        markers.set(markerId, marker);
      }
    });
  });

  // Remove markers for deleted routes/waypoints
  const validIds = new Set(
    routes.flatMap(r => r.waypoints.map(w => `${r.id}-${w.id}`))
  );
  markers.forEach((marker, id) => {
    if (!validIds.has(id)) {
      marker.remove();
      markers.delete(id);
    }
  });

  // Remove layers for deleted routes
  const validRouteIds = new Set(routes.map(r => r.id));
  // Get all style layers and remove orphaned route layers
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

function createMarkerElement(label: string, color: string): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg); background: ${color};
    border: 2.5px solid rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    cursor: pointer;
  `;
  const inner = document.createElement('div');
  inner.style.cssText = `
    transform: rotate(45deg); color: white;
    font-family: sans-serif; font-size: 10px; font-weight: 700;
    line-height: 1;
  `;
  inner.textContent = label;
  el.appendChild(inner);
  return el;
}
