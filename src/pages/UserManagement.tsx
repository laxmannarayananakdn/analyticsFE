import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import KeyIcon from '@mui/icons-material/Key';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { authService, User } from '../services/AuthService';

const PASSWORD_RULES = 'At least 8 characters, with uppercase, lowercase, number, and special character.';

interface SupersetRole {
  id: number;
  name: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createAuthType, setCreateAuthType] = useState<'Password' | 'AppRegistration'>('Password');
  const [createPassword, setCreatePassword] = useState('');
  const [createSupersetRoleIds, setCreateSupersetRoleIds] = useState<number[]>([]);
  const [supersetRoles, setSupersetRoles] = useState<SupersetRole[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState<string | null>(null);
  const [createdUserEmail, setCreatedUserEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAuthType, setEditAuthType] = useState<'Password' | 'AppRegistration'>('Password');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editTempPassword, setEditTempPassword] = useState<string | null>(null);
  const [editCopied, setEditCopied] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (showCreateModal && supersetRoles.length === 0) {
      authService.getSupersetRoles().then(setSupersetRoles).catch(() => setSupersetRoles([]));
    }
  }, [showCreateModal]);

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
    if (!confirm(`Reset password for ${email}? A temporary password will be generated.`)) return;
    try {
      const result = await authService.resetPassword(email);
      showToast(`Password reset successful! Temporary password: ${result.temporaryPassword} — please communicate this to the user.`, 'success', 12000);
      loadUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to reset password', 'error');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName || '');
    setEditAuthType(user.authType);
    setEditIsActive(user.isActive);
    setEditError(null);
    setEditTempPassword(null);
    setEditCopied(false);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditDisplayName('');
    setEditAuthType('Password');
    setEditIsActive(true);
    setEditError(null);
    setEditTempPassword(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditLoading(true);
    try {
      const result = await authService.updateUser(editingUser.email, {
        displayName: editDisplayName.trim() || undefined,
        authType: editAuthType,
        isActive: editIsActive,
      });
      const updated = result.user;
      setUsers((prev) => prev.map((u) => (u.email === updated.email ? updated : u)));
      if (result.temporaryPassword) {
        setEditTempPassword(result.temporaryPassword);
      } else {
        closeEditModal();
        loadUsers();
        showToast('User updated successfully', 'success');
      }
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCopyEditTempPassword = async () => {
    if (!editTempPassword) return;
    try {
      await navigator.clipboard.writeText(editTempPassword);
      setEditCopied(true);
      setTimeout(() => setEditCopied(false), 2000);
    } catch {
      setEditError('Could not copy to clipboard');
    }
  };

  const handleDoneEditTempPassword = () => {
    closeEditModal();
    loadUsers();
    showToast('User updated. Share the temporary password with the user.', 'success');
  };

  const resetCreateModal = () => {
    setCreateEmail('');
    setCreateDisplayName('');
    setCreateAuthType('Password');
    setCreatePassword('');
    setCreateSupersetRoleIds([]);
    setCreateError(null);
    setCreatedTempPassword(null);
    setCreatedUserEmail(null);
    setCopied(false);
    setShowCreateModal(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    const email = createEmail.trim();
    try {
      const result = await authService.createUser({
        email,
        displayName: createDisplayName.trim() || undefined,
        authType: createAuthType,
        password: createAuthType === 'Password' && createPassword ? createPassword : undefined,
        supersetRoleIds: createSupersetRoleIds.length > 0 ? createSupersetRoleIds : undefined,
      });
      setCreatedUserEmail(email);
      if (result.temporaryPassword) {
        setCreatedTempPassword(result.temporaryPassword);
      } else {
        resetCreateModal();
        loadUsers();
        navigate(`/admin/access-control?user=${encodeURIComponent(email)}`);
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
    const email = createdUserEmail;
    resetCreateModal();
    loadUsers();
    if (email) {
      navigate(`/admin/access-control?user=${encodeURIComponent(email)}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>User Management</Typography>
            <Typography color="text.secondary">Manage users and their access</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
            Create User
          </Button>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{error}</Box>
        )}

        <Paper sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Auth Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.displayName || '-'}</TableCell>
                  <TableCell>{user.authType}</TableCell>
                  <TableCell>
                    <Chip label={user.isActive ? 'Active' : 'Inactive'} color={user.isActive ? 'success' : 'error'} size="small" sx={{ mr: 0.5 }} />
                    {user.isTemporaryPassword && <Chip label="Temp Password" color="warning" size="small" />}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEditModal(user)} title="Edit user">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleResetPassword(user.email)} title="Reset Password">
                      <KeyIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Dialog open={showCreateModal} onClose={resetCreateModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {createdTempPassword ? 'User created – save this password' : 'Create user'}
            <IconButton onClick={resetCreateModal} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            {createdTempPassword ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Share this temporary password with the user. They will be required to change it on first login.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField value={createdTempPassword} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ fontFamily: 'monospace' }} />
                  <Button variant="contained" onClick={handleCopyTempPassword} startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </Box>
                <Button variant="outlined" fullWidth onClick={handleDoneWithTempPassword}>Done</Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleCreateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {createError && <Box sx={{ p: 1, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{createError}</Box>}
                <TextField label="Email *" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required fullWidth placeholder="user@example.com" />
                <TextField label="Display name" value={createDisplayName} onChange={(e) => setCreateDisplayName(e.target.value)} fullWidth placeholder="Optional" />
                <FormControl fullWidth>
                  <InputLabel>Auth type *</InputLabel>
                  <Select value={createAuthType} onChange={(e) => setCreateAuthType(e.target.value as 'Password' | 'AppRegistration')} label="Auth type *">
                    <MenuItem value="Password">Password</MenuItem>
                    <MenuItem value="AppRegistration">App registration</MenuItem>
                  </Select>
                </FormControl>
                {createAuthType === 'Password' && (
                  <>
                    <TextField label="Password (optional)" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} fullWidth placeholder="Leave empty to generate temporary password" helperText={PASSWORD_RULES} />
                    <Typography variant="caption" color="warning.main">If left empty, a temporary password is generated.</Typography>
                  </>
                )}
                {supersetRoles.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Superset roles</InputLabel>
                    <Select
                      multiple
                      value={createSupersetRoleIds}
                      onChange={(e) => setCreateSupersetRoleIds(e.target.value as number[])}
                      label="Superset roles"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((id) => {
                            const r = supersetRoles.find((x) => x.id === id);
                            return <Chip key={id} label={r?.name ?? id} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {supersetRoles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary">User will be synced to Superset with these roles (embedded dashboards)</Typography>
                  </FormControl>
                )}
                <Box sx={{ display: 'flex', gap: 1, pt: 2 }}>
                  <Button variant="outlined" fullWidth onClick={resetCreateModal}>Cancel</Button>
                  <Button type="submit" variant="contained" fullWidth disabled={createLoading}>{createLoading ? 'Creating...' : 'Create user'}</Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onClose={closeEditModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editTempPassword ? 'Login type changed – save this password' : `Edit user${editingUser ? `: ${editingUser.email}` : ''}`}
            <IconButton onClick={closeEditModal} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            {editTempPassword ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Auth type was changed to Password. Share this temporary password with the user. They will be required to change it on first login.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField value={editTempPassword} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ fontFamily: 'monospace' }} />
                  <Button variant="contained" onClick={handleCopyEditTempPassword} startIcon={editCopied ? <CheckIcon /> : <ContentCopyIcon />}>
                    {editCopied ? 'Copied' : 'Copy'}
                  </Button>
                </Box>
                <Button variant="outlined" fullWidth onClick={handleDoneEditTempPassword}>Done</Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleUpdateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editError && <Box sx={{ p: 1, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{editError}</Box>}
                <TextField label="Email" value={editingUser?.email || ''} fullWidth disabled />
                <TextField label="Display name" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} fullWidth placeholder="Optional" />
                <FormControl fullWidth>
                  <InputLabel>Auth type</InputLabel>
                  <Select value={editAuthType} onChange={(e) => setEditAuthType(e.target.value as 'Password' | 'AppRegistration')} label="Auth type">
                    <MenuItem value="Password">Password</MenuItem>
                    <MenuItem value="AppRegistration">App registration</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={editIsActive ? 'Active' : 'Inactive'} onChange={(e) => setEditIsActive(e.target.value === 'Active')} label="Status">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
                {editAuthType === 'Password' && editingUser?.authType === 'AppRegistration' && (
                  <Typography variant="caption" color="warning.main">Changing to Password will generate a temporary password. Share it with the user.</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, pt: 2 }}>
                  <Button variant="outlined" fullWidth onClick={closeEditModal}>Cancel</Button>
                  <Button type="submit" variant="contained" fullWidth disabled={editLoading}>{editLoading ? 'Updating...' : 'Update user'}</Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}
