import type { StyleSpecification } from 'maplibre-gl';

// Layer IDs pentru labels overlay - pot fi toggleate independent
export const LABELS_LAYER_ID = 'labels-overlay';
export const SATELLITE_LABELS_LAYER_ID = 'satellite-labels-overlay';

export const BASIC_STYLE: StyleSpecification = {
  version: 8,
  name: 'RO Infra Basic',
  sources: {
    // Harta de baza fara labels (CartoDB Positron No Labels)
    'carto-base': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 19,
    },
    // Labels overlay - poate fi toggleat (CartoDB Only Labels)
    'carto-labels': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f0f0f0' },
    },
    {
      id: 'carto-base-layer',
      type: 'raster',
      source: 'carto-base',
      paint: {
        'raster-opacity': 1,
      },
    },
    {
      id: LABELS_LAYER_ID,
      type: 'raster',
      source: 'carto-labels',
      paint: {
        'raster-opacity': 1,
      },
      layout: {
        visibility: 'visible',
      },
    },
  ],
};

export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  name: 'RO Infra Satellite',
  sources: {
    'esri-sat': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    // Labels overlay pentru satelit (CartoDB Dark Only Labels)
    'carto-labels-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0a0e1a' },
    },
    {
      id: 'esri-sat',
      type: 'raster',
      source: 'esri-sat',
      paint: { 'raster-opacity': 1 },
    },
    {
      id: SATELLITE_LABELS_LAYER_ID,
      type: 'raster',
      source: 'carto-labels-dark',
      paint: {
        'raster-opacity': 0.9,
      },
      layout: {
        visibility: 'visible',
      },
    },
  ],
};

export const ROMANIA_CENTER: [number, number] = [24.96, 45.94];
export const ROMANIA_ZOOM = 6.5;
export const ROMANIA_BOUNDS: [[number, number], [number, number]] = [
  [20.26, 43.62],
  [29.72, 48.27],
];
