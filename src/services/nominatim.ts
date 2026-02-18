import type { SearchResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

const OSM_TYPE_MAP: Record<string, SearchResult['type']> = {
  motorway: 'highway',
  trunk: 'highway',
  primary: 'road',
  secondary: 'road',
  tertiary: 'road',
  residential: 'street',
  living_street: 'street',
  city: 'city',
  town: 'city',
  village: 'city',
};

function classifyType(osmType: string, osmClass: string): SearchResult['type'] {
  if (osmClass === 'highway') {
    return OSM_TYPE_MAP[osmType] ?? 'road';
  }
  if (osmClass === 'place') {
    return OSM_TYPE_MAP[osmType] ?? 'city';
  }
  return 'other';
}

export async function searchNominatim(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: 'ro',
    addressdetails: '1',
    limit: '12',
    dedupe: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'Accept-Language': 'ro,en', 'User-Agent': 'RO-InfraMap/1.0' }
  });

  if (!res.ok) throw new Error('Nominatim request failed');
  const data = await res.json();

  return data.map((item: any, idx: number): SearchResult => ({
    id: `${item.osm_id ?? idx}`,
    name: item.namedetails?.name ?? item.display_name.split(',')[0],
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: classifyType(item.type, item.class),
    bbox: item.boundingbox
      ? [
          parseFloat(item.boundingbox[2]),
          parseFloat(item.boundingbox[0]),
          parseFloat(item.boundingbox[3]),
          parseFloat(item.boundingbox[1]),
        ]
      : undefined,
  }));
}

export async function fetchRoute(waypoints: { lat: number; lng: number }[]): Promise<{
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
} | null> {
  if (waypoints.length < 2) return null;

  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.routes?.length) return null;

  const route = data.routes[0];
  return {
    geometry: route.geometry,
    distance: Math.round(route.distance / 1000 * 10) / 10,
    duration: Math.round(route.duration / 60),
  };
}
