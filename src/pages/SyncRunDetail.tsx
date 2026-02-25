import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import StopIcon from '@mui/icons-material/Stop';
import { syncService, SyncRun, SyncRunSchool, SyncRunSchoolEndpoint } from '../services/SyncService';

function formatDate(s: string | null): string {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

function SchoolStatusChip({ status }: { status: SyncRunSchool['status'] }) {
  const color =
    status === 'completed' ? 'success' :
    status === 'running' || status === 'pending' ? 'info' :
    status === 'failed' ? 'error' :
    status === 'skipped' ? 'warning' : 'default';
  return <Chip label={status} size="small" color={color} />;
}

function formatDuration(started: string, completed: string): string {
  try {
    const s = new Date(started).getTime();
    const c = new Date(completed).getTime();
    const sec = Math.round((c - s) / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  } catch {
    return '—';
  }
}

function SchoolEndpointsRow({ school }: { school: SyncRunSchool }) {
  const [open, setOpen] = useState(false);
  const endpoints = ((): SyncRunSchoolEndpoint[] => {
    const raw = school.endpoints_completed;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  })();

  if (endpoints.length === 0) return null;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell colSpan={7} sx={{ py: 0 }}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label={open ? 'collapse' : 'expand'}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          <Typography component="span" variant="body2" color="text.secondary">
            {open ? 'Hide' : 'Show'} API timing ({endpoints.length} endpoints)
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>API</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpoints.map((ep, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{ep.endpoint}</TableCell>
                      <TableCell>{formatDate(ep.started_at)}</TableCell>
                      <TableCell>{formatDate(ep.completed_at)}</TableCell>
                      <TableCell>{formatDuration(ep.started_at, ep.completed_at)}</TableCell>
                      <TableCell>
                        {ep.error ? (
                          <Typography variant="body2" color="error" sx={{ maxWidth: 280 }} noWrap title={ep.error}>
                            {ep.error}
                          </Typography>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const POLL_INTERVAL_MS = 5000;

export default function SyncRunDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [run, setRun] = useState<SyncRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const runId = id ? parseInt(id, 10) : NaN;

  const load = async () => {
    if (isNaN(runId)) return;
    try {
      setLoading(true);
      const r = await syncService.getRun(runId);
      setRun(r);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load run', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [runId]);

  const handleCancel = async () => {
    if (isNaN(runId)) return;
    try {
      setCancelling(true);
      const res = await syncService.cancelRun(runId);
      showToast(res.message || 'Cancel requested. Run will stop within seconds.', 'success');
      load();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to cancel run', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Poll while running
  useEffect(() => {
    if (!run || (run.status !== 'running' && run.status !== 'pending')) return;
    const t = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [run?.id, run?.status]);

  if (isNaN(runId)) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
          <Alert severity="error">Invalid run ID</Alert>
          <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/sync-history')}>
            Back to Sync History
          </Button>
        </Box>
      </Box>
    );
  }

  if (loading && !run) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading run...</Typography>
      </Box>
    );
  }

  if (!run) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
          <Alert severity="error">Run not found</Alert>
          <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/sync-history')}>
            Back to Sync History
          </Button>
        </Box>
      </Box>
    );
  }

  const schools = run.schools || [];
  const isComplete = run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled';
  const canCancel = run.status === 'pending' || run.status === 'running';

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/sync-history')} sx={{ mb: 1 }}>
              Back to Sync History
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Sync Run #{run.id}
            </Typography>
            <Typography color="text.secondary">
              {run.node_id} • {run.academic_year} • {run.triggered_by}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canCancel && (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Run'}
              </Button>
            )}
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
              Refresh
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Run Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>
                  <Chip
                    label={run.status}
                    color={
                      run.status === 'completed' ? 'success' :
                      run.status === 'running' || run.status === 'pending' ? 'info' :
                      run.status === 'failed' ? 'error' :
                      run.status === 'cancelled' ? 'warning' : 'default'
                    }
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Started</Typography>
                <Typography>{formatDate(run.started_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Completed</Typography>
                <Typography>{formatDate(run.completed_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Schools</Typography>
                <Typography>
                  {run.schools_succeeded} succeeded / {run.schools_failed} failed ({run.total_schools} total)
                </Typography>
              </Box>
            </Box>
            {run.error_summary && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {run.error_summary}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Schools ({schools.length})
            </Typography>
            {schools.length === 0 ? (
              <Typography color="text.secondary">
                {isComplete ? 'No school records.' : 'Schools will appear as sync progresses...'}
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>School</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Current API</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((s) => (
                    <React.Fragment key={s.id}>
                      <TableRow hover>
                        <TableCell>{s.school_name || s.school_id}</TableCell>
                        <TableCell>{s.school_source.toUpperCase()}</TableCell>
                        <TableCell>
                          <SchoolStatusChip status={s.status} />
                        </TableCell>
                        <TableCell>
                          {s.current_endpoint ? (
                            <Typography variant="body2" color="primary.main" fontWeight={500}>
                              {s.current_endpoint}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(s.started_at)}</TableCell>
                        <TableCell>{formatDate(s.completed_at)}</TableCell>
                        <TableCell>
                          {s.error_message ? (
                            <Typography variant="body2" color="error" sx={{ maxWidth: 300 }} noWrap title={s.error_message}>
                              {s.error_message}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                      <SchoolEndpointsRow school={s} />
                    </React.Fragment>
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
