import { useState, useEffect } from 'react';
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
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import {
  getReportGroups,
  createReportGroup,
  updateReportGroup,
  deleteReportGroup,
  getReportGroupReports,
  setReportGroupReports,
  type ReportGroup,
} from '../services/ReportGroupService';
import { getDashboards } from '../services/SupersetDashboardConfigService';

export default function ReportGroupsManagement() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<ReportGroup[]>([]);
  const [dashboards, setDashboards] = useState<Array<{ uuid: string; name: string; folder?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ReportGroup | null>(null);
  const [modalGroupId, setModalGroupId] = useState('');
  const [modalGroupName, setModalGroupName] = useState('');
  const [modalGroupDescription, setModalGroupDescription] = useState('');
  const [modalDashboardUuids, setModalDashboardUuids] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, dashData] = await Promise.all([
        getReportGroups(),
        getDashboards(false),
      ]);
      setGroups(groupsData);
      setDashboards(dashData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setEditingGroup(null);
    setModalGroupId('');
    setModalGroupName('');
    setModalGroupDescription('');
    setModalDashboardUuids(new Set());
    setError(null);
    setShowModal(false);
  };

  const toggleDashboard = (uuid: string, checked: boolean) => {
    setModalDashboardUuids((prev) => {
      const next = new Set(prev);
      if (checked) next.add(uuid);
      else next.delete(uuid);
      return next;
    });
  };

  const openCreate = () => {
    setModalDashboardUuids(new Set());
    setEditingGroup(null);
    setModalGroupId('');
    setModalGroupName('');
    setModalGroupDescription('');
    setShowModal(true);
  };

  const openEdit = async (group: ReportGroup) => {
    setEditingGroup(group);
    setModalGroupId(group.reportGroupId);
    setModalGroupName(group.groupName);
    setModalGroupDescription(group.groupDescription || '');
    try {
      const uuids = await getReportGroupReports(group.reportGroupId);
      setModalDashboardUuids(new Set(uuids));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load group reports', 'error');
    }
    setShowModal(true);
  };

  const handleSaveGroup = async () => {
    setError(null);
    if (!modalGroupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (!editingGroup && !modalGroupId.trim()) {
      setError('Group ID is required for new groups');
      return;
    }
    setSaving(true);
    try {
      if (editingGroup) {
        await updateReportGroup(editingGroup.reportGroupId, {
          groupName: modalGroupName.trim(),
          groupDescription: modalGroupDescription.trim() || undefined,
        });
        await setReportGroupReports(editingGroup.reportGroupId, Array.from(modalDashboardUuids));
        showToast('Report group updated successfully', 'success');
      } else {
        await createReportGroup({
          reportGroupId: modalGroupId.trim(),
          groupName: modalGroupName.trim(),
          groupDescription: modalGroupDescription.trim() || undefined,
        });
        await setReportGroupReports(modalGroupId.trim(), Array.from(modalDashboardUuids));
        showToast('Report group created successfully', 'success');
      }
      resetModal();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reportGroupId: string) => {
    if (!confirm(`Delete report group "${reportGroupId}"? This will remove it from all users.`)) return;
    try {
      await deleteReportGroup(reportGroupId);
      showToast('Report group deleted successfully', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading report groups...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AssessmentIcon /> Report Groups
            </Typography>
            <Typography color="text.secondary">
              Define groups of reports (Superset dashboards); assign groups to users via Access Control. Scope filtering applies based on user&apos;s node access.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Report Group
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Report Groups</Typography>
            {groups.length === 0 ? (
              <Typography color="text.secondary">
                No report groups yet. Create a group and assign reports that users can access.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Group ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.reportGroupId} hover>
                      <TableCell>
                        <Chip label={g.reportGroupId} size="small" />
                      </TableCell>
                      <TableCell>{g.groupName}</TableCell>
                      <TableCell>{g.groupDescription || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(g)} title="Edit">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(g.reportGroupId)} title="Delete" color="error">
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

        <Dialog open={showModal} onClose={resetModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editingGroup ? 'Edit Report Group' : 'Create Report Group'}
            <IconButton onClick={resetModal} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            {error && <Box sx={{ p: 1, mb: 2, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{error}</Box>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Group ID" value={modalGroupId} onChange={(e) => setModalGroupId(e.target.value)} disabled={!!editingGroup} placeholder="e.g. GLOBAL-REPORTS" fullWidth required />
              <TextField label="Group Name" value={modalGroupName} onChange={(e) => setModalGroupName(e.target.value)} placeholder="e.g. Global Reports" fullWidth required />
              <TextField label="Description" value={modalGroupDescription} onChange={(e) => setModalGroupDescription(e.target.value)} placeholder="Optional" fullWidth multiline rows={2} />
            </Box>
            {dashboards.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Reports (Dashboards) in this group</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Select which Superset dashboards users in this group can see</Typography>
                <Paper sx={{ overflow: 'auto', maxHeight: 320 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 2 }}>
                    {dashboards.map((d) => (
                      <FormControlLabel
                        key={d.uuid}
                        control={
                          <Checkbox
                            checked={modalDashboardUuids.has(d.uuid)}
                            onChange={(e) => toggleDashboard(d.uuid, e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{d.name}</Typography>
                            {d.folder && <Chip label={d.folder} size="small" variant="outlined" />}
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={resetModal}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveGroup} disabled={saving} startIcon={<SaveIcon />}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
