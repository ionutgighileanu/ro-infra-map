export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  waypoints: Waypoint[];
  geometry: GeoJSON.LineString | null;
  distance: number | null; // km
  duration: number | null; // minutes
}

export interface SearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: 'highway' | 'road' | 'street' | 'city' | 'other';
  bbox?: [number, number, number, number];
}

export type MapType = 'basic' | 'satellite';

export interface LabelSettings {
  cities: boolean;
  counties: boolean;
  villages: boolean;
  roads: boolean;
}

export interface BorderSettings {
  visible: boolean;
  color: string;
  width: number;
}

export interface MapState {
  mapType: MapType;
  labels: LabelSettings;
  border: BorderSettings;
  routes: Route[];
  activeRouteId: string | null;
  sidebarOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  highlightedFeature: SearchResult | null;
}
