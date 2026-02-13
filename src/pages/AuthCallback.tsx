/**
 * OAuth callback - receives token from backend after Microsoft sign-in
 * Backend flow: Backend exchanges auth code, creates JWT, redirects here with ?token=xxx
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { authService } from '../services/AuthService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (token) {
      authService.setToken(token);
      navigate('/dashboard', { replace: true });
    } else {
      setError('No token received. Please try signing in again.');
    }
  }, [searchParams, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
      {error ? (
        <Alert severity="error" sx={{ maxWidth: 400, mb: 2 }} onClose={() => navigate('/login')}>
          {error}
        </Alert>
      ) : (
        <>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography>Completing sign in...</Typography>
        </>
      )}
    </Box>
  );
}
