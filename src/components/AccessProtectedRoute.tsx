import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { getRequiredItemIdForPath } from '../config/routeAccess';
import { getMySidebarAccess } from '../services/SidebarAccessService';
import { authService } from '../services/AuthService';

interface AccessProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * AccessProtectedRoute
 * Extends ProtectedRoute with RBAC: only allows access if the user has
 * the required sidebar item permission for the current path.
 * Prevents users from bypassing sidebar restrictions by pasting URLs.
 */
export default function AccessProtectedRoute({ children }: AccessProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const pathname = location.pathname;
      const requiredItemId = getRequiredItemIdForPath(pathname);

      // No RBAC requirement for this path (e.g. /superset-dashboard without uuid)
      if (requiredItemId === null) {
        if (!cancelled) setStatus('allowed');
        return;
      }

      try {
        const itemIds = await getMySidebarAccess();
        if (cancelled) return;

        // Empty array = full access (no restrictions per backend contract)
        const hasFullAccess = itemIds.length === 0;
        const hasRequiredAccess = hasFullAccess || itemIds.includes(requiredItemId);

        if (hasRequiredAccess) {
          setStatus('allowed');
          return;
        }

        // User does not have access - redirect to first allowed route
        let redirectTo: string = '/dashboard';

        if (!hasFullAccess && itemIds.length > 0) {
          if (itemIds.includes('dashboard')) {
            redirectTo = '/dashboard';
          } else {
            const firstReport = itemIds.find((id) => id.startsWith('report:'));
            if (firstReport) {
              const uuid = firstReport.replace('report:', '');
              redirectTo = `/superset-dashboard/${uuid}`;
            } else {
              const firstAdmin = itemIds.find((id) => id.startsWith('admin:'));
              if (firstAdmin) {
                const segment = firstAdmin.replace('admin:', '');
                redirectTo = `/admin/${segment}`;
              }
            }
          }
        }

        setStatus('denied');
        navigate(redirectTo, { replace: true });
      } catch (err) {
        console.error('AccessProtectedRoute: failed to check sidebar access', err);
        if (!cancelled) {
          setStatus('denied');
          navigate('/dashboard', { replace: true });
        }
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  if (status === 'checking') {
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
          <CircularProgress color="primary" size={32} />
          <Typography variant="body2" color="text.secondary">
            Checking access...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (status === 'denied') {
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
        <CircularProgress color="primary" size={32} />
      </Box>
    );
  }

  return <>{children}</>;
}
