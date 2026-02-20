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

// Detecteaza daca query-ul pare a fi un cod de autostrada/drum national
function isRoadQuery(query: string): boolean {
  return /^(a\d+|dn\d+|dj\d+|dc\d+|autostrada|drum\s+national)/i.test(query.trim());
}

// Combina mai multe bounding box-uri intr-unul singur care le cuprinde pe toate
function mergeBboxes(bboxes: [number, number, number, number][]): [number, number, number, number] {
  return bboxes.reduce(
    ([west, south, east, north], [w, s, e, n]) => [
      Math.min(west, w),
      Math.min(south, s),
      Math.max(east, e),
      Math.max(north, n),
    ],
    [Infinity, Infinity, -Infinity, -Infinity] as [number, number, number, number]
  );
}

export async function searchNominatim(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const trimmedQuery = query.trim();

  // Pentru autostrazi si drumuri nationale, adauga "Romania" la query pentru precizie mai buna
  const searchQuery = isRoadQuery(trimmedQuery) ? `${trimmedQuery}, Romania` : trimmedQuery;

  const params = new URLSearchParams({
    q: searchQuery,
    format: 'json',
    countrycodes: 'ro',
    addressdetails: '1',
    namedetails: '1',
    limit: '50',
    dedupe: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      'Accept-Language': 'ro,en',
      'User-Agent': 'RO-InfraMap/1.0'
    }
  });

  if (!res.ok) throw new Error('Nominatim request failed');

  const data = await res.json();

  // Mapeaza fiecare rezultat la SearchResult
  const rawResults: SearchResult[] = data.map((item: any, idx: number): SearchResult => {
    // Nominatim boundingbox: [lat_min, lat_max, lon_min, lon_max]
    const bbox = item.boundingbox ? [
      parseFloat(item.boundingbox[2]), // west (lon_min)
      parseFloat(item.boundingbox[0]), // south (lat_min)
      parseFloat(item.boundingbox[3]), // east (lon_max)
      parseFloat(item.boundingbox[1]), // north (lat_max)
    ] as [number, number, number, number] : undefined;

    return {
      id: `${item.osm_id ?? idx}`,
      name: item.namedetails?.name ?? item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: classifyType(item.type, item.class),
      bbox,
    };
  });

  // Deduplicare: pentru drumuri/autostrazi, grupeaza dupa nume si combina bbox-urile
  const roadTypes = new Set<SearchResult['type']>(['highway', 'road']);
  const nameMap = new Map<string, SearchResult & { _allBboxes: [number, number, number, number][] }>();

  const uniqueResults: SearchResult[] = [];

  for (const result of rawResults) {
    if (roadTypes.has(result.type)) {
      const key = result.name.toLowerCase();
      if (!nameMap.has(key)) {
        const entry = {
          ...result,
          _allBboxes: result.bbox ? [result.bbox] : [],
        };
        nameMap.set(key, entry);
        uniqueResults.push(entry);
      } else {
        const existing = nameMap.get(key)!;
        if (result.bbox) {
          existing._allBboxes.push(result.bbox);
        }
      }
    } else {
      uniqueResults.push(result);
    }
  }

  // Aplica bbox-ul combinat pentru fiecare drum
  for (const result of uniqueResults) {
    if (roadTypes.has(result.type)) {
      const entry = result as SearchResult & { _allBboxes?: [number, number, number, number][] };
      if (entry._allBboxes && entry._allBboxes.length > 0) {
        result.bbox = mergeBboxes(entry._allBboxes);
        delete (entry as any)._allBboxes;
      }
    }
  }

  return uniqueResults.slice(0, 15);
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
