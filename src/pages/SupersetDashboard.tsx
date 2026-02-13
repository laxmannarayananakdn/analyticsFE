import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import API_ENDPOINTS from '../config/api';
import { getDashboards } from '../services/SupersetDashboardConfigService';

const SUPERSET_BASE = (import.meta.env.VITE_SUPERSET_URL || 'https://superset-edtech-app.azurewebsites.net').replace(/\/$/, '');
const SUPERSET_DOMAIN = SUPERSET_BASE;
const DEFAULT_UUID = 'af48524f-ae1a-44f3-8fe3-deaf1c16f7fe';

export default function SupersetDashboard() {
  const { dashboardUuid } = useParams<{ dashboardUuid: string }>();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboards, setDashboards] = useState<{ uuid: string; name: string }[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string>(dashboardUuid || '');

  useEffect(() => {
    getDashboards(true)
      .then((list) => {
        setDashboards(list);
        if (dashboardUuid) {
          setSelectedUuid(dashboardUuid);
        } else {
          setSelectedUuid(list.length > 0 ? list[0].uuid : DEFAULT_UUID);
        }
      })
      .catch(() => {
        setSelectedUuid(dashboardUuid || DEFAULT_UUID);
      });
  }, [dashboardUuid]);

  useEffect(() => {
    const uuidToUse = dashboardUuid || selectedUuid || DEFAULT_UUID;
    if (!uuidToUse) return;

    const fetchTokenAndEmbed = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const authToken = localStorage.getItem('auth_token');
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(API_ENDPOINTS.SUPERSET.EMBED_TOKEN, {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({ dashboardId: uuidToUse }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 403 && errData?.code === 'SUPERSET_ACCESS_DENIED') {
            const email = errData?.userEmail || 'unknown';
            throw new Error(`User ${email} does not have access to this dashboard.`);
          }
          throw new Error(errData?.error || `Failed to get token: ${response.statusText}`);
        }

        const { token } = await response.json();
        if (!token) throw new Error('No token received from backend');

        if (dashboardRef.current) {
          await embedDashboard({
            id: uuidToUse,
            supersetDomain: SUPERSET_DOMAIN,
            mountPoint: dashboardRef.current,
            fetchGuestToken: () => Promise.resolve(token),
            referrerPolicy: 'origin',
            debug: import.meta.env.DEV,
            dashboardUiConfig: {
              hideTitle: false,
              hideChartControls: false,
              hideTab: false,
              filters: { visible: true, expanded: false },
            },
          });
        }

        setLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
        console.error('Error embedding dashboard:', err);
        setError(msg);
        setLoading(false);
      }
    };

    fetchTokenAndEmbed();
  }, [dashboardUuid, selectedUuid]);

  const handleDashboardChange = (uuid: string) => {
    setSelectedUuid(uuid);
    navigate(`/superset-dashboard/${uuid}`, { replace: true });
  };

  const currentUuid = dashboardUuid || selectedUuid || DEFAULT_UUID;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" fontWeight="bold">
          Superset Dashboard
        </Typography>
        {dashboards.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Dashboard</InputLabel>
            <Select
              value={currentUuid}
              label="Dashboard"
              onChange={(e) => handleDashboardChange(e.target.value)}
            >
              {dashboards.map((d) => (
                <MenuItem key={d.uuid} value={d.uuid}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

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
