import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, TextField, List, ListItemButton, ListItemText, ListItemIcon,
  Typography, CircularProgress, Chip, Divider, Paper, InputAdornment,
  IconButton, Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HighwayIcon from '@mui/icons-material/MergeType';
import RoadIcon from '@mui/icons-material/Timeline';
import StreetIcon from '@mui/icons-material/Streetview';
import CityIcon from '@mui/icons-material/LocationCity';
import PlaceIcon from '@mui/icons-material/Place';
import { useMapStore } from '../../stores/mapStore';
import { searchNominatim } from '../../services/nominatim';
import type { SearchResult } from '../../types';

const TYPE_CONFIG: Record<SearchResult['type'], { icon: React.ReactNode; label: string; color: string }> = {
  highway: { icon: <HighwayIcon sx={{ fontSize: 16 }} />, label: 'Autostradă', color: '#F59E0B' },
  road: { icon: <RoadIcon sx={{ fontSize: 16 }} />, label: 'Drum Național', color: '#3B82F6' },
  street: { icon: <StreetIcon sx={{ fontSize: 16 }} />, label: 'Stradă', color: '#10B981' },
  city: { icon: <CityIcon sx={{ fontSize: 16 }} />, label: 'Localitate', color: '#CE93D8' },
  other: { icon: <PlaceIcon sx={{ fontSize: 16 }} />, label: 'Locație', color: '#94A3B8' },
};

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function SearchBar() {
  const { searchQuery, searchResults, searchLoading, setSearchQuery, setSearchResults, setSearchLoading, setHighlightedFeature } = useMapStore();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const results = await searchNominatim(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    doSearch(searchQuery);
    setOpen(!!searchQuery);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (result: SearchResult) => {
    setHighlightedFeature(result);
    setSearchQuery(result.name);
    setOpen(false);
  };

  const groupedResults = searchResults.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeOrder: SearchResult['type'][] = ['highway', 'road', 'street', 'city', 'other'];

  return (
    <Box sx={{ position: 'relative', zIndex: 10 }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        size="small"
        placeholder="Caută autostrăzi, drumuri, orașe, strazi..."
        value={searchQuery}
        onChange={e => { setSearchQuery(e.target.value); setOpen(true); }}
        onFocus={() => searchQuery && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {searchLoading
                ? <CircularProgress size={16} sx={{ color: '#4FC3F7' }} />
                : <SearchIcon sx={{ fontSize: 18, color: '#8B9BB4' }} />}
            </InputAdornment>
          ),
          endAdornment: searchQuery ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        sx={{
          '& .MuiInputBase-root': {
            bgcolor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />

      <Collapse in={open && (searchResults.length > 0 || searchLoading)}>
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 380,
            overflow: 'auto',
            bgcolor: 'rgba(15, 20, 35, 0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          {typeOrder.map(type => {
            const items = groupedResults[type];
            if (!items?.length) return null;
            const config = TYPE_CONFIG[type];
            return (
              <Box key={type}>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: config.color, display: 'flex', alignItems: 'center' }}>
                    {config.icon}
                  </Box>
                  <Typography variant="caption" sx={{ color: config.color, fontWeight: 700, letterSpacing: '0.08em' }}>
                    {config.label}
                  </Typography>
                </Box>
                <List dense disablePadding>
                  {items.map(result => (
                    <ListItemButton
                      key={result.id}
                      onMouseDown={() => handleSelect(result)}
                      sx={{ px: 2, py: 0.75 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: config.color }}>
                        {config.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#E8EDF4', fontSize: '0.82rem' }}>
                            {result.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#8B9BB4', fontSize: '0.72rem' }} noWrap>
                            {result.displayName}
                          </Typography>
                        }
                      />
                      <Chip
                        label={config.label}
                        size="small"
                        sx={{ bgcolor: `${config.color}20`, color: config.color, fontSize: '0.65rem', height: 20 }}
                      />
                    </ListItemButton>
                  ))}
                </List>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
              </Box>
            );
          })}

          {!searchLoading && searchResults.length === 0 && searchQuery.length > 1 && (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#8B9BB4', fontSize: '0.8rem' }}>
                Niciun rezultat pentru „{searchQuery}"
              </Typography>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}
