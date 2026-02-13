import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import { authService } from '../services/AuthService';
import { getTenantConfigForLogin } from '../services/MicrosoftTenantConfigService';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const message = (location.state as { message?: string })?.message;
  const errorParam = new URLSearchParams(location.search).get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(errorParam ? decodeURIComponent(errorParam) : null);
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [microsoftAvailable, setMicrosoftAvailable] = useState<{
    clientId: string;
    authority: string;
    displayName: string | null;
  } | null>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Check if Microsoft login is available for the entered email domain (debounced)
  useEffect(() => {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) {
      setMicrosoftAvailable(null);
      return;
    }
    const timer = setTimeout(() => {
      getTenantConfigForLogin(domain)
        .then((config) => setMicrosoftAvailable(config))
        .catch(() => setMicrosoftAvailable(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
        navigate('/change-password', { state: { email, requireChange: true } });
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    const emailVal = email.trim();
    if (!emailVal) {
      setError('Please enter your email first');
      return;
    }
    if (!microsoftAvailable) {
      setError('Microsoft login is not configured for your organization. Please sign in with password.');
      return;
    }

    setError(null);
    setMsLoading(true);
    try {
      const domain = emailVal.split('@')[1]?.toLowerCase().trim() || '';
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const authUrl = `${apiBase}/api/auth/microsoft/authorize?domain=${encodeURIComponent(domain)}&login_hint=${encodeURIComponent(emailVal)}`;
      window.location.href = authUrl;
    } finally {
      setMsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Box component="img" src="/AKS%20Logos.png" alt="AKS Logo" sx={{ maxHeight: 80, width: 'auto', maxWidth: 240, objectFit: 'contain' }} />
      </Box>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Login
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            placeholder="user@example.com"
            sx={{ mb: 2 }}
          />

          {microsoftAvailable && (
            <Button
              variant="outlined"
              fullWidth
              disabled={msLoading}
              size="large"
              onClick={handleMicrosoftLogin}
              sx={{ mb: 2 }}
            >
              {msLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>
          )}

          <Divider sx={{ my: 2 }}>or</Divider>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              placeholder="Enter your password"
            />
            <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
              {loading ? 'Logging in...' : 'Login with Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
