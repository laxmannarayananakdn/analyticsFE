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
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagement';
import AccessControl from './pages/AccessControl';
import NodeManagement from './pages/NodeManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import SchoolAssignment from './pages/SchoolAssignment';
import SupersetDashboard from './pages/SupersetDashboard';
import SupersetConfig from './pages/SupersetConfig';
import ProtectedRoute from './components/ProtectedRoute';
import PageLayout from './components/PageLayout';

function App() {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

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
    <Router>
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
    </Router>
  );
}

export default App;
