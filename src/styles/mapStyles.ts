import type { StyleSpecification } from 'maplibre-gl';

export const BASIC_STYLE: StyleSpecification = {
  version: 8,
  name: 'RO Infra Basic',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#1a2332' },
    },
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      paint: {
        'raster-opacity': 0.85,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.6,
        'raster-saturation': -0.3,
        'raster-contrast': 0.1,
        'raster-hue-rotate': 200,
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
  ],
};

export const ROMANIA_CENTER: [number, number] = [24.96, 45.94];
export const ROMANIA_ZOOM = 6.5;
export const ROMANIA_BOUNDS: [[number, number], [number, number]] = [
  [20.26, 43.62],
  [29.72, 48.27],
];
