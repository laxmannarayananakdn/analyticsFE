import { useEffect, useRef, useState } from 'react';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import API_ENDPOINTS from '../config/api';

// Embedded dashboard UUID from Superset (Embed dashboard → Enable → copy the id)
const DASHBOARD_UUID = 'af48524f-ae1a-44f3-8fe3-deaf1c16f7fe';
const SUPERSET_BASE = (import.meta.env.VITE_SUPERSET_URL || 'https://superset-edtech-app.azurewebsites.net').replace(/\/$/, '');
// Embedded route is at root (not /superset) - dashboard UI is at /superset/dashboard/1
const SUPERSET_DOMAIN = SUPERSET_BASE;

export default function SupersetDashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenAndEmbed = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch guest token from your backend
        const response = await fetch(API_ENDPOINTS.SUPERSET.EMBED_TOKEN, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboardId: DASHBOARD_UUID }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get token: ${response.statusText}`);
        }

        const { token } = await response.json();

        if (!token) {
          throw new Error('No token received from backend');
        }

        // Embed the dashboard with the guest token
        if (dashboardRef.current) {
          await embedDashboard({
            id: DASHBOARD_UUID,
            supersetDomain: SUPERSET_DOMAIN,
            mountPoint: dashboardRef.current,
            fetchGuestToken: () => Promise.resolve(token),
            // Must send Referer for allowed-domains check; 'origin' sends http://localhost:5173
            referrerPolicy: 'origin',
            debug: import.meta.env.DEV,
            dashboardUiConfig: {
              hideTitle: false,
              hideChartControls: false,
              hideTab: false,
              filters: {
                visible: true,
                expanded: false,
              },
            },
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error embedding dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchTokenAndEmbed();
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Superset Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      )}

      <Box
        ref={dashboardRef}
        sx={{
          mt: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          height: loading ? 0 : 'calc(100vh - 120px)',
          width: '100%',
          '& iframe': { width: '100%', height: '100%', display: 'block' },
        }}
      />
    </Box>
  );
}