import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import ShieldIcon from '@mui/icons-material/Shield';
import PeopleIcon from '@mui/icons-material/People';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { authService, User, Department, Node, UserAccess } from '../services/AuthService';

interface NodeAccess {
  nodeId: string;
  nodeDescription: string;
  departments: string[];
}

export default function AccessControl() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [nodeAccesses, setNodeAccesses] = useState<Record<string, NodeAccess>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (selectedUser) loadUserAccess();
    else { setUserAccess([]); setNodeAccesses({}); }
  }, [selectedUser]);
  useEffect(() => {
    if (userAccess.length > 0 && nodes.length > 0) {
      const accessObj: Record<string, NodeAccess> = {};
      userAccess.forEach((access) => {
        if (!accessObj[access.nodeId]) {
          const node = nodes.find(n => n.nodeId === access.nodeId);
          accessObj[access.nodeId] = { nodeId: access.nodeId, nodeDescription: node?.nodeDescription || access.nodeId, departments: [] };
        }
        const nodeAccess = accessObj[access.nodeId];
        if (!nodeAccess.departments.includes(access.departmentId)) nodeAccess.departments.push(access.departmentId);
      });
      nodes.forEach((node) => {
        if (!accessObj[node.nodeId]) accessObj[node.nodeId] = { nodeId: node.nodeId, nodeDescription: node.nodeDescription, departments: [] };
      });
      setNodeAccesses(accessObj);
    } else if (nodes.length > 0 && selectedUser) {
      const accessObj: Record<string, NodeAccess> = {};
      nodes.forEach((node) => {
        accessObj[node.nodeId] = { nodeId: node.nodeId, nodeDescription: node.nodeDescription, departments: [] };
      });
      setNodeAccesses(accessObj);
    }
  }, [userAccess, nodes, selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, deptsData, nodesData] = await Promise.all([
        authService.getUsers(),
        authService.getDepartments(),
        authService.getNodes(false),
      ]);
      setUsers(usersData);
      setDepartments(deptsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)));
      setNodes(nodesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAccess = async () => {
    if (!selectedUser) return;
    try {
      const access = await authService.getUserAccess(selectedUser);
      setUserAccess(access);
    } catch (err: any) {
      console.error('Failed to load user access:', err);
    }
  };

  const toggleDepartment = (nodeId: string, departmentId: string) => {
    setNodeAccesses((prev) => {
      const existingAccess = prev[nodeId];
      const nodeAccess = existingAccess ? {
        ...existingAccess,
        departments: existingAccess.departments.includes(departmentId)
          ? existingAccess.departments.filter(d => d !== departmentId)
          : [...existingAccess.departments, departmentId]
      } : {
        nodeId,
        nodeDescription: nodes.find(n => n.nodeId === nodeId)?.nodeDescription || nodeId,
        departments: [departmentId],
      };
      return { ...prev, [nodeId]: nodeAccess };
    });
  };

  const handleSave = async () => {
    if (!selectedUser) { showToast('Please select a user first', 'error'); return; }
    setSaving(true);
    try {
      const nodesToUpdate = Object.values(nodeAccesses).filter((na) => na.departments.length > 0);
      for (const nodeAccess of nodesToUpdate) {
        await authService.grantAccess(selectedUser, nodeAccess.nodeId, nodeAccess.departments);
      }
      const nodesToRemove = Object.values(nodeAccesses).filter((na) => na.departments.length === 0);
      for (const nodeAccess of nodesToRemove) {
        const hasAccess = userAccess.some(ua => ua.nodeId === nodeAccess.nodeId);
        if (hasAccess) await authService.revokeNodeAccess(selectedUser, nodeAccess.nodeId);
      }
      await loadUserAccess();
      showToast('Access updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save access', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ShieldIcon /> Access Control
            </Typography>
            <Typography color="text.secondary">Manage user access to nodes and departments</Typography>
          </Box>
          {selectedUser && (
            <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <RefreshIcon /> : <SaveIcon />}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PeopleIcon /> Select User
            </Typography>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} label="User">
                <MenuItem value="">-- Select a user --</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.email} value={user.email}>
                    {user.displayName || user.email} {!user.isActive && '(Inactive)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {selectedUser && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Node & Department Access</Typography>
              {nodes.length === 0 ? (
                <Typography color="text.secondary">No nodes found. Create nodes first.</Typography>
              ) : (
                <Paper sx={{ overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Node</TableCell>
                        {departments.map((dept) => (
                          <TableCell key={dept.departmentId} align="center">{dept.departmentName}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {nodes.map((node) => {
                        const nodeAccess = nodeAccesses[node.nodeId] || { nodeId: node.nodeId, nodeDescription: node.nodeDescription, departments: [] };
                        return (
                          <TableRow key={node.nodeId} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={500}>{node.nodeDescription}</Typography>
                                <Typography variant="body2" color="text.secondary">({node.nodeId})</Typography>
                                {node.isHeadOffice && <Chip label="HQ" color="warning" size="small" />}
                              </Box>
                            </TableCell>
                            {departments.map((dept) => {
                              const isChecked = nodeAccess.departments.includes(dept.departmentId);
                              return (
                                <TableCell key={dept.departmentId} align="center">
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={(e) => { e.stopPropagation(); toggleDepartment(node.nodeId, dept.departmentId); }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              )}
              {selectedUser && nodes.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Select a user, check the departments for each node you want to grant access to, then click "Save Changes". Unchecking all departments for a node will remove access.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
