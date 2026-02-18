import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useMapInstance } from './useMapInstance';

export default function MapView() {
  const { containerRef, initMap } = useMapInstance();

  useEffect(() => {
    const map = initMap();
    return () => {
      if (map) map.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        position: 'relative',
        '& .maplibregl-ctrl-bottom-right': {
          bottom: '16px',
          right: '16px',
        },
        '& .maplibregl-ctrl-bottom-left': {
          bottom: '16px',
          left: '16px',
        },
        '& .maplibregl-ctrl-group': {
          background: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          '& button': {
            backgroundColor: 'transparent',
            color: '#E8EDF4',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
            '& .maplibregl-ctrl-icon': {
              filter: 'invert(1) brightness(0.85)',
            },
          },
        },
        '& .maplibregl-ctrl-attrib': {
          background: 'rgba(10, 14, 26, 0.7)',
          color: '#8B9BB4',
          borderRadius: '8px',
          fontSize: '10px',
          backdropFilter: 'blur(8px)',
          '& a': { color: '#4FC3F7' },
        },
        '& .maplibregl-ctrl-scale': {
          background: 'rgba(10, 14, 26, 0.7)',
          color: '#8B9BB4',
          borderColor: '#8B9BB4',
          fontSize: '10px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          backdropFilter: 'blur(8px)',
          borderRadius: '4px',
          padding: '2px 6px',
        },
        '& .maplibregl-popup-content': {
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          padding: '8px 12px',
          color: '#E8EDF4',
        },
        '& .maplibregl-popup-tip': {
          borderTopColor: 'rgba(17, 24, 39, 0.95) !important',
        },
      }}
    />
  );
}
