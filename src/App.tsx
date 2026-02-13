import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dashboard from './pages/Dashboard';
import EFUpload from './pages/EFUpload';
import NexquareConfig from './pages/NexquareConfig';
import ManageBacConfig from './pages/ManageBacConfig';
import NexquareDataSync from './pages/NexquareDataSync';
import ManageBacDataSync from './pages/ManageBacDataSync';
import RPConfig from './pages/RPConfig';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagement';
import AccessControl from './pages/AccessControl';
import AccessGroupsManagement from './pages/AccessGroupsManagement';
import SidebarAccessManagement from './pages/SidebarAccessManagement';
import MicrosoftTenantConfig from './pages/MicrosoftTenantConfig';
import NodeManagement from './pages/NodeManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import SchoolAssignment from './pages/SchoolAssignment';
import SupersetDashboard from './pages/SupersetDashboard';
import SupersetConfig from './pages/SupersetConfig';
import ProtectedRoute from './components/ProtectedRoute';
import PageLayout from './components/PageLayout';

const MSAL_REDIRECT_STORAGE_KEY = 'msal_tenant_config';

function AppContent() {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  useEffect(() => {
    console.log('[App] Load', { url: window.location.href });
  }, []);
  // Must be true on FIRST render when we have auth params, else Router will redirect to /login and we lose the params
  const [handlingMsalRedirect, setHandlingMsalRedirect] = useState(() => {
    const stored = localStorage.getItem(MSAL_REDIRECT_STORAGE_KEY);
    const hasAuthParams = !!(
      window.location.hash ||
      window.location.search.includes('code=') ||
      window.location.search.includes('state=')
    );
    if (stored && hasAuthParams) {
      console.log('[MSAL] Detected return from Microsoft on initial load', { url: window.location.href });
      return true;
    }
    return false;
  });

  // Handle MSAL redirect: when we return from Microsoft login (same tab), process the auth and complete login
  useEffect(() => {
    const stored = localStorage.getItem(MSAL_REDIRECT_STORAGE_KEY);
    const hasAuthParams = !!(
      window.location.hash ||
      window.location.search.includes('code=') ||
      window.location.search.includes('state=')
    );
    console.log('[MSAL] Redirect handler effect', { stored: !!stored, hasAuthParams, url: window.location.href });
    if (!stored || !hasAuthParams) return;

    const config = JSON.parse(stored) as { clientId: string; authority: string };
    console.log('[MSAL] Processing redirect with config', { clientId: config.clientId?.slice(0, 8) + '...' });
    setHandlingMsalRedirect(true);

    const msal = new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
      },
    });

    msal
      .initialize()
      .then(() => {
        console.log('[MSAL] Instance ready, calling handleRedirectPromise');
        return msal.handleRedirectPromise();
      })
      .then(async (result) => {
        localStorage.removeItem(MSAL_REDIRECT_STORAGE_KEY);
        setHandlingMsalRedirect(false);
        console.log('[MSAL] handleRedirectPromise result', {
          hasResult: !!result,
          hasIdToken: !!result?.idToken,
          username: result?.account?.username,
        });
        if (result?.idToken && result?.account?.username) {
          try {
            console.log('[MSAL] Calling backend loginWithMicrosoft for', result.account.username);
            const { authService } = await import('./services/AuthService');
            await authService.loginWithMicrosoft(result.account.username, result.idToken);
            console.log('[MSAL] Backend login success, navigating to dashboard');
            navigate('/dashboard', { replace: true });
          } catch (err: any) {
            console.error('[MSAL] Backend login failed:', {
              status: err?.response?.status,
              data: err?.response?.data,
              message: err?.message,
            });
          }
        } else {
          console.warn('[MSAL] No idToken or username in result');
        }
      })
      .catch((err) => {
        console.error('[MSAL] Redirect handling failed:', err);
        localStorage.removeItem(MSAL_REDIRECT_STORAGE_KEY);
        setHandlingMsalRedirect(false);
      });
  }, [navigate]);

  useEffect(() => {
    // Check API health on mount (uses same base URL as rest of app)
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiBase}/api/health`);
        const data = await response.json();
        if (data.status === 'ok' && data.database === 'connected') {
          setHealthStatus('healthy');
        } else {
          setHealthStatus('unhealthy');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthStatus('unhealthy');
      }
    };

    checkHealth();
  }, []);

  if (handlingMsalRedirect) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="primary" />
          <Typography color="text.primary">Completing Microsoft sign in...</Typography>
        </Box>
      </Box>
    );
  }

  if (healthStatus === 'checking') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="primary" />
          <Typography color="text.primary">Checking API connection...</Typography>
        </Box>
      </Box>
    );
  }

  if (healthStatus === 'unhealthy') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          ⚠️ Cannot connect to API server. Please ensure the backend is running and VITE_API_BASE_URL is set correctly.
        </Alert>
      </Box>
    );
  }

  return (
    <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageLayout>
                <Dashboard />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superset-dashboard"
          element={
            <ProtectedRoute>
              <PageLayout>
                <SupersetDashboard />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superset-dashboard/:dashboardUuid"
          element={
            <ProtectedRoute>
              <PageLayout>
                <SupersetDashboard />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/superset-config"
          element={
            <ProtectedRoute>
              <PageLayout>
                <SupersetConfig />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ef-upload"
          element={
            <ProtectedRoute>
              <PageLayout>
                <EFUpload />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/nexquare-config"
          element={
            <ProtectedRoute>
              <PageLayout>
                <NexquareConfig />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/managebac-config"
          element={
            <ProtectedRoute>
              <PageLayout>
                <ManageBacConfig />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rp-config"
          element={
            <ProtectedRoute>
              <PageLayout>
                <RPConfig />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/nexquare-sync"
          element={
            <ProtectedRoute>
              <PageLayout>
                <NexquareDataSync />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/managebac-sync"
          element={
            <ProtectedRoute>
              <PageLayout>
                <ManageBacDataSync />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <PageLayout>
                <UserManagement />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access-control"
          element={
            <ProtectedRoute>
              <PageLayout>
                <AccessControl />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access-groups"
          element={
            <ProtectedRoute>
              <PageLayout>
                <AccessGroupsManagement />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sidebar-access"
          element={
            <ProtectedRoute>
              <PageLayout>
                <SidebarAccessManagement />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/microsoft-tenant-config"
          element={
            <ProtectedRoute>
              <PageLayout>
                <MicrosoftTenantConfig />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/nodes"
          element={
            <ProtectedRoute>
              <PageLayout>
                <NodeManagement />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute>
              <PageLayout>
                <DepartmentManagement />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/school-assignment"
          element={
            <ProtectedRoute>
              <PageLayout>
                <SchoolAssignment />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to dashboard (protected) */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
      </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
