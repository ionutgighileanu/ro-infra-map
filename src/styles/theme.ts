import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    mapColors: {
      highway: string;
      national: string;
      county: string;
      street: string;
    };
  }
  interface ThemeOptions {
    mapColors?: {
      highway?: string;
      national?: string;
      county?: string;
      street?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4FC3F7',
      light: '#81D4FA',
      dark: '#0288D1',
    },
    secondary: {
      main: '#CE93D8',
    },
    background: {
      default: '#0A0E1A',
      paper: '#111827',
    },
    text: {
      primary: '#E8EDF4',
      secondary: '#8B9BB4',
    },
    divider: 'rgba(255,255,255,0.08)',
    success: { main: '#66BB6A' },
    error: { main: '#EF5350' },
    warning: { main: '#FFA726' },
  },
  mapColors: {
    highway: '#F59E0B',
    national: '#3B82F6',
    county: '#10B981',
    street: '#94A3B8',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
    caption: { fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#0A0E1A',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1E2940 transparent',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#1E2940', borderRadius: '3px' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111827',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.01em',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 16px rgba(79, 195, 247, 0.3)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: '10px !important',
          backgroundColor: 'rgba(255,255,255,0.04)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.10)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(79, 195, 247, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4FC3F7',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.7rem' },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          boxShadow: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 48,
          '&.Mui-expanded': { minHeight: 48, borderRadius: '12px 12px 0 0' },
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
        },
        content: { margin: '0 !important' },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '8px 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 6 },
        switchBase: {
          '&.Mui-checked': { color: '#4FC3F7' },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: alpha('#4FC3F7', 0.5) },
        },
        track: { borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
        thumb: { width: 16, height: 16, boxShadow: 'none' },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#4FC3F7' },
        thumb: { width: 14, height: 14 },
        rail: { backgroundColor: 'rgba(255,255,255,0.15)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E2940',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        arrow: { color: '#1E2940' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': { backgroundColor: 'rgba(79, 195, 247, 0.08)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(79, 195, 247, 0.12)',
            '&:hover': { backgroundColor: 'rgba(79, 195, 247, 0.16)' },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.06)' },
      },
    },
  },
});
