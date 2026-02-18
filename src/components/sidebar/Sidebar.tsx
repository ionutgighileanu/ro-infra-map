import { useState } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Switch, Slider, Divider,
  ToggleButton, ToggleButtonGroup, Tooltip, Stack, Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import SatelliteIcon from '@mui/icons-material/Satellite';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import RouteIcon from '@mui/icons-material/Route';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlaceIcon from '@mui/icons-material/Place';
import VillageIcon from '@mui/icons-material/OtherHouses';
import { useMapStore } from '../../stores/mapStore';
import SearchBar from '../search/SearchBar';
import RouteBuilder from '../route/RouteBuilder';
import { ColorPicker } from '../route/ColorPicker';

const SIDEBAR_WIDTH = 320;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" sx={{
      color: '#4FC3F7', fontWeight: 700, letterSpacing: '0.1em',
      display: 'block', px: 0.5, mb: 1,
    }}>
      {children}
    </Typography>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, mapType, setMapType, labels, setLabels, border, setBorder } = useMapStore();
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [borderExpanded, setBorderExpanded] = useState(false);
  const [routesExpanded, setRoutesExpanded] = useState(true);

  const hasAnyLabel = labels.cities || labels.counties || labels.villages || labels.roads;

  return (
    <>
      {/* Sidebar Container */}
      <Box
        sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH : 0,
          minWidth: sidebarOpen ? SIDEBAR_WIDTH : 0,
          height: '100vh',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
        }}
      >
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(9, 13, 25, 0.97)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{
            px: 2.5, pt: 2.5, pb: 2,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(79,195,247,0.06) 0%, transparent 100%)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{
                width: 32, height: 32,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1565C0, #4FC3F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 195, 247, 0.3)',
              }}>
                <MapIcon sx={{ fontSize: 18, color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, color: '#E8EDF4' }}>
                  RO Infra Map
                </Typography>
                <Typography variant="caption" sx={{ color: '#4FC3F7', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                  INFRASTRUCTURĂ ROMÂNIA
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Scrollable content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* ── SEARCH ── */}
            <Box>
              <SectionTitle>CĂUTARE</SectionTitle>
              <SearchBar />
            </Box>

            <Divider />

            {/* ── MAP TYPE ── */}
            <Box>
              <SectionTitle>TIP HARTĂ</SectionTitle>
              <ToggleButtonGroup
                value={mapType}
                exclusive
                onChange={(_, v) => v && setMapType(v)}
                fullWidth
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#8B9BB4',
                    borderRadius: '10px !important',
                    py: 0.75,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    gap: 0.75,
                    mx: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(79, 195, 247, 0.12)',
                      color: '#4FC3F7',
                      borderColor: '#4FC3F7 !important',
                    },
                  },
                }}
              >
                <ToggleButton value="basic">
                  <MapIcon sx={{ fontSize: 16 }} /> Standard
                </ToggleButton>
                <ToggleButton value="satellite">
                  <SatelliteIcon sx={{ fontSize: 16 }} /> Satelit
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* ── LABELS ── Collapsible Accordion */}
            <Box>
              <Accordion
                expanded={labelsExpanded}
                onChange={(_, exp) => setLabelsExpanded(exp)}
                disableGutters
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#8B9BB4' }} />}
                  sx={{ px: 1.5, py: 0 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasAnyLabel
                      ? <LabelIcon sx={{ fontSize: 16, color: '#4FC3F7' }} />
                      : <LabelOffIcon sx={{ fontSize: 16, color: '#8B9BB4' }} />}
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#E8EDF4' }}>
                      Labels Hărții
                    </Typography>
                    <Chip
                      label={hasAnyLabel ? 'Activ' : 'Inactiv'}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.62rem', fontWeight: 700,
                        bgcolor: hasAnyLabel ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.06)',
                        color: hasAnyLabel ? '#4FC3F7' : '#8B9BB4',
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                  <Stack spacing={0.5}>
                    {[
                      { key: 'cities', icon: <LocationCityIcon sx={{ fontSize: 14 }} />, label: 'Orașe & Municipii' },
                      { key: 'counties', icon: <PlaceIcon sx={{ fontSize: 14 }} />, label: 'Județe' },
                      { key: 'villages', icon: <VillageIcon sx={{ fontSize: 14 }} />, label: 'Sate & Comune' },
                      { key: 'roads', icon: <RouteIcon sx={{ fontSize: 14 }} />, label: 'Drumuri & Autostrăzi' },
                    ].map(({ key, icon, label }) => (
                      <Box
                        key={key}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          px: 1.5, py: 0.75,
                          borderRadius: 1.5,
                          bgcolor: labels[key as keyof typeof labels] ? 'rgba(79,195,247,0.06)' : 'transparent',
                          border: `1px solid ${labels[key as keyof typeof labels] ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.04)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: labels[key as keyof typeof labels] ? '#4FC3F7' : '#8B9BB4' }}>
                            {icon}
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 500, color: labels[key as keyof typeof labels] ? '#E8EDF4' : '#8B9BB4' }}>
                            {label}
                          </Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={labels[key as keyof typeof labels] as boolean}
                          onChange={e => setLabels({ [key]: e.target.checked })}
                        />
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>

            {/* ── BORDER ── */}
            <Box>
              <Accordion
                expanded={borderExpanded}
                onChange={(_, exp) => setBorderExpanded(exp)}
                disableGutters
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#8B9BB4' }} />}
                  sx={{ px: 1.5, py: 0 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BorderStyleIcon sx={{ fontSize: 16, color: border.visible ? border.color : '#8B9BB4' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#E8EDF4' }}>
                      Granița României
                    </Typography>
                    <Chip
                      label={border.visible ? 'Vizibil' : 'Ascuns'}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.62rem', fontWeight: 700,
                        bgcolor: border.visible ? `${border.color}20` : 'rgba(255,255,255,0.06)',
                        color: border.visible ? border.color : '#8B9BB4',
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#8B9BB4' }}>Vizibil pe hartă</Typography>
                      <Switch
                        size="small"
                        checked={border.visible}
                        onChange={e => setBorder({ visible: e.target.checked })}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#8B9BB4' }}>Culoare border</Typography>
                      <ColorPicker color={border.color} onChange={c => setBorder({ color: c })} />
                    </Box>

                    <Box sx={{ px: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#8B9BB4' }}>Grosime linie</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 700, color: border.color }}>
                          {border.width}px
                        </Typography>
                      </Box>
                      <Slider
                        value={border.width}
                        onChange={(_, v) => setBorder({ width: v as number })}
                        min={1} max={8} step={0.5}
                        sx={{ color: border.color, py: 0.5 }}
                        marks={[{ value: 1 }, { value: 4 }, { value: 8 }]}
                      />
                    </Box>

                    {/* Border preview */}
                    <Box sx={{
                      height: 24, borderRadius: 1,
                      border: `${border.width}px solid ${border.color}`,
                      opacity: border.visible ? 1 : 0.3,
                      transition: 'all 0.2s',
                      bgcolor: 'transparent',
                    }} />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>

            <Divider />

            {/* ── ROUTES ── */}
            <Box>
              <Accordion
                expanded={routesExpanded}
                onChange={(_, exp) => setRoutesExpanded(exp)}
                disableGutters
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#8B9BB4' }} />}
                  sx={{ px: 1.5, py: 0 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon sx={{ fontSize: 16, color: '#4FC3F7' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#E8EDF4' }}>
                      Trasee
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <RouteBuilder />
                </AccordionDetails>
              </Accordion>
            </Box>

          </Box>

          {/* Footer */}
          <Box sx={{
            px: 2, py: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography variant="caption" sx={{ color: '#444', fontSize: '0.65rem' }}>
              © OpenStreetMap contributors
            </Typography>
            <Typography variant="caption" sx={{ color: '#444', fontSize: '0.65rem' }}>
              v1.0.0
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Toggle button */}
      <Box
        sx={{
          position: 'absolute',
          left: sidebarOpen ? SIDEBAR_WIDTH : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Tooltip title={sidebarOpen ? 'Ascunde meniu' : 'Arată meniu'} placement="right">
          <Box
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{
              width: 24, height: 56,
              bgcolor: 'rgba(9, 13, 25, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderLeft: sidebarOpen ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: sidebarOpen ? '0 8px 8px 0' : '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '4px 0 16px rgba(0,0,0,0.3)',
              '&:hover': { bgcolor: 'rgba(79, 195, 247, 0.1)' },
              transition: 'all 0.2s',
            }}
          >
            {sidebarOpen
              ? <ChevronLeftIcon sx={{ fontSize: 14, color: '#8B9BB4' }} />
              : <ChevronRightIcon sx={{ fontSize: 14, color: '#8B9BB4' }} />}
          </Box>
        </Tooltip>
      </Box>
    </>
  );
}
