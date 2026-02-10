import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/AuthService';

const PASSWORD_RULES = 'At least 8 characters, with uppercase, lowercase, number, and special character.';

export default function ChangePassword() {
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <p className="text-green-400 font-medium">Password updated successfully.</p>
          <p className="text-gray-400 text-sm mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Set your password</h1>
        <p className="text-gray-400 text-sm mb-6">
          {requireChange
            ? 'You must set a new password before you can continue.'
            : 'Enter your temporary password and choose a new password.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Current (temporary) password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the password you were given"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose a new password"
            />
            <p className="mt-1 text-gray-500 text-xs">{PASSWORD_RULES}</p>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Back to login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Set password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
