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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import { authService, Node } from '../services/AuthService';

export default function NodeManagement() {
  const { showToast } = useToast();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [flatNodes, setFlatNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [headOfficeNodeId, setHeadOfficeNodeId] = useState<string | null>(null);

  useEffect(() => { loadNodes(); }, []);
  useEffect(() => {
    const hqNode = flatNodes.find(n => n.isHeadOffice);
    setHeadOfficeNodeId(hqNode?.nodeId || null);
  }, [flatNodes]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const [treeData, flatData] = await Promise.all([
        authService.getNodes(true),
        authService.getNodes(false),
      ]);
      setNodes(Array.isArray(treeData) ? treeData : []);
      setFlatNodes(Array.isArray(flatData) ? flatData : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) newSet.delete(nodeId);
      else newSet.add(nodeId);
      return newSet;
    });
  };

  const handleCreateNode = async (nodeData: { nodeId: string; nodeDescription: string; isHeadOffice: boolean; isSchoolNode: boolean; parentNodeId: string | null }) => {
    try {
      await authService.createNode(nodeData);
      setShowCreateModal(false);
      loadNodes();
      showToast('Node created successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create node', 'error');
    }
  };

  const handleUpdateNode = async (nodeId: string, updates: { isHeadOffice?: boolean; isSchoolNode?: boolean }) => {
    try {
      await authService.updateNode(nodeId, updates);
      loadNodes();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update node', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading nodes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BusinessIcon /> Node Management
            </Typography>
            <Typography color="text.secondary">Manage organizational hierarchy</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
            Create Node
          </Button>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.dark', color: 'white', borderRadius: 1 }}>{error}</Box>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountTreeIcon /> Organizational Hierarchy
            </Typography>
            <NodeTree nodes={nodes} expandedNodes={expandedNodes} onToggleExpand={toggleExpand} headOfficeNodeId={headOfficeNodeId} onUpdateNode={handleUpdateNode} showToast={showToast} />
          </CardContent>
        </Card>

        {showCreateModal && (
          <CreateNodeModal nodes={flatNodes} headOfficeNodeId={headOfficeNodeId} onClose={() => setShowCreateModal(false)} onCreate={handleCreateNode} showToast={showToast} />
        )}
      </Box>
    </Box>
  );
}

function NodeTree({ nodes, expandedNodes, onToggleExpand, headOfficeNodeId, onUpdateNode, showToast, level = 0 }: {
  nodes: Node[]; expandedNodes: Set<string>; onToggleExpand: (id: string) => void;
  headOfficeNodeId: string | null; onUpdateNode: (id: string, u: any) => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void; level?: number;
}) {
  if (nodes.length === 0) return <Typography color="text.secondary">No nodes found. Create your first node!</Typography>;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {nodes.map((node) => (
        <NodeItem key={node.nodeId} node={node} level={level} expandedNodes={expandedNodes} onToggleExpand={onToggleExpand} headOfficeNodeId={headOfficeNodeId} onUpdateNode={onUpdateNode} showToast={showToast} />
      ))}
    </Box>
  );
}

function NodeItem({ node, level, expandedNodes, onToggleExpand, headOfficeNodeId, onUpdateNode, showToast }: {
  node: Node; level: number; expandedNodes: Set<string>; onToggleExpand: (id: string) => void;
  headOfficeNodeId: string | null; onUpdateNode: (id: string, u: any) => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}) {
  const indent = level * 24;
  const isExpanded = expandedNodes.has(node.nodeId);
  const hasChildren = node.children && node.children.length > 0;
  const isHeadOffice = node.isHeadOffice;
  const isSchoolNode = node.isSchoolNode || false;
  const canSetHeadOffice = !headOfficeNodeId || headOfficeNodeId === node.nodeId;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 0.5, ml: `${indent}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {hasChildren ? (
            <Button size="small" onClick={() => onToggleExpand(node.nodeId)} sx={{ minWidth: 32, p: 0.5 }}>
              {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </Button>
          ) : (
            <Box sx={{ width: 32 }} />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={500}>{node.nodeDescription}</Typography>
            <Typography variant="body2" color="text.secondary">({node.nodeId})</Typography>
            {isHeadOffice && <Box component="span" sx={{ px: 1, py: 0.25, bgcolor: 'warning.dark', color: 'white', borderRadius: 1, fontSize: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}><BusinessIcon sx={{ fontSize: 14 }} /> HQ</Box>}
            {isSchoolNode ? (
              <Box component="span" sx={{ px: 1, py: 0.25, bgcolor: 'primary.dark', color: 'white', borderRadius: 1, fontSize: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}><SchoolIcon sx={{ fontSize: 14 }} /> School</Box>
            ) : (
              <Box component="span" sx={{ px: 1, py: 0.25, bgcolor: 'action.selected', borderRadius: 1, fontSize: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}><WorkIcon sx={{ fontSize: 14 }} /> Office</Box>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isHeadOffice}
                onChange={(e) => {
                  if (e.target.checked && !canSetHeadOffice) {
                    showToast(`Another node (${headOfficeNodeId}) is already set as Head Office.`, 'error');
                    return;
                  }
                  onUpdateNode(node.nodeId, { isHeadOffice: e.target.checked });
                }}
                disabled={!canSetHeadOffice && !isHeadOffice}
              />
            }
            label={<Typography variant="body2">Head Office</Typography>}
          />
          <FormControlLabel
            control={<Checkbox checked={isSchoolNode} onChange={(e) => onUpdateNode(node.nodeId, { isSchoolNode: e.target.checked })} />}
            label={<Typography variant="body2">School Node</Typography>}
          />
        </Box>
      </Box>
      {hasChildren && isExpanded && (
        <NodeTree nodes={node.children!} expandedNodes={expandedNodes} onToggleExpand={onToggleExpand} headOfficeNodeId={headOfficeNodeId} onUpdateNode={onUpdateNode} showToast={showToast} level={level + 1} />
      )}
    </Box>
  );
}

function CreateNodeModal({ nodes, headOfficeNodeId, onClose, onCreate, showToast }: {
  nodes: Node[]; headOfficeNodeId: string | null; onClose: () => void;
  onCreate: (data: { nodeId: string; nodeDescription: string; isHeadOffice: boolean; isSchoolNode: boolean; parentNodeId: string | null }) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}) {
  const [nodeId, setNodeId] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(false);
  const [isSchoolNode, setIsSchoolNode] = useState(false);
  const [parentNodeId, setParentNodeId] = useState<string>('');

  const flattenNodes = (nodeList: Node[], result: Node[] = []): Node[] => {
    nodeList.forEach((node) => {
      result.push(node);
      if (node.children) flattenNodes(node.children, result);
    });
    return result;
  };
  const allNodes = flattenNodes(nodes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId || !nodeDescription) { showToast('Node ID and Description are required', 'error'); return; }
    if (isHeadOffice && headOfficeNodeId) {
      showToast(`Another node (${headOfficeNodeId}) is already set as Head Office.`, 'error');
      return;
    }
    onCreate({ nodeId, nodeDescription, isHeadOffice, isSchoolNode, parentNodeId: parentNodeId || null });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Node</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Node ID *" value={nodeId} onChange={(e) => setNodeId(e.target.value)} required fullWidth placeholder="e.g., IN-N, UAE" />
          <TextField label="Description *" value={nodeDescription} onChange={(e) => setNodeDescription(e.target.value)} required fullWidth placeholder="e.g., India North Region" />
          <FormControlLabel
            control={
              <Checkbox
                checked={isHeadOffice}
                onChange={(e) => {
                  if (e.target.checked && headOfficeNodeId) {
                    showToast(`Another node (${headOfficeNodeId}) is already set as Head Office.`, 'error');
                    return;
                  }
                  setIsHeadOffice(e.target.checked);
                }}
                disabled={!!headOfficeNodeId}
              />
            }
            label="Is Head Office"
          />
          {headOfficeNodeId && <Typography variant="caption" color="warning.main">Currently: {headOfficeNodeId}</Typography>}
          <FormControlLabel control={<Checkbox checked={isSchoolNode} onChange={(e) => setIsSchoolNode(e.target.checked)} />} label="Is School Node" />
          <FormControl fullWidth>
            <InputLabel>Parent Node (optional)</InputLabel>
            <Select value={parentNodeId} onChange={(e) => setParentNodeId(e.target.value)} label="Parent Node (optional)">
              <MenuItem value="">-- None (Root Node) --</MenuItem>
              {allNodes.map((node) => (
                <MenuItem key={node.nodeId} value={node.nodeId}>{node.nodeDescription} ({node.nodeId})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Create Node</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
