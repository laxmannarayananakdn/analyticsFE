import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import EFUpload from './pages/EFUpload';
import NexquareConfig from './pages/NexquareConfig';
import ManageBacConfig from './pages/ManageBacConfig';
import NexquareDataSync from './pages/NexquareDataSync';
import ManageBacDataSync from './pages/ManageBacDataSync';
import RPConfig from './pages/RPConfig';
import SupersetDashboards from './pages/SupersetDashboards';
import AKSDashboard from './pages/AKSDashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import AccessControl from './pages/AccessControl';
import NodeManagement from './pages/NodeManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import SchoolAssignment from './pages/SchoolAssignment';
import ProtectedRoute from './components/ProtectedRoute';
import { databaseService } from './services/DatabaseService';
import { authService } from './services/AuthService';

function App() {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  useEffect(() => {
    // Check API health on mount
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Checking API connection...</div>
      </div>
    );
  }

  if (healthStatus === 'unhealthy') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-red-500 text-xl">
          ⚠️ Cannot connect to API server. Please ensure the backend is running on port 3001.
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public route - login page */}
        <Route path="/login" element={<Login />} />
        
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
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superset"
          element={
            <ProtectedRoute>
              <SupersetDashboards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aks-dashboard"
          element={
            <ProtectedRoute>
              <AKSDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ef-upload"
          element={
            <ProtectedRoute>
              <EFUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/nexquare-config"
          element={
            <ProtectedRoute>
              <NexquareConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/managebac-config"
          element={
            <ProtectedRoute>
              <ManageBacConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rp-config"
          element={
            <ProtectedRoute>
              <RPConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/nexquare-sync"
          element={
            <ProtectedRoute>
              <NexquareDataSync />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/managebac-sync"
          element={
            <ProtectedRoute>
              <ManageBacDataSync />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access-control"
          element={
            <ProtectedRoute>
              <AccessControl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/nodes"
          element={
            <ProtectedRoute>
              <NodeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute>
              <DepartmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/school-assignment"
          element={
            <ProtectedRoute>
              <SchoolAssignment />
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

