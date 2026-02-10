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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import { authService, Department } from '../services/AuthService';

export default function DepartmentManagement() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { loadDepartments(); }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await authService.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (deptData: {
    departmentId: string;
    departmentName: string;
    departmentDescription?: string;
    schemaName?: string;
    displayOrder?: number;
  }) => {
    try {
      await authService.createDepartment(deptData);
      setShowCreateModal(false);
      loadDepartments();
      showToast('Department created successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create department', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading departments...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WorkIcon /> Department Management
            </Typography>
            <Typography color="text.secondary">Manage departments and roles</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
            Create Department
          </Button>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{error}</Box>
        )}

        <Paper sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Schema</TableCell>
                <TableCell>Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.departmentId} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{dept.departmentId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{dept.departmentName}</TableCell>
                  <TableCell>{dept.departmentDescription || '-'}</TableCell>
                  <TableCell>{dept.schemaName || '-'}</TableCell>
                  <TableCell>{dept.displayOrder || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {departments.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ mt: 3 }}>No departments found. Create your first department!</Typography>
        )}

        <CreateDepartmentModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateDepartment} open={showCreateModal} showToast={showToast} />
      </Box>
    </Box>
  );
}

function CreateDepartmentModal({ onClose, onCreate, open, showToast }: { onClose: () => void; onCreate: (data: any) => void; open: boolean; showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const [departmentId, setDepartmentId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [schemaName, setSchemaName] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId || !departmentName) {
      showToast('Department ID and Name are required', 'error');
      return;
    }
    onCreate({
      departmentId: departmentId.toUpperCase(),
      departmentName,
      departmentDescription: departmentDescription || undefined,
      schemaName: schemaName || undefined,
      displayOrder: displayOrder !== '' ? Number(displayOrder) : undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Department</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Department ID *" value={departmentId} onChange={(e) => setDepartmentId(e.target.value.toUpperCase())} required fullWidth placeholder="e.g., MARKETING, IT" helperText="Uppercase letters and numbers only" />
          <TextField label="Department Name *" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required fullWidth placeholder="e.g., Marketing" />
          <TextField label="Description" value={departmentDescription} onChange={(e) => setDepartmentDescription(e.target.value)} multiline rows={3} fullWidth placeholder="Brief description" />
          <TextField label="Schema Name (optional)" value={schemaName} onChange={(e) => setSchemaName(e.target.value)} fullWidth placeholder="e.g., nex, mb" />
          <TextField label="Display Order (optional)" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value ? parseInt(e.target.value) : '')} fullWidth placeholder="e.g., 5" helperText="Lower numbers appear first" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Create Department</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
