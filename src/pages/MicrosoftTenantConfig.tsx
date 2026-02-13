import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudIcon from '@mui/icons-material/Cloud';
import {
  getTenantConfigs,
  createTenantConfig,
  updateTenantConfig,
  deleteTenantConfig,
  MicrosoftTenantConfig,
} from '../services/MicrosoftTenantConfigService';

export default function MicrosoftTenantConfigPage() {
  const { showToast } = useToast();
  const [configs, setConfigs] = useState<MicrosoftTenantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    domain: '',
    authorityTenant: '',
    clientId: '',
    clientSecret: '',
    displayName: '',
    isActive: true,
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await getTenantConfigs();
      setConfigs(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load tenant configs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      domain: '',
      authorityTenant: '',
      clientId: '',
      clientSecret: '',
      displayName: '',
      isActive: true,
    });
    setEditingId(null);
  };

  const handleEdit = (c: MicrosoftTenantConfig) => {
    setFormData({
      domain: c.domain,
      authorityTenant: c.authorityTenant || '',
      clientId: c.clientId,
      clientSecret: '', // Never pre-fill secret
      displayName: c.displayName || '',
      isActive: c.isActive,
    });
    setEditingId(c.tenantConfigId);
  };

  const handleSubmit = async () => {
    const { domain, authorityTenant, clientId, clientSecret, displayName, isActive } = formData;
    if (!domain.trim() || !clientId.trim()) {
      showToast('Domain and Client ID are required', 'error');
      return;
    }
    if (!editingId && !clientSecret) {
      showToast('Client Secret is required for new tenant config', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updatePayload: any = {
          domain: domain.trim(),
          authorityTenant: authorityTenant.trim() || null,
          clientId: clientId.trim(),
          displayName: displayName.trim() || null,
          isActive,
        };
        if (clientSecret.trim()) updatePayload.clientSecret = clientSecret;
        await updateTenantConfig(editingId, updatePayload);
        showToast('Tenant config updated successfully', 'success');
      } else {
        await createTenantConfig({
          domain: domain.trim(),
          authorityTenant: authorityTenant.trim() || null,
          clientId: clientId.trim(),
          clientSecret: clientSecret,
          displayName: displayName.trim() || null,
        });
        showToast('Tenant config created successfully', 'success');
      }
      resetForm();
      await loadConfigs();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTenantConfig(id);
      showToast('Tenant config deleted', 'success');
      setShowDeleteConfirm(null);
      await loadConfigs();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CloudIcon />
            Microsoft Tenant Configuration
          </Typography>
          <Typography color="text.secondary">
            Configure Azure AD app registrations per domain. Users must be pre-added in User Management with Auth Type
            &quot;AppRegistration&quot; before they can sign in with Microsoft.
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              {editingId ? <><EditIcon /> Edit Tenant</> : <><AddIcon /> Add New Tenant</>}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                label="Domain (email domain)"
                required
                value={formData.domain}
                onChange={(e) => setFormData((p) => ({ ...p, domain: e.target.value }))}
                placeholder="contoso.com"
                helperText="Matches user@domain — e.g. user@contoso.com"
                sx={{ minWidth: 200 }}
              />
              <TextField
                label="Authority Tenant (optional)"
                value={formData.authorityTenant}
                onChange={(e) => setFormData((p) => ({ ...p, authorityTenant: e.target.value }))}
                placeholder="contoso.onmicrosoft.com"
                helperText="Use if different from domain — e.g. .onmicrosoft.com or tenant GUID"
                sx={{ minWidth: 220 }}
              />
              <TextField
                label="Client ID"
                required
                value={formData.clientId}
                onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value }))}
                placeholder="Azure app registration Application ID"
                sx={{ minWidth: 320 }}
              />
              <TextField
                label={editingId ? 'Client Secret (leave empty to keep)' : 'Client Secret'}
                required={!editingId}
                type={showSecret ? 'text' : 'password'}
                value={formData.clientSecret}
                onChange={(e) => setFormData((p) => ({ ...p, clientSecret: e.target.value }))}
                placeholder="Secret value from Azure app"
                sx={{ minWidth: 200 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowSecret((s) => !s)} edge="end">
                        {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Display Name (optional)"
                value={formData.displayName}
                onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Contoso Inc"
                sx={{ minWidth: 180 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && (
                <Button variant="outlined" onClick={resetForm} startIcon={<CloseIcon />}>
                  Cancel
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        <Paper>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Tenant Configs ({configs.length})</Typography>
            <IconButton onClick={loadConfigs} disabled={loading} title="Refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : configs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No tenant configs. Add one to enable Microsoft login.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Domain</TableCell>
                  <TableCell>Authority</TableCell>
                  <TableCell>Client ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.map((c) => (
                  <TableRow key={c.tenantConfigId}>
                    <TableCell>
                      <Typography fontWeight={500}>{c.domain}</Typography>
                      {c.displayName && (
                        <Typography variant="caption" color="text.secondary">{c.displayName}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{c.authorityTenant || '(same as domain)'}</TableCell>
                    <TableCell>
                      <Typography fontFamily="monospace" fontSize="0.85rem">
                        {c.clientId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(c)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setShowDeleteConfirm(c.tenantConfigId)} title="Delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>

        <Dialog open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}>
          <DialogTitle>Delete Tenant Config</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure? Users with this domain will no longer be able to sign in with Microsoft until a new config is added.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
