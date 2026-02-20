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
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { authService, Department, Node } from '../services/AuthService';

interface AccessGroup {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
}

interface PageItem {
  id: string;
  label: string;
}

interface NodeAccess {
  nodeId: string;
  nodeDescription: string;
  departments: string[];
}

export default function AccessGroupsManagement() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccessGroup | null>(null);
  const [modalGroupId, setModalGroupId] = useState('');
  const [modalGroupName, setModalGroupName] = useState('');
  const [modalGroupDescription, setModalGroupDescription] = useState('');
  const [modalNodeAccesses, setModalNodeAccesses] = useState<Record<string, NodeAccess>>({});
  const [modalPageIds, setModalPageIds] = useState<Set<string>>(new Set());
  const [pageItems, setPageItems] = useState<PageItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadPageItems = () => {
    authService.getAvailablePageItems().then(setPageItems).catch(() => setPageItems([]));
  };

  useEffect(() => {
    loadPageItems();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, deptsData, nodesData] = await Promise.all([
        authService.getAccessGroups(),
        authService.getDepartments(),
        authService.getNodes(false),
      ]);
      setGroups(groupsData);
      setDepartments(deptsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)));
      setNodes(nodesData);
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
    setModalNodeAccesses({});
    setModalPageIds(new Set());
    setError(null);
    setShowModal(false);
  };

  const togglePage = (itemId: string, checked: boolean) => {
    setModalPageIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const openCreate = () => {
    loadPageItems(); // Refresh page items (includes newly added admin pages)
    const accessObj: Record<string, NodeAccess> = {};
    nodes.forEach((n) => {
      accessObj[n.nodeId] = { nodeId: n.nodeId, nodeDescription: n.nodeDescription, departments: [] };
    });
    setModalNodeAccesses(accessObj);
    setModalPageIds(new Set());
    setEditingGroup(null);
    setModalGroupId('');
    setModalGroupName('');
    setModalGroupDescription('');
    setShowModal(true);
  };

  const openEdit = async (group: AccessGroup) => {
    setEditingGroup(group);
    loadPageItems(); // Refresh page items when opening edit (includes newly added admin pages)
    setModalGroupId(group.groupId);
    setModalGroupName(group.groupName);
    setModalGroupDescription(group.groupDescription || '');
    try {
      const [access, pageIds] = await Promise.all([
        authService.getGroupNodeAccess(group.groupId),
        authService.getGroupPageAccess(group.groupId),
      ]);
      const accessObj: Record<string, NodeAccess> = {};
      nodes.forEach((n) => {
        accessObj[n.nodeId] = { nodeId: n.nodeId, nodeDescription: n.nodeDescription, departments: [] };
      });
      access.forEach((a) => {
        if (accessObj[a.nodeId]) {
          if (!accessObj[a.nodeId].departments.includes(a.departmentId)) {
            accessObj[a.nodeId].departments.push(a.departmentId);
          }
        }
      });
      setModalNodeAccesses(accessObj);
      setModalPageIds(new Set(pageIds));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load group access', 'error');
    }
    setShowModal(true);
  };

  const toggleDepartment = (nodeId: string, departmentId: string) => {
    setModalNodeAccesses((prev) => {
      const na = prev[nodeId];
      const depts = na ? (na.departments.includes(departmentId) ? na.departments.filter((d) => d !== departmentId) : [...na.departments, departmentId]) : [departmentId];
      return { ...prev, [nodeId]: { nodeId, nodeDescription: nodes.find((n) => n.nodeId === nodeId)?.nodeDescription || nodeId, departments: depts } };
    });
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
        await authService.updateAccessGroup(editingGroup.groupId, { groupName: modalGroupName.trim(), groupDescription: modalGroupDescription.trim() || undefined });
        const nodeAccess = Object.values(modalNodeAccesses)
          .filter((na) => na.departments.length > 0)
          .map((na) => ({ nodeId: na.nodeId, departmentIds: na.departments }));
        await authService.setGroupNodeAccess(editingGroup.groupId, nodeAccess);
        await authService.setGroupPageAccess(editingGroup.groupId, Array.from(modalPageIds));
        showToast('Group updated successfully', 'success');
      } else {
        await authService.createAccessGroup({ groupId: modalGroupId.trim(), groupName: modalGroupName.trim(), groupDescription: modalGroupDescription.trim() || undefined });
        const nodeAccess = Object.values(modalNodeAccesses)
          .filter((na) => na.departments.length > 0)
          .map((na) => ({ nodeId: na.nodeId, departmentIds: na.departments }));
        await authService.setGroupNodeAccess(modalGroupId.trim(), nodeAccess);
        await authService.setGroupPageAccess(modalGroupId.trim(), Array.from(modalPageIds));
        showToast('Group created successfully', 'success');
      }
      resetModal();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm(`Delete group "${groupId}"? This will remove it from all users.`)) return;
    try {
      await authService.deleteAccessGroup(groupId);
      showToast('Group deleted successfully', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete group', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading groups...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GroupIcon /> Access Groups
            </Typography>
            <Typography color="text.secondary">Define groups with node access; assign groups to users for combined access</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Group
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Groups</Typography>
            {groups.length === 0 ? (
              <Typography color="text.secondary">No groups yet. Create a group to assign node access that can be reused across users.</Typography>
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
                    <TableRow key={g.groupId} hover>
                      <TableCell>
                        <Chip label={g.groupId} size="small" />
                      </TableCell>
                      <TableCell>{g.groupName}</TableCell>
                      <TableCell>{g.groupDescription || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(g)} title="Edit">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(g.groupId)} title="Delete" color="error">
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
            {editingGroup ? 'Edit Group' : 'Create Group'}
            <IconButton onClick={resetModal} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            {error && <Box sx={{ p: 1, mb: 2, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{error}</Box>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Group ID" value={modalGroupId} onChange={(e) => setModalGroupId(e.target.value)} disabled={!!editingGroup} placeholder="e.g. INDIA-NORTH-ACADEMIC" fullWidth required />
              <TextField label="Group Name" value={modalGroupName} onChange={(e) => setModalGroupName(e.target.value)} placeholder="e.g. India North - Academic" fullWidth required />
              <TextField label="Description" value={modalGroupDescription} onChange={(e) => setModalGroupDescription(e.target.value)} placeholder="Optional" fullWidth multiline rows={2} />
            </Box>
            {pageItems.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Sidebar Page Access</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Pages and admin screens users in this group can see</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {pageItems.map((item) => (
                    <FormControlLabel
                      key={item.id}
                      control={
                        <Checkbox
                          checked={modalPageIds.has(item.id)}
                          onChange={(e) => togglePage(item.id, e.target.checked)}
                          size="small"
                        />
                      }
                      label={item.label}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {nodes.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Node & Department Access</Typography>
                <Paper sx={{ overflow: 'auto', maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Node</TableCell>
                        {departments.map((d) => (
                          <TableCell key={d.departmentId} align="center">{d.departmentName}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {nodes.map((node) => {
                        const na = modalNodeAccesses[node.nodeId] || { nodeId: node.nodeId, nodeDescription: node.nodeDescription, departments: [] };
                        return (
                          <TableRow key={node.nodeId} hover>
                            <TableCell>
                              <Typography fontWeight={500}>{node.nodeDescription}</Typography>
                              <Typography variant="caption" color="text.secondary">({node.nodeId})</Typography>
                            </TableCell>
                            {departments.map((d) => (
                              <TableCell key={d.departmentId} align="center">
                                <Checkbox
                                  checked={na.departments.includes(d.departmentId)}
                                  onChange={() => toggleDepartment(node.nodeId, d.departmentId)}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
