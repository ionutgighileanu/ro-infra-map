import { create } from 'zustand';
import type { MapState, Route, SearchResult, Waypoint, MapType, LabelSettings, BorderSettings } from '../types';

const DEFAULT_ROUTE_COLORS = [
  '#E53935', '#8E24AA', '#1E88E5', '#00ACC1',
  '#43A047', '#FB8C00', '#F4511E', '#6D4C41',
];

let routeCounter = 0;

interface MapActions {
  setMapType: (type: MapType) => void;
  setLabels: (labels: Partial<LabelSettings>) => void;
  setBorder: (border: Partial<BorderSettings>) => void;
  setSidebarOpen: (open: boolean) => void;

  // Routes
  addRoute: () => void;
  removeRoute: (id: string) => void;
  setActiveRoute: (id: string | null) => void;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  addWaypoint: (routeId: string, waypoint: Waypoint) => void;
  removeWaypoint: (routeId: string, waypointId: string) => void;
  reorderWaypoints: (routeId: string, waypoints: Waypoint[]) => void;
  setRouteGeometry: (routeId: string, geometry: GeoJSON.LineString | null, distance: number | null, duration: number | null) => void;

  // Search
  setSearchQuery: (q: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setHighlightedFeature: (feature: SearchResult | null) => void;
}

const initialState: MapState = {
  mapType: 'basic',
  labels: { cities: true, counties: true, villages: false, roads: true },
  border: { visible: true, color: '#1565C0', width: 2 },
  routes: [],
  activeRouteId: null,
  sidebarOpen: true,
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  highlightedFeature: null,
};

export const useMapStore = create<MapState & MapActions>((set) => ({
  ...initialState,

  setMapType: (mapType) => set({ mapType }),

  setLabels: (labels) => set((state) => ({
    labels: { ...state.labels, ...labels }
  })),

  setBorder: (border) => set((state) => ({
    border: { ...state.border, ...border }
  })),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  addRoute: () => set((state) => {
    const color = DEFAULT_ROUTE_COLORS[routeCounter % DEFAULT_ROUTE_COLORS.length];
    routeCounter++;
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name: `Traseu ${state.routes.length + 1}`,
      color,
      waypoints: [],
      geometry: null,
      distance: null,
      duration: null,
    };
    return { routes: [...state.routes, newRoute], activeRouteId: newRoute.id };
  }),

  removeRoute: (id) => set((state) => ({
    routes: state.routes.filter(r => r.id !== id),
    activeRouteId: state.activeRouteId === id
      ? (state.routes.find(r => r.id !== id)?.id ?? null)
      : state.activeRouteId,
  })),

  setActiveRoute: (activeRouteId) => set({ activeRouteId }),

  updateRoute: (id, updates) => set((state) => ({
    routes: state.routes.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  addWaypoint: (routeId, waypoint) => set((state) => ({
    routes: state.routes.map(r =>
      r.id === routeId ? { ...r, waypoints: [...r.waypoints, waypoint] } : r
    )
  })),

  removeWaypoint: (routeId, waypointId) => set((state) => ({
    routes: state.routes.map(r =>
      r.id === routeId
        ? { ...r, waypoints: r.waypoints.filter(w => w.id !== waypointId), geometry: null, distance: null, duration: null }
        : r
    )
  })),

  reorderWaypoints: (routeId, waypoints) => set((state) => ({
    routes: state.routes.map(r =>
      r.id === routeId ? { ...r, waypoints, geometry: null, distance: null, duration: null } : r
    )
  })),

  setRouteGeometry: (routeId, geometry, distance, duration) => set((state) => ({
    routes: state.routes.map(r =>
      r.id === routeId ? { ...r, geometry, distance, duration } : r
    )
  })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchLoading: (searchLoading) => set({ searchLoading }),
  setHighlightedFeature: (highlightedFeature) => set({ highlightedFeature }),
}));
