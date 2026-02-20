import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { syncService, SyncRun } from '../services/SyncService';
import { authService, Node } from '../services/AuthService';

function formatDate(s: string | null): string {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

function StatusChip({ status }: { status: SyncRun['status'] }) {
  const color =
    status === 'completed' ? 'success' :
    status === 'running' || status === 'pending' ? 'info' :
    status === 'failed' ? 'error' :
    status === 'cancelled' ? 'warning' : 'default';
  return <Chip label={status} size="small" color={color} />;
}

export default function SyncHistory() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterNode, setFilterNode] = useState<string>('');
  const [triggerNode, setTriggerNode] = useState<string>('');
  const [triggerYear, setTriggerYear] = useState<string>(new Date().getFullYear().toString());
  const [triggerAll, setTriggerAll] = useState(false);

  useEffect(() => {
    load();
  }, [filterStatus, filterNode]);

  const load = async () => {
    try {
      setLoading(true);
      const [runsRes, nodesRes] = await Promise.all([
        syncService.getRuns({
          status: filterStatus || undefined,
          node_id: filterNode || undefined,
          limit: 100,
        }),
        authService.getNodes(false),
      ]);
      setRuns(runsRes);
      setNodes(Array.isArray(nodesRes) ? nodesRes : []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load sync history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    if (!triggerAll && !triggerNode) {
      showToast('Select a node or check "Sync All" to trigger', 'error');
      return;
    }
    try {
      setTriggering(true);
      const { runId } = await syncService.trigger({
        ...(triggerAll ? { all: true } : { nodeId: triggerNode, includeDescendants: true }),
        academicYear: triggerYear,
      });
      showToast(`Sync started (Run #${runId})`, 'success');
      navigate(`/admin/sync-runs/${runId}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to trigger sync', 'error');
    } finally {
      setTriggering(false);
    }
  };

  if (loading && runs.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading sync history...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HistoryIcon /> Sync History
            </Typography>
            <Typography color="text.secondary">View sync runs and trigger manual syncs</Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Trigger Manual Sync</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Start a sync for a node (includes all schools in that node and its children) or all schools</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Checkbox checked={triggerAll} onChange={(e) => setTriggerAll(e.target.checked)} />}
                label="Sync All"
              />
              <FormControl size="small" sx={{ minWidth: 180 }} disabled={triggerAll}>
                <InputLabel>Node</InputLabel>
                <Select
                  value={triggerNode}
                  label="Node"
                  onChange={(e) => setTriggerNode(e.target.value)}
                >
                  {nodes.map((n) => (
                    <MenuItem key={n.nodeId} value={n.nodeId}>
                      {n.nodeDescription || n.nodeId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Academic Year</InputLabel>
                <Select value={triggerYear} label="Academic Year" onChange={(e) => setTriggerYear(e.target.value)}>
                  <MenuItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</MenuItem>
                  <MenuItem value={String(new Date().getFullYear() - 1)}>{new Date().getFullYear() - 1}</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleTrigger}
                disabled={triggering || (!triggerAll && !triggerNode)}
              >
                Run Sync
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Sync Runs</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Node</InputLabel>
                <Select value={filterNode} label="Node" onChange={(e) => setFilterNode(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {nodes.map((n) => (
                    <MenuItem key={n.nodeId} value={n.nodeId}>
                      {n.nodeDescription || n.nodeId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {runs.length === 0 ? (
              <Typography color="text.secondary">No sync runs found.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Node</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell align="right">Succeeded</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell>Triggered By</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.node_id}</TableCell>
                      <TableCell>{r.academic_year}</TableCell>
                      <TableCell>
                        <StatusChip status={r.status} />
                      </TableCell>
                      <TableCell>{formatDate(r.started_at)}</TableCell>
                      <TableCell>{formatDate(r.completed_at)}</TableCell>
                      <TableCell align="right">{r.schools_succeeded}</TableCell>
                      <TableCell align="right">{r.schools_failed}</TableCell>
                      <TableCell>{r.triggered_by}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" onClick={() => navigate(`/admin/sync-runs/${r.id}`)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
