import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { authService } from '../services/AuthService';

const PASSWORD_RULES = 'At least 8 characters, with uppercase, lowercase, number, and special character.';

export default function ChangePassword() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const stateEmail = (location.state as { email?: string })?.email ?? '';
  const requireChange = (location.state as { requireChange?: boolean })?.requireChange ?? false;

  const [email, setEmail] = useState(stateEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.setPassword(email.trim(), currentPassword, newPassword);
      showToast('Password updated successfully.', 'success');
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { message: 'Password updated. Please log in.' } }), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Set your password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {requireChange
              ? 'You must set a new password before you can continue.'
              : 'Enter your temporary password and choose a new password.'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              placeholder="user@example.com"
            />
            <TextField
              label="Current (temporary) password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
              placeholder="Enter the password you were given"
            />
            <TextField
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              placeholder="Choose a new password"
              helperText={PASSWORD_RULES}
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              placeholder="Confirm new password"
            />
            <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => navigate('/login')}>
                Back to login
              </Button>
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? 'Updating...' : 'Set password'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
