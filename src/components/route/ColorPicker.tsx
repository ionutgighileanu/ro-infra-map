import { useState } from 'react';
import { Box, Popover, IconButton, Tooltip, TextField, Typography, Grid } from '@mui/material';


const PRESET_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
  '#1E88E5', '#00ACC1', '#00897B', '#43A047',
  '#F4511E', '#FB8C00', '#FDD835', '#6D4C41',
  '#546E7A', '#4FC3F7', '#80CBC4', '#A5D6A7',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [hex, setHex] = useState(color);

  const open = Boolean(anchor);

  const handleHexChange = (val: string) => {
    setHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val);
  };

  return (
    <>
      <Tooltip title="Culoare traseu">
        <IconButton
          size="small"
          onClick={e => setAnchor(e.currentTarget)}
          sx={{
            width: 32, height: 32, borderRadius: 1.5,
            bgcolor: color,
            border: '2px solid rgba(255,255,255,0.2)',
            '&:hover': { filter: 'brightness(1.2)', border: '2px solid rgba(255,255,255,0.5)' },
            transition: 'all 0.2s',
          }}
        />
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 20, 35, 0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            p: 2,
            mt: 0.5,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          },
        }}
      >
        <Typography variant="caption" sx={{ color: '#8B9BB4', fontWeight: 700, letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          CULOARE TRASEU
        </Typography>

        <Grid container spacing={0.75} sx={{ mb: 2, width: 168 }}>
          {PRESET_COLORS.map(c => (
            <Grid key={c} size="auto">
              <Box
                onClick={() => { onChange(c); setHex(c); setAnchor(null); }}
                sx={{
                  width: 28, height: 28, borderRadius: 1, bgcolor: c, cursor: 'pointer',
                  border: c === color ? '2.5px solid #fff' : '2.5px solid transparent',
                  boxShadow: c === color ? `0 0 12px ${c}80` : 'none',
                  transition: 'all 0.15s',
                  '&:hover': { transform: 'scale(1.15)', border: '2.5px solid rgba(255,255,255,0.7)' },
                }}
              />
            </Grid>
          ))}
        </Grid>

        <TextField
          size="small"
          value={hex}
          onChange={e => handleHexChange(e.target.value)}
          placeholder="#RRGGBB"
          InputProps={{
            startAdornment: (
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: color, mr: 0.5, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
            ),
          }}
          sx={{
            width: '100%',
            '& input': { fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' },
          }}
        />
      </Popover>
    </>
  );
}
