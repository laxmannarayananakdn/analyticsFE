/**
 * Microsoft OAuth callback handler
 * Microsoft redirects here after sign-in. We process the auth code and complete login.
 * This dedicated path helps avoid query params being stripped by hosting (e.g. Azure Static Web Apps).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { PublicClientApplication } from '@azure/msal-browser';

const MSAL_REDIRECT_STORAGE_KEY = 'msal_tenant_config';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(MSAL_REDIRECT_STORAGE_KEY);
    const hasAuthParams = !!(
      window.location.hash ||
      window.location.search.includes('code=') ||
      window.location.search.includes('state=')
    );

    console.log('[AuthCallback] Loaded', {
      url: window.location.href,
      hasStoredConfig: !!stored,
      hasAuthParams,
    });

    if (!stored) {
      setError('No session found. Please start the sign-in from the login page.');
      return;
    }
    if (!hasAuthParams) {
      setError('No auth response received. You may have been redirected too early.');
      return;
    }

    const config = JSON.parse(stored) as { clientId: string; authority: string };
    const redirectUri = `${window.location.origin}/auth/callback`;
    console.log('[AuthCallback] Processing with redirectUri', redirectUri);

    const msal = new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        redirectUri,
        postLogoutRedirectUri: window.location.origin,
      },
    });

    msal
      .initialize()
      .then(() => msal.handleRedirectPromise())
      .then(async (result) => {
        localStorage.removeItem(MSAL_REDIRECT_STORAGE_KEY);
        console.log('[AuthCallback] MSAL result', { hasResult: !!result, username: result?.account?.username });

        if (result?.idToken && result?.account?.username) {
          const { authService } = await import('../services/AuthService');
          await authService.loginWithMicrosoft(result.account.username, result.idToken);
          navigate('/dashboard', { replace: true });
        } else {
          setError('Sign-in incomplete. Please try again.');
        }
      })
      .catch((err) => {
        console.error('[AuthCallback] Error:', err);
        localStorage.removeItem(MSAL_REDIRECT_STORAGE_KEY);
        setError(err?.message || 'Sign-in failed. Please try again.');
      });
  }, [navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
      {error ? (
        <Alert severity="error" sx={{ maxWidth: 400, mb: 2 }} onClose={() => navigate('/login')}>
          {error}
        </Alert>
      ) : (
        <>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography>Completing Microsoft sign in...</Typography>
        </>
      )}
    </Box>
  );
}
