import type { SearchResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Bounding box al Romaniei (mai strict, exclude Serbia/Bulgaria)
const ROMANIA_BBOX = { minLon: 20.2, minLat: 43.6, maxLon: 30.0, maxLat: 48.3 };

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

// Combina mai multe bounding box-uri intr-unul singur
function mergeBboxes(bboxes: [number, number, number, number][]): [number, number, number, number] {
  if (bboxes.length === 0) return [0, 0, 0, 0];
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

// Verifica daca un bbox se afla in Romania (cel putin partial, strict)
function isStrictlyInRomania(bbox: [number, number, number, number]): boolean {
  const [west, south, east, north] = bbox;
  // Centrul trebuie sa fie in Romania
  const centerLon = (west + east) / 2;
  const centerLat = (south + north) / 2;
  return (
    centerLon > ROMANIA_BBOX.minLon &&
    centerLon < ROMANIA_BBOX.maxLon &&
    centerLat > ROMANIA_BBOX.minLat &&
    centerLat < ROMANIA_BBOX.maxLat
  );
}

// Parseaza boundingbox din Nominatim: [minLat, maxLat, minLon, maxLon] -> [west, south, east, north]
function parseNominatimBbox(boundingbox: string[]): [number, number, number, number] | undefined {
  if (!boundingbox || boundingbox.length < 4) return undefined;
  return [
    parseFloat(boundingbox[2]), // minLon -> west
    parseFloat(boundingbox[0]), // minLat -> south
    parseFloat(boundingbox[3]), // maxLon -> east
    parseFloat(boundingbox[1]), // maxLat -> north
  ];
}

// Cauta toate segmentele unui drum dupa nume folosind Nominatim
async function fetchRoadBboxByName(name: string): Promise<[number, number, number, number] | null> {
  try {
    const params = new URLSearchParams({
      q: `${name}, Romania`,
      format: 'json',
      countrycodes: 'ro',
      namedetails: '1',
      limit: '50',
      dedupe: '0', // fara deduplicare - vrem toate segmentele
    });
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        'Accept-Language': 'ro,en',
        'User-Agent': 'RO-InfraMap/1.0'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const bboxes: [number, number, number, number][] = [];
    for (const item of data) {
      if (item.boundingbox) {
        const bbox = parseNominatimBbox(item.boundingbox);
        if (bbox && isStrictlyInRomania(bbox)) {
          bboxes.push(bbox);
        }
      }
    }
    if (bboxes.length === 0) return null;
    return mergeBboxes(bboxes);
  } catch {
    return null;
  }
}

export async function searchNominatim(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const trimmedQuery = query.trim();
  // Pentru autostrazi si drumuri nationale, adauga "Romania" la query
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
  const rawResults: (SearchResult & { _allBboxes: [number, number, number, number][]; _name: string })[] = data.map(
    (item: any, idx: number) => {
      const bbox = item.boundingbox ? parseNominatimBbox(item.boundingbox) : undefined;
      const name = item.namedetails?.name ?? item.display_name.split(',')[0];
      return {
        id: `${item.osm_id ?? idx}`,
        name,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: classifyType(item.type, item.class),
        bbox,
        _allBboxes: bbox ? [bbox] : [],
        _name: name,
      };
    }
  );

  // Deduplicare: pentru drumuri/autostrazi, grupeaza dupa nume
  const roadTypes = new Set<SearchResult['type']>(['highway', 'road']);
  const nameMap = new Map<string, typeof rawResults[0]>();
  const uniqueResults: typeof rawResults[0][] = [];
  for (const result of rawResults) {
    if (roadTypes.has(result.type)) {
      const key = result.name.toLowerCase();
      if (!nameMap.has(key)) {
        nameMap.set(key, result);
        uniqueResults.push(result);
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

  // Imbunatateste bbox-urile pentru drumuri cu o cautare suplimentara Nominatim
  const SMALL_BBOX_THRESHOLD = 0.3; // grade - mai mic de ~30km
  const enrichPromises = uniqueResults.map(async result => {
    if (roadTypes.has(result.type)) {
      // Combina bbox-urile din rezultatele initiale
      if (result._allBboxes.length > 0) {
        result.bbox = mergeBboxes(result._allBboxes);
      }
      // Daca bbox-ul e mic sau absent, cauta segmentele complete ale drumului
      const bbox = result.bbox;
      const bboxWidth = bbox ? bbox[2] - bbox[0] : 0;
      const bboxHeight = bbox ? bbox[3] - bbox[1] : 0;
      if (!bbox || bboxWidth < SMALL_BBOX_THRESHOLD || bboxHeight < SMALL_BBOX_THRESHOLD) {
        const fullBbox = await fetchRoadBboxByName(result._name);
        if (fullBbox) {
          result.bbox = fullBbox;
        }
      }
    }
    // Sterge campurile temporare
    const { _allBboxes, _name, ...cleanResult } = result;
    return cleanResult as SearchResult;
  });

  const finalResults = await Promise.all(enrichPromises);
  return finalResults.slice(0, 15);
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
