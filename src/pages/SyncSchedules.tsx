import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { syncService, SyncSchedule } from '../services/SyncService';
import { authService, Node } from '../services/AuthService';

const CRON_EXAMPLES = [
  { expr: '0 2 * * *', label: 'Daily 2:00 AM' },
  { expr: '0 4 * * *', label: 'Daily 4:00 AM' },
  { expr: '0 3 * * 0', label: 'Sunday 3:00 AM' },
  { expr: '0 1 1 * *', label: '1st of month 1:00 AM' },
];

export default function SyncSchedules() {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<SyncSchedule[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [form, setForm] = useState({
    node_id: '',
    academic_year: new Date().getFullYear().toString(),
    cron_expression: '0 2 * * *',
    include_descendants: false,
    is_active: true,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [schedRes, nodesRes] = await Promise.all([
        syncService.getSchedules(),
        authService.getNodes(false),
      ]);
      setSchedules(schedRes);
      setNodes(Array.isArray(nodesRes) ? nodesRes : []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({
      node_id: '',
      academic_year: new Date().getFullYear().toString(),
      cron_expression: '0 2 * * *',
      include_descendants: true,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (s: SyncSchedule) => {
    setForm({
      node_id: s.node_id,
      academic_year: s.academic_year,
      cron_expression: s.cron_expression,
      include_descendants: !!(s.include_descendants as unknown),
      is_active: s.is_active !== 0,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.node_id || !form.academic_year || !form.cron_expression) {
      showToast('Node, academic year, and cron expression are required', 'error');
      return;
    }
    try {
      if (editingId) {
        await syncService.updateSchedule(editingId, {
          node_id: form.node_id,
          academic_year: form.academic_year,
          cron_expression: form.cron_expression,
          include_descendants: form.include_descendants,
          is_active: form.is_active,
        });
        showToast('Schedule updated successfully', 'success');
      } else {
        await syncService.createSchedule({
          node_id: form.node_id,
          academic_year: form.academic_year,
          cron_expression: form.cron_expression,
          include_descendants: form.include_descendants,
        });
        showToast('Schedule created successfully', 'success');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save schedule', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await syncService.deleteSchedule(id);
      showToast('Schedule deleted successfully', 'success');
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete schedule', 'error');
    }
  };

  const handleTrigger = async (s: SyncSchedule) => {
    try {
      setTriggering(true);
      const { runId } = await syncService.trigger({
        nodeId: s.node_id,
        academicYear: s.academic_year,
        includeDescendants: !!(s.include_descendants as unknown),
      });
      showToast(`Sync started (Run #${runId}). Check Sync History for progress.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to trigger sync', 'error');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading schedules...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon /> Sync Schedules
            </Typography>
            <Typography color="text.secondary">Configure when and what to sync by node and academic year</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Add Schedule
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Schedules</Typography>
            {schedules.length === 0 ? (
              <Typography color="text.secondary">No schedules yet. Add one to run syncs on a schedule.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Node</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Cron</TableCell>
                    <TableCell>Include Descendants</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.node_id}</TableCell>
                      <TableCell>{s.academic_year}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {s.cron_expression}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.include_descendants ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{s.is_active ? 'Yes' : 'No'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleTrigger(s)} disabled={triggering} title="Run now">
                          <PlayArrowIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenEdit(s)} title="Edit">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteConfirm(s.id)} title="Delete" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editingId ? 'Edit Schedule' : 'Add Schedule'}
            <IconButton onClick={() => setShowForm(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Node</InputLabel>
                <Select
                  value={form.node_id}
                  label="Node"
                  onChange={(e) => setForm((f) => ({ ...f, node_id: e.target.value }))}
                >
                  {nodes.map((n) => (
                    <MenuItem key={n.nodeId} value={n.nodeId}>
                      {n.nodeDescription || n.nodeId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Academic Year"
                value={form.academic_year}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                fullWidth
                placeholder="e.g. 2024 or 2024-2025"
              />
              <FormControl fullWidth>
                <InputLabel>Cron Expression</InputLabel>
                <Select
                  value={form.cron_expression}
                  label="Cron Expression"
                  onChange={(e) => setForm((f) => ({ ...f, cron_expression: e.target.value }))}
                >
                  {CRON_EXAMPLES.map((c) => (
                    <MenuItem key={c.expr} value={c.expr}>
                      {c.label} ({c.expr})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.include_descendants}
                    onChange={(e) => setForm((f) => ({ ...f, include_descendants: e.target.checked }))}
                  />
                }
                label="Include descendant nodes"
              />
              {editingId !== null && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                  }
                  label="Active"
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Delete Schedule?
            <IconButton onClick={() => setDeleteConfirm(null)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>This will remove the schedule. Scheduled syncs will no longer run.</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
