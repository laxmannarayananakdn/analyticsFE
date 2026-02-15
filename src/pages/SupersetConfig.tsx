import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  getDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  DASHBOARD_FOLDERS,
  type SupersetDashboardConfig,
} from '../services/SupersetDashboardConfigService';
import { authService } from '../services/AuthService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function SupersetConfig() {
  const [dashboards, setDashboards] = useState<SupersetDashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [formData, setFormData] = useState<Partial<SupersetDashboardConfig>>({
    uuid: '',
    name: '',
    description: '',
    sort_order: 0,
    is_active: true,
    folder: 'Education',
    department_id: null,
    report_scope: null,
    scope_node_id: null,
  });
  const [departments, setDepartments] = useState<Array<{ departmentId: string; departmentName: string }>>([]);
  const [nodes, setNodes] = useState<Array<{ nodeId: string; nodeDescription: string; isHeadOffice: boolean }>>([]);

  useEffect(() => {
    loadDashboards();
  }, []);
  useEffect(() => {
    Promise.all([
      authService.getDepartments().catch(() => []),
      authService.getNodes(false).catch(() => []),
    ]).then(([depts, nodeList]) => {
      setDepartments(depts);
      setNodes(nodeList);
    });
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const data = await getDashboards(false);
      setDashboards(data);
    } catch (error: any) {
      showToast('Failed to load dashboards', 'error');
      console.error('Error loading dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const handleInputChange = (field: keyof SupersetDashboardConfig, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      uuid: '',
      name: '',
      description: '',
      sort_order: 0,
      is_active: true,
      folder: 'Education',
      department_id: null,
      report_scope: null,
      scope_node_id: null,
    });
    setEditingId(null);
  };

  const handleEdit = (config: SupersetDashboardConfig) => {
    setFormData({
      uuid: config.uuid,
      name: config.name,
      description: config.description || '',
      sort_order: config.sort_order ?? 0,
      is_active: config.is_active ?? true,
      folder: config.folder || 'Education',
      department_id: config.department_id || null,
      report_scope: config.report_scope || null,
      scope_node_id: config.scope_node_id || null,
    });
    setEditingId(config.id!);
  };

  const handleSubmit = async () => {
    if (!formData.uuid?.trim() || !formData.name?.trim()) {
      showToast('UUID and Name are required', 'error');
      return;
    }

    try {
      if (editingId) {
        await updateDashboard(editingId, {
          ...formData,
          department_id: formData.department_id || undefined,
          report_scope: formData.report_scope || undefined,
          scope_node_id: formData.scope_node_id || undefined,
        });
        showToast('Dashboard updated successfully', 'success');
      } else {
        await createDashboard({
          uuid: formData.uuid.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          sort_order: formData.sort_order ?? 0,
          is_active: formData.is_active ?? true,
          folder: (formData.folder as string) || 'Education',
          department_id: formData.department_id || undefined,
          report_scope: formData.report_scope || undefined,
          scope_node_id: formData.scope_node_id || undefined,
        });
        showToast('Dashboard added successfully', 'success');
      }
      resetForm();
      await loadDashboards();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Failed to save', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDashboard(id);
      showToast('Dashboard removed successfully', 'success');
      setShowDeleteConfirm(null);
      await loadDashboards();
    } catch (error: any) {
      showToast('Failed to delete', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SettingsIcon />
            Superset Dashboard Configuration
          </Typography>
          <Typography color="text.secondary">
            Add dashboards from Superset. Get the UUID from Superset: Dashboard → ⋮ → Embed dashboard → Enable.
          </Typography>
        </Box>

        {toasts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {toasts.map((toast) => (
              <Alert
                key={toast.id}
                severity={toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : 'info'}
                onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                sx={{ mb: 1 }}
              >
                {toast.message}
              </Alert>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                {editingId ? <><EditIcon /> Edit Dashboard</> : <><AddIcon /> Add Dashboard</>}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Dashboard UUID *"
                  value={formData.uuid || ''}
                  onChange={(e) => handleInputChange('uuid', e.target.value)}
                  placeholder="e.g. af48524f-ae1a-44f3-8fe3-deaf1c16f7fe"
                  fullWidth
                  helperText="From Superset: ⋮ → Embed dashboard → Enable → copy ID"
                />
                <TextField
                  label="Display Name *"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Sales Overview"
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Optional"
                  fullWidth
                />
                <Box>
                  <InputLabel id="folder-label" sx={{ mb: 0.5 }}>Folder</InputLabel>
                  <Select
                    labelId="folder-label"
                    value={formData.folder || 'Education'}
                    onChange={(e) => handleInputChange('folder', e.target.value)}
                    fullWidth
                    size="medium"
                  >
                    {DASHBOARD_FOLDERS.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <InputLabel id="department-label" sx={{ mb: 0.5 }}>Department</InputLabel>
                  <Select
                    labelId="department-label"
                    value={formData.department_id || ''}
                    onChange={(e) => handleInputChange('department_id', e.target.value || null)}
                    fullWidth
                    size="medium"
                    displayEmpty
                  >
                    <MenuItem value="">None</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary">Aligns with admin.Department for RBAC</Typography>
                </Box>
                <Box>
                  <InputLabel id="scope-label" sx={{ mb: 0.5 }}>Report Scope</InputLabel>
                  <Select
                    labelId="scope-label"
                    value={formData.report_scope || ''}
                    onChange={(e) => handleInputChange('report_scope', e.target.value || null)}
                    fullWidth
                    size="medium"
                    displayEmpty
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="global">Global (Head Office)</MenuItem>
                    <MenuItem value="country">Country / Region</MenuItem>
                    <MenuItem value="school">School</MenuItem>
                  </Select>
                </Box>
                {(formData.report_scope === 'global' || formData.report_scope === 'country' || formData.report_scope === 'school') && (
                  <Box>
                    <InputLabel id="scope-node-label" sx={{ mb: 0.5 }}>Scope Node</InputLabel>
                    <Select
                      labelId="scope-node-label"
                      value={formData.scope_node_id || ''}
                      onChange={(e) => handleInputChange('scope_node_id', e.target.value || null)}
                      fullWidth
                      size="medium"
                      displayEmpty
                    >
                      <MenuItem value="">Select node</MenuItem>
                      {nodes.map((n) => (
                        <MenuItem key={n.nodeId} value={n.nodeId}>
                          {n.nodeDescription} ({n.nodeId}){n.isHeadOffice ? ' — Head Office' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary">
                      Global = Head Office node. Required for scope-based report filtering.
                    </Typography>
                  </Box>
                )}
                <TextField
                  label="Sort Order"
                  type="number"
                  value={formData.sort_order ?? 0}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Order within folder; ties broken by Display Name"
                />
                <FormControlLabel
                  control={<Checkbox checked={formData.is_active ?? true} onChange={(e) => handleInputChange('is_active', e.target.checked)} />}
                  label="Active (visible in app)"
                />
                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />} fullWidth>
                    {editingId ? 'Update' : 'Add'}
                  </Button>
                  {editingId && (
                    <Button variant="outlined" onClick={resetForm} startIcon={<CloseIcon />}>
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Configured Dashboards ({dashboards.length})</Typography>
                <IconButton onClick={loadDashboards} disabled={loading} title="Refresh">
                  <RefreshIcon />
                </IconButton>
              </Box>

              {loading ? (
                <Typography color="text.secondary" textAlign="center" py={4}>Loading...</Typography>
              ) : dashboards.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No dashboards configured. Add one to get started.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dashboards.map((d) => (
                    <Card key={d.id} variant="outlined" sx={{ flexShrink: 0 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography fontWeight="600">{d.name}</Typography>
                              <Chip label={d.folder || 'Education'} size="small" variant="outlined" />
                              {d.department_id && <Chip label={d.department_id} size="small" variant="outlined" color="primary" />}
                              {d.report_scope && <Chip label={d.report_scope} size="small" variant="outlined" />}
                              <Chip label={d.is_active ? 'Active' : 'Inactive'} color={d.is_active ? 'success' : 'default'} size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary" fontFamily="monospace">{d.uuid}</Typography>
                            {d.description && <Typography variant="body2" sx={{ mt: 0.5 }}>{d.description}</Typography>}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button component={Link} to={`/superset-dashboard/${d.uuid}`} size="small" startIcon={<VisibilityIcon />}>
                              View
                            </Button>
                            <IconButton size="small" onClick={() => handleEdit(d)} title="Edit"><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => setShowDeleteConfirm(d.id!)} title="Delete"><DeleteIcon /></IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Dialog open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>Remove this dashboard from the app? The Superset dashboard itself is not deleted.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
