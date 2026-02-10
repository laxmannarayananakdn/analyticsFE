import { useState, useEffect } from 'react';
import { authService, User } from '../services/AuthService';
import { Plus, Key, X, Copy, Check } from 'lucide-react';

const PASSWORD_RULES = 'At least 8 characters, with uppercase, lowercase, number, and special character.';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createAuthType, setCreateAuthType] = useState<'Password' | 'AppRegistration'>('Password');
  const [createPassword, setCreatePassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Reset password for ${email}? A temporary password will be generated.`)) {
      return;
    }

    try {
      const result = await authService.resetPassword(email);
      alert(`Password reset successful!\nTemporary password: ${result.temporaryPassword}\n\nPlease communicate this to the user.`);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const resetCreateModal = () => {
    setCreateEmail('');
    setCreateDisplayName('');
    setCreateAuthType('Password');
    setCreatePassword('');
    setCreateError(null);
    setCreatedTempPassword(null);
    setCopied(false);
    setShowCreateModal(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const result = await authService.createUser({
        email: createEmail.trim(),
        displayName: createDisplayName.trim() || undefined,
        authType: createAuthType,
        password: createAuthType === 'Password' && createPassword ? createPassword : undefined,
      });
      if (result.temporaryPassword) {
        setCreatedTempPassword(result.temporaryPassword);
      } else {
        resetCreateModal();
        loadUsers();
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!createdTempPassword) return;
    try {
      await navigator.clipboard.writeText(createdTempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCreateError('Could not copy to clipboard');
    }
  };

  const handleDoneWithTempPassword = () => {
    resetCreateModal();
    loadUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-white text-center">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage users and their access</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  {createdTempPassword ? 'User created – save this password' : 'Create user'}
                </h2>
                <button
                  type="button"
                  onClick={resetCreateModal}
                  className="p-2 text-gray-400 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createdTempPassword ? (
                <div className="p-6 space-y-4">
                  <p className="text-gray-300 text-sm">
                    Share this temporary password with the user. They will be required to change it on first login.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-900 text-green-400 rounded font-mono text-sm break-all">
                      {createdTempPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyTempPassword}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDoneWithTempPassword}
                    className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  {createError && (
                    <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                      {createError}
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Display name</label>
                    <input
                      type="text"
                      value={createDisplayName}
                      onChange={(e) => setCreateDisplayName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Auth type *</label>
                    <select
                      value={createAuthType}
                      onChange={(e) => setCreateAuthType(e.target.value as 'Password' | 'AppRegistration')}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Password">Password</option>
                      <option value="AppRegistration">App registration</option>
                    </select>
                  </div>
                  {createAuthType === 'Password' && (
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Password (optional)</label>
                      <input
                        type="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave empty to generate temporary password"
                      />
                      <p className="mt-1 text-gray-500 text-xs">{PASSWORD_RULES}</p>
                      <p className="mt-0.5 text-amber-500/90 text-xs">
                        If left empty, a temporary password is generated and the user must change it on first login.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetCreateModal}
                      className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createLoading ? 'Creating...' : 'Create user'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Display Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Auth Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-gray-750">
                  <td className="px-6 py-4 text-white">{user.email}</td>
                  <td className="px-6 py-4 text-gray-300">{user.displayName || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">{user.authType}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.isActive 
                        ? 'bg-green-900/50 text-green-300' 
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.isTemporaryPassword && (
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-900/50 text-yellow-300">
                        Temp Password
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
