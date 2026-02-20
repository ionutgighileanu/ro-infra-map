import type { SearchResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

// Bounding box aproximativ al Romaniei: [minLat, minLon, maxLat, maxLon]
const ROMANIA_BBOX = { minLon: 20.0, minLat: 43.5, maxLon: 30.5, maxLat: 48.5 };

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

// Calculeaza aria unui bbox
function bboxArea(bbox: [number, number, number, number]): number {
  return (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
}

// Verifica daca un bbox se suprapune cu Romania (cel putin partial)
function isInRomania(bbox: [number, number, number, number]): boolean {
  const [west, south, east, north] = bbox;
  return (
    east > ROMANIA_BBOX.minLon &&
    west < ROMANIA_BBOX.maxLon &&
    north > ROMANIA_BBOX.minLat &&
    south < ROMANIA_BBOX.maxLat
  );
}

// Interogheaza Overpass API pentru bbox-ul complet al unui drum in Romania
async function fetchRoadBboxFromOverpass(ref: string): Promise<[number, number, number, number] | null> {
  try {
    // Utilizeaza bbox-ul Romaniei ca filtru global pentru a evita rezultate din alte tari
    const query = `[out:json][timeout:15][bbox:${ROMANIA_BBOX.minLat},${ROMANIA_BBOX.minLon},${ROMANIA_BBOX.maxLat},${ROMANIA_BBOX.maxLon}];
(
  way["ref"="${ref}"]["highway"~"motorway|trunk|primary|secondary"];
  relation["ref"="${ref}"]["route"="road"];
);
out bb;`;

    const res = await fetch(OVERPASS_BASE, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    });

    if (!res.ok) return null;
    const data = await res.json();

    const bboxes: [number, number, number, number][] = [];
    for (const el of data.elements ?? []) {
      if (el.bounds) {
        const b: [number, number, number, number] = [
          el.bounds.minlon,
          el.bounds.minlat,
          el.bounds.maxlon,
          el.bounds.maxlat,
        ];
        if (isInRomania(b)) {
          bboxes.push(b);
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
  const rawResults: (SearchResult & { _allBboxes: [number, number, number, number][]; _ref?: string })[] = data.map(
    (item: any, idx: number) => {
      const bbox = item.boundingbox ? [
        parseFloat(item.boundingbox[2]),
        parseFloat(item.boundingbox[0]),
        parseFloat(item.boundingbox[3]),
        parseFloat(item.boundingbox[1]),
      ] as [number, number, number, number] : undefined;

      return {
        id: `${item.osm_id ?? idx}`,
        name: item.namedetails?.name ?? item.display_name.split(',')[0],
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: classifyType(item.type, item.class),
        bbox,
        _allBboxes: bbox ? [bbox] : [],
        _ref: item.namedetails?.ref,
      };
    }
  );

  // Deduplicare: pentru drumuri/autostrazi, grupeaza dupa nume si combina bbox-urile
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
        if (!existing._ref && result._ref) {
          existing._ref = result._ref;
        }
      }
    } else {
      uniqueResults.push(result);
    }
  }

  // Aplica bbox-ul combinat si imbunatatit cu Overpass pentru drumuri
  const SMALL_BBOX_THRESHOLD = 0.05; // grade - mai mic de ~5km

  const overpassPromises = uniqueResults.map(async result => {
    if (roadTypes.has(result.type)) {
      // Combina bbox-urile din Nominatim
      if (result._allBboxes.length > 0) {
        result.bbox = mergeBboxes(result._allBboxes);
      }

      // Daca bbox-ul combinat e inca mic sau nu exista, incearca Overpass
      const bboxIsSmall = !result.bbox ||
        (result.bbox[2] - result.bbox[0]) < SMALL_BBOX_THRESHOLD ||
        (result.bbox[3] - result.bbox[1]) < SMALL_BBOX_THRESHOLD;

      if (bboxIsSmall && result._ref) {
        const overpassBbox = await fetchRoadBboxFromOverpass(result._ref);
        if (overpassBbox && bboxArea(overpassBbox) > 0) {
          result.bbox = overpassBbox;
        }
      }
    }

    // Sterge campurile temporare
    const { _allBboxes, _ref, ...cleanResult } = result;
    return cleanResult as SearchResult;
  });

  const finalResults = await Promise.all(overpassPromises);
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
