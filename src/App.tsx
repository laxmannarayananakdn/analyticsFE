import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AuthCallback from './pages/AuthCallback';
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagement';
import AccessControl from './pages/AccessControl';
import AccessGroupsManagement from './pages/AccessGroupsManagement';
import SidebarAccessManagement from './pages/SidebarAccessManagement';
import ReportGroupsManagement from './pages/ReportGroupsManagement';
import MicrosoftTenantConfig from './pages/MicrosoftTenantConfig';
import NodeManagement from './pages/NodeManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import SchoolAssignment from './pages/SchoolAssignment';
import SupersetDashboard from './pages/SupersetDashboard';
import SupersetConfig from './pages/SupersetConfig';
import AccessProtectedRoute from './components/AccessProtectedRoute';
import PageLayout from './components/PageLayout';

function AppContent() {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  useEffect(() => {
    console.log('[App] Load', { url: window.location.href });
  }, []);

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
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <AccessProtectedRoute>
              <Navigate to="/dashboard" replace />
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <Dashboard />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/superset-dashboard"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <SupersetDashboard />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/superset-dashboard/:dashboardUuid"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <SupersetDashboard />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/superset-config"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <SupersetConfig />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/ef-upload"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <EFUpload />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/nexquare-config"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <NexquareConfig />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/managebac-config"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <ManageBacConfig />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/rp-config"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <RPConfig />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/nexquare-sync"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <NexquareDataSync />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/managebac-sync"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <ManageBacDataSync />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <UserManagement />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/access-control"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <AccessControl />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/access-groups"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <AccessGroupsManagement />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/sidebar-access"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <SidebarAccessManagement />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/report-groups"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <ReportGroupsManagement />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/microsoft-tenant-config"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <MicrosoftTenantConfig />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/nodes"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <NodeManagement />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <DepartmentManagement />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        <Route
          path="/admin/school-assignment"
          element={
            <AccessProtectedRoute>
              <PageLayout>
                <SchoolAssignment />
              </PageLayout>
            </AccessProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to dashboard (protected) */}
        <Route
          path="*"
          element={
            <AccessProtectedRoute>
              <Navigate to="/dashboard" replace />
            </AccessProtectedRoute>
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
