import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { authService, Node } from '../services/AuthService';
import { apiClient } from '../services/apiClient';

interface SchoolAssignment {
  schoolId: string;
  nodeId: string;
  schoolSource: string;
}

interface AvailableSchool {
  id: string;
  name: string;
  source: 'nex' | 'mb';
}

export default function SchoolAssignment() {
  const { showToast } = useToast();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [assignments, setAssignments] = useState<SchoolAssignment[]>([]);
  const [availableSchools, setAvailableSchools] = useState<AvailableSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadNodes(); }, []);
  useEffect(() => {
    if (selectedNode) loadAssignments();
    else setAssignments([]);
  }, [selectedNode]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const data = await authService.getNodes(false);
      setNodes(data);
    } catch (err: any) {
      console.error('Failed to load nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!selectedNode) return;
    try {
      const data = await authService.getSchoolsInNode(selectedNode);
      setAssignments(data);
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    }
  };

  const loadAvailableSchools = async () => {
    try {
      const schools = await apiClient.get<AvailableSchool[]>('/api/admin/schools');
      setAvailableSchools(schools);
    } catch (err: any) {
      console.error('Failed to load available schools:', err);
      setAvailableSchools([]);
    }
  };

  const handleAssignSchool = async (schoolId: string, schoolSource: 'nex' | 'mb') => {
    if (!selectedNode) { showToast('Please select a node first', 'error'); return; }
    try {
      await authService.assignSchoolToNode(selectedNode, schoolId, schoolSource);
      setShowAssignModal(false);
      loadAssignments();
      showToast('School assigned successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to assign school', 'error');
    }
  };

  const handleUnassignSchool = async (schoolId: string, schoolSource: string) => {
    if (!selectedNode) return;
    if (!confirm(`Unassign ${schoolId} (${schoolSource}) from this node?`)) return;
    try {
      await authService.unassignSchoolFromNode(selectedNode, schoolId, schoolSource as 'nex' | 'mb');
      loadAssignments();
      showToast('School unassigned successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to unassign school', 'error');
    }
  };

  const filteredSchools = availableSchools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SchoolIcon /> School Assignment
          </Typography>
          <Typography color="text.secondary">Assign schools to organizational nodes</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessIcon /> Select Node
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Node</InputLabel>
                <Select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)} label="Node">
                  <MenuItem value="">-- Select a node --</MenuItem>
                  {nodes.map((node) => (
                    <MenuItem key={node.nodeId} value={node.nodeId}>
                      {node.nodeDescription} ({node.nodeId}){node.isHeadOffice && ' - HQ'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon /> Assigned Schools
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { loadAvailableSchools(); setShowAssignModal(true); }}>
                    Assign School
                  </Button>
                </Box>
                {assignments.length === 0 ? (
                  <Typography color="text.secondary">No schools assigned to this node</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {assignments.map((a) => (
                      <Box key={`${a.schoolId}-${a.schoolSource}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography fontWeight={500}>{a.schoolId}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>({a.schoolSource})</Typography>
                        <IconButton size="small" color="error" onClick={() => handleUnassignSchool(a.schoolId, a.schoolSource)} title="Unassign">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {showAssignModal && selectedNode && (
          <Dialog open onClose={() => { setShowAssignModal(false); setSearchTerm(''); }} maxWidth="sm" fullWidth>
            <DialogTitle>Assign School to Node</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon /></InputAdornment>
                  ),
                }}
              />
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredSchools.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    {searchTerm ? 'No schools found' : 'Loading schools...'}<br />
                    <Typography variant="caption">You may need to configure school data sources first</Typography>
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredSchools.map((school) => (
                      <Button
                        key={`${school.source}-${school.id}`}
                        fullWidth
                        variant="outlined"
                        onClick={() => handleAssignSchool(school.id, school.source)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={500}>{school.name}</Typography>
                          <Typography variant="body2" color="text.secondary">ID: {school.id} • Source: {school.source.toUpperCase()}</Typography>
                        </Box>
                        <AddIcon color="primary" />
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setShowAssignModal(false); setSearchTerm(''); }}>Cancel</Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Box>
  );
}
