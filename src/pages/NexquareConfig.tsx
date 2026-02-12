import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import Chip from '@mui/material/Chip';
import { nexquareConfigService, NexquareSchoolConfig, Curriculum } from '../services/NexquareConfigService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function NexquareConfig() {
  const [configs, setConfigs] = useState<NexquareSchoolConfig[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<Partial<Record<number | 'new', boolean>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [formData, setFormData] = useState<Partial<NexquareSchoolConfig>>({
    country: '',
    school_name: '',
    client_id: '',
    client_secret: '',
    domain_url: '',
    curriculum_id: null,
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    loadConfigs();
    loadCurricula();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await nexquareConfigService.getConfigs();
      setConfigs(data);
    } catch (error: any) {
      showToast('Failed to load configurations', 'error');
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurricula = async () => {
    try {
      const data = await nexquareConfigService.getCurricula();
      setCurricula(data);
    } catch (error: any) {
      showToast('Failed to load curricula', 'error');
      console.error('Error loading curricula:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleInputChange = (field: keyof NexquareSchoolConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      country: '',
      school_name: '',
      client_id: '',
      client_secret: '',
      domain_url: '',
      curriculum_id: null,
      is_active: true,
      notes: ''
    });
    setEditingId(null);
  };

  const handleEdit = (config: NexquareSchoolConfig) => {
    setFormData({
      country: config.country,
      school_name: config.school_name,
      client_id: config.client_id,
      client_secret: '',
      domain_url: config.domain_url,
      curriculum_id: config.curriculum_id || null,
      is_active: config.is_active,
      notes: config.notes || ''
    });
    setEditingId(config.id!);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.country || !formData.school_name || !formData.client_id || !formData.domain_url) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!editingId && !formData.client_secret) {
      showToast('Client Secret is required for new configurations', 'error');
      return;
    }

    try {
      if (editingId) {
        const updateData = { ...formData };
        if (!updateData.client_secret || updateData.client_secret.trim() === '') {
          delete updateData.client_secret;
        }
        await nexquareConfigService.updateConfig(editingId, updateData);
        showToast(
          updateData.client_secret 
            ? 'Configuration updated successfully (secret changed)' 
            : 'Configuration updated successfully (secret unchanged)',
          'success'
        );
      } else {
        await nexquareConfigService.createConfig(formData as Omit<NexquareSchoolConfig, 'id' | 'created_at' | 'updated_at'>);
        showToast('Configuration created successfully', 'success');
      }
      resetForm();
      await loadConfigs();
    } catch (error: any) {
      showToast(
        error.response?.data?.error || error.message || 'Failed to save configuration',
        'error'
      );
      console.error('Error saving config:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await nexquareConfigService.deleteConfig(id);
      showToast('Configuration deleted successfully', 'success');
      setShowDeleteConfirm(null);
      await loadConfigs();
    } catch (error: any) {
      showToast('Failed to delete configuration', 'error');
      console.error('Error deleting config:', error);
    }
  };

  const togglePasswordVisibility = (id: number | 'new') => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SettingsIcon />
            Nexquare School Configuration
          </Typography>
          <Typography color="text.secondary">Manage Nexquare API credentials for each school</Typography>
        </Box>

        <Snackbar open={toasts.length > 0} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {toasts.map((toast) => (
              <Alert
                key={toast.id}
                severity={toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : 'info'}
                onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                action={
                  <IconButton size="small" onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                {toast.message}
              </Alert>
            ))}
          </Box>
        </Snackbar>

        <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                {editingId ? <><EditIcon /> Edit Configuration</> : <><AddIcon /> Add New Configuration</>}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Country"
                  required
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="e.g., UAE, UK, USA"
                  fullWidth
                />
                <TextField
                  label="School Name"
                  required
                  value={formData.school_name || ''}
                  onChange={(e) => handleInputChange('school_name', e.target.value)}
                  placeholder="Enter school name"
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Curriculum</InputLabel>
                  <Select
                    value={formData.curriculum_id != null ? String(formData.curriculum_id) : ''}
                    onChange={(e) => handleInputChange('curriculum_id', e.target.value ? parseInt(e.target.value) : null)}
                    label="Curriculum"
                  >
                    <MenuItem value="">Select a curriculum</MenuItem>
                    {curricula.map((curriculum) => (
                      <MenuItem key={curriculum.id} value={String(curriculum.id)}>
                        {curriculum.code} - {curriculum.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Domain URL"
                  required
                  value={formData.domain_url || ''}
                  onChange={(e) => handleInputChange('domain_url', e.target.value)}
                  placeholder="https://api.nexquare.com"
                  fullWidth
                  helperText="Shared across all schools"
                />
                <TextField
                  label="Client ID"
                  required
                  value={formData.client_id || ''}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  placeholder="Enter Nexquare Client ID"
                  fullWidth
                />
                <TextField
                  label={`Client Secret ${editingId ? '(Leave empty to keep current)' : '*'}`}
                  type={!showPassword[editingId || 'new'] ? 'password' : 'text'}
                  value={formData.client_secret || ''}
                  onChange={(e) => handleInputChange('client_secret', e.target.value)}
                  placeholder={editingId ? "Enter new secret to update (leave empty to keep current)" : "Enter Nexquare Client Secret"}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePasswordVisibility(editingId || 'new')} edge="end">
                          {showPassword[editingId || 'new'] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={editingId ? 'The current secret is hidden for security.' : undefined}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_active ?? true}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                  }
                  label="Active"
                />
                <TextField
                  label="Notes (Optional)"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Additional notes or information"
                  fullWidth
                />
                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />} fullWidth>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                  {editingId && (
                    <Button variant="outlined" onClick={handleCancel} startIcon={<CloseIcon />}>
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
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon /> Configurations ({configs.length})
                </Typography>
                <IconButton onClick={loadConfigs} disabled={loading} title="Refresh">
                  <RefreshIcon />
                </IconButton>
              </Box>

              {loading ? (
                <Typography color="text.secondary" textAlign="center" py={4}>Loading...</Typography>
              ) : configs.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No configurations found. Add one to get started.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {configs.map((config) => (
                    <Card key={config.id} variant="outlined" sx={{ flexShrink: 0, bgcolor: config.is_active ? 'action.hover' : 'action.selected' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography fontWeight="600">{config.school_name}</Typography>
                              <Chip label={config.is_active ? 'Active' : 'Inactive'} color={config.is_active ? 'success' : 'default'} size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">{config.country}</Typography>
                            {config.curriculum_code && (
                              <Typography variant="body2" color="text.secondary">
                                Curriculum: {config.curriculum_code} - {config.curriculum_description}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => handleEdit(config)} title="Edit"><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => setShowDeleteConfirm(config.id!)} title="Delete"><DeleteIcon /></IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ typography: 'body2' }}>
                          <Box><Typography component="span" color="text.secondary">Domain:</Typography> <Typography component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{config.domain_url}</Typography></Box>
                          <Box><Typography component="span" color="text.secondary">Client ID:</Typography> <Typography component="span" fontFamily="monospace">{config.client_id}</Typography></Box>
                          <Box><Typography component="span" color="text.secondary">Client Secret:</Typography> <Typography component="span" fontFamily="monospace">{'*'.repeat(20)}</Typography></Box>
                          {config.notes && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{config.notes}</Typography>}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Updated: {formatDate(config.updated_at)}</Typography>
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
            <DialogContentText>
              Are you sure you want to delete this configuration? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
