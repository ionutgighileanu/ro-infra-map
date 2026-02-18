import { useState, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, TextField, List, ListItem,
  ListItemText, Chip, CircularProgress,
  Autocomplete, Stack, Paper, Avatar,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsIcon from '@mui/icons-material/Directions';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import TimerIcon from '@mui/icons-material/Timer';
import StraightenIcon from '@mui/icons-material/Straighten';
import CloseIcon from '@mui/icons-material/Close';
import { useMapStore } from '../../stores/mapStore';
import { searchNominatim, fetchRoute } from '../../services/nominatim';
import { ColorPicker } from './ColorPicker';
import type { Waypoint } from '../../types';

let wpCounter = 0;

export default function RouteBuilder() {
  const {
    routes, activeRouteId, addRoute, removeRoute, setActiveRoute,
    updateRoute, addWaypoint, removeWaypoint, setRouteGeometry,
  } = useMapStore();

  const [routing, setRouting] = useState<string | null>(null);
  const [wpSearch, setWpSearch] = useState<Record<string, string>>({});
  const [wpOptions, setWpOptions] = useState<Record<string, any[]>>({});
  const [wpLoading, setWpLoading] = useState<Record<string, boolean>>({});

  const activeRoute = routes.find(r => r.id === activeRouteId);

  const handleSearchWaypoint = useCallback(async (routeId: string, q: string) => {
    setWpSearch(s => ({ ...s, [routeId]: q }));
    if (q.length < 2) { setWpOptions(o => ({ ...o, [routeId]: [] })); return; }
    setWpLoading(l => ({ ...l, [routeId]: true }));
    try {
      const results = await searchNominatim(q);
      setWpOptions(o => ({ ...o, [routeId]: results }));
    } finally {
      setWpLoading(l => ({ ...l, [routeId]: false }));
    }
  }, []);

  const handleAddWaypoint = (routeId: string, option: any) => {
    if (!option) return;
    const wp: Waypoint = { id: `wp-${++wpCounter}`, name: option.name, lat: option.lat, lng: option.lng };
    addWaypoint(routeId, wp);
    setWpOptions(o => ({ ...o, [routeId]: [] }));
    setWpSearch(s => ({ ...s, [routeId]: '' }));
  };

  const handleCalculateRoute = async (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route || route.waypoints.length < 2) return;
    setRouting(routeId);
    try {
      const result = await fetchRoute(route.waypoints);
      if (result) {
        setRouteGeometry(routeId, result.geometry, result.distance, result.duration);
      }
    } finally {
      setRouting(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Route Tabs */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {routes.map(route => (
          <Chip
            key={route.id}
            label={route.name}
            onClick={() => setActiveRoute(route.id)}
            onDelete={() => removeRoute(route.id)}
            deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              bgcolor: activeRouteId === route.id ? `${route.color}25` : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${activeRouteId === route.id ? route.color : 'transparent'}`,
              color: activeRouteId === route.id ? route.color : '#8B9BB4',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: `${route.color}15` },
              '& .MuiChip-deleteIcon': {
                color: activeRouteId === route.id ? route.color : '#8B9BB4',
              },
            }}
          />
        ))}
        <Chip
          icon={<AddRoadIcon sx={{ fontSize: '14px !important' }} />}
          label="Traseu nou"
          onClick={addRoute}
          variant="outlined"
          sx={{
            borderColor: 'rgba(79, 195, 247, 0.4)',
            color: '#4FC3F7',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 28,
            '&:hover': { bgcolor: 'rgba(79, 195, 247, 0.08)', borderColor: '#4FC3F7' },
          }}
        />
      </Box>

      {activeRoute ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Route header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              value={activeRoute.name}
              onChange={e => updateRoute(activeRoute.id, { name: e.target.value })}
              sx={{ flex: 1, '& input': { fontSize: '0.85rem', fontWeight: 600 } }}
            />
            <ColorPicker
              color={activeRoute.color}
              onChange={color => updateRoute(activeRoute.id, { color })}
            />
          </Box>

          {/* Waypoints */}
          <Box>
            <Typography variant="caption" sx={{ color: '#8B9BB4', mb: 0.5, display: 'block' }}>
              PUNCTE DE TRECERE ({activeRoute.waypoints.length})
            </Typography>

            {activeRoute.waypoints.length > 0 && (
              <List dense disablePadding sx={{ mb: 1 }}>
                {activeRoute.waypoints.map((wp, idx) => (
                  <ListItem
                    key={wp.id}
                    disableGutters
                    sx={{
                      py: 0.5, px: 1, mb: 0.5,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      borderRadius: 1.5,
                      border: '1px solid rgba(255,255,255,0.05)',
                      gap: 1,
                    }}
                    secondaryAction={
                      <IconButton size="small" onClick={() => removeWaypoint(activeRoute.id, wp.id)}>
                        <DeleteIcon sx={{ fontSize: 14, color: '#EF5350' }} />
                      </IconButton>
                    }
                  >
                    <DragIndicatorIcon sx={{ fontSize: 14, color: '#444', cursor: 'grab' }} />
                    <Avatar
                      sx={{
                        width: 22, height: 22, fontSize: '0.65rem', fontWeight: 800,
                        bgcolor: activeRoute.color, color: '#fff',
                      }}
                    >
                      {idx === 0 ? 'A' : idx === activeRoute.waypoints.length - 1 ? 'B' : idx}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#E8EDF4' }}>
                          {wp.name}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {/* Add waypoint */}
            <Autocomplete
              size="small"
              options={wpOptions[activeRoute.id] ?? []}
              getOptionLabel={(o: any) => o.name ?? ''}
              filterOptions={x => x}
              loading={wpLoading[activeRoute.id]}
              inputValue={wpSearch[activeRoute.id] ?? ''}
              onInputChange={(_, v) => handleSearchWaypoint(activeRoute.id, v)}
              onChange={(_, v) => handleAddWaypoint(activeRoute.id, v)}
              noOptionsText="Caută un oraș, localitate..."
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Adaugă punct de trecere..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <AddCircleIcon sx={{ fontSize: 16, color: '#4FC3F7', mr: 0.5 }} />,
                    endAdornment: wpLoading[activeRoute.id]
                      ? <CircularProgress size={14} sx={{ color: '#4FC3F7' }} />
                      : null,
                  }}
                  sx={{ '& input': { fontSize: '0.82rem' } }}
                />
              )}
              renderOption={(props, option: any) => (
                <Box component="li" {...props} sx={{ fontSize: '0.8rem', py: '6px !important' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{option.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#8B9BB4', fontSize: '0.7rem' }} noWrap>{option.displayName}</Typography>
                  </Box>
                </Box>
              )}
              PaperComponent={({ children }) => (
                <Paper sx={{
                  bgcolor: 'rgba(15, 20, 35, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  mt: 0.5,
                }}>
                  {children}
                </Paper>
              )}
            />
          </Box>

          {/* Calculate button */}
          <Button
            variant="contained"
            startIcon={routing === activeRoute.id ? <CircularProgress size={14} color="inherit" /> : <DirectionsIcon />}
            onClick={() => handleCalculateRoute(activeRoute.id)}
            disabled={activeRoute.waypoints.length < 2 || routing === activeRoute.id}
            fullWidth
            sx={{
              bgcolor: activeRoute.color,
              color: '#fff',
              '&:hover': { bgcolor: activeRoute.color, filter: 'brightness(1.15)' },
              '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: '#8B9BB4' },
              fontWeight: 700,
              py: 0.75,
              fontSize: '0.82rem',
            }}
          >
            {routing === activeRoute.id ? 'Se calculează...' : 'Calculează Traseu'}
          </Button>

          {/* Route stats */}
          {activeRoute.distance !== null && (
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<StraightenIcon sx={{ fontSize: '14px !important', color: `${activeRoute.color} !important` }} />}
                label={`${activeRoute.distance} km`}
                size="small"
                sx={{ bgcolor: `${activeRoute.color}15`, color: activeRoute.color, fontWeight: 700, fontSize: '0.75rem' }}
              />
              <Chip
                icon={<TimerIcon sx={{ fontSize: '14px !important', color: `${activeRoute.color} !important` }} />}
                label={`~${activeRoute.duration} min`}
                size="small"
                sx={{ bgcolor: `${activeRoute.color}15`, color: activeRoute.color, fontWeight: 700, fontSize: '0.75rem' }}
              />
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" sx={{ color: '#8B9BB4', fontSize: '0.8rem' }}>
            Creează un traseu nou pentru a planifica ruta
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddRoadIcon />}
            onClick={addRoute}
            size="small"
            sx={{ mt: 1, borderColor: 'rgba(79,195,247,0.4)', color: '#4FC3F7', fontSize: '0.78rem' }}
          >
            Traseu nou
          </Button>
        </Box>
      )}
    </Box>
  );
}
