import { Box } from '@mui/material';
import MapView from './components/map/MapView';
import Sidebar from './components/sidebar/Sidebar';

export default function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: '#0A0E1A',
      }}
    >
      <Sidebar />
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
        <MapView />
      </Box>
    </Box>
  );
}
