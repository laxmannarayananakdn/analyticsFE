import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import { nexquareConfigService, NexquareSchoolConfig } from '../services/NexquareConfigService';
import { authService } from '../services/AuthService';
import { apiClient } from '../services/apiClient';

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST';
  icon: React.ReactNode;
  requiresSchoolId?: boolean;
  params?: {
    key: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
}

interface ApiResult {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
  error?: string;
}

const NEXQUARE_ENDPOINTS: ApiEndpoint[] = [
  { id: 'authenticate', name: 'Authenticate', description: 'Test authentication and get OAuth token', method: 'POST', icon: <CheckCircleIcon /> },
  { id: 'schools', name: 'Get Schools', description: 'Fetch all schools/entities from Nexquare', method: 'GET', icon: <SchoolIcon />, params: [{ key: 'filter', label: 'Filter (optional)', type: 'text', placeholder: "e.g., status='active'" }] },
  { id: 'verify-school', name: 'Verify School Access', description: 'Verify access to a specific school', method: 'GET', icon: <CheckCircleIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }] },
  { id: 'students', name: 'Get Students', description: 'Fetch all students for a school', method: 'GET', icon: <PeopleIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }, { key: 'filter', label: 'Filter (optional)', type: 'text', placeholder: "e.g., status='active'" }, { key: 'fetchMode', label: 'Fetch Mode', type: 'select', options: [{ value: '1', label: 'Enrolled only' }, { value: '2', label: 'Preadmission only' }, { value: '3', label: 'Both' }] }] },
  { id: 'staff', name: 'Get Staff', description: 'Fetch all staff/teachers for a school', method: 'GET', icon: <PeopleIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }, { key: 'filter', label: 'Filter (optional)', type: 'text', placeholder: "e.g., status='active'" }] },
  { id: 'classes', name: 'Get Classes', description: 'Fetch all classes for a school', method: 'GET', icon: <MenuBookIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }] },
  { id: 'allocation-master', name: 'Get Allocation Master', description: 'Fetch allocation master data', method: 'GET', icon: <AssignmentIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }] },
  { id: 'student-allocations', name: 'Get Student Allocations', description: 'Fetch student allocations', method: 'GET', icon: <AssignmentIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }] },
  { id: 'staff-allocations', name: 'Get Staff Allocations', description: 'Fetch staff allocations', method: 'GET', icon: <AssignmentIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }] },
  { id: 'daily-plans', name: 'Get Daily Plans', description: 'Fetch daily plans/timetable', method: 'GET', icon: <CalendarMonthIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }, { key: 'fromDate', label: 'From Date', type: 'date', placeholder: 'YYYY-MM-DD' }, { key: 'toDate', label: 'To Date', type: 'date', placeholder: 'YYYY-MM-DD' }, { key: 'subject', label: 'Subject (optional)', type: 'text' }, { key: 'classId', label: 'Class ID (optional)', type: 'text' }] },
  { id: 'daily-attendance', name: 'Get Daily Attendance', description: 'Fetch daily attendance records', method: 'GET', icon: <AccessTimeIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }, { key: 'startDate', label: 'Start Date', type: 'date', placeholder: 'YYYY-MM-DD' }, { key: 'endDate', label: 'End Date', type: 'date', placeholder: 'YYYY-MM-DD' }, { key: 'categoryRequired', label: 'Category Required', type: 'select', options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }] }] },
  { id: 'lesson-attendance', name: 'Get Lesson Attendance', description: 'Fetch lesson attendance records', method: 'GET', icon: <AccessTimeIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }, { key: 'startDate', label: 'Start Date', type: 'date', placeholder: 'YYYY-MM-DD' }, { key: 'endDate', label: 'End Date', type: 'date', placeholder: 'YYYY-MM-DD' }] },
  { id: 'student-assessments', name: 'Get Student Assessments', description: 'Fetch student assessment/grade book data (CSV)', method: 'GET', icon: <DescriptionIcon />, requiresSchoolId: true, params: [{ key: 'schoolId', label: 'School ID', type: 'text', placeholder: 'Enter school sourced ID' }, { key: 'academicYear', label: 'Academic Year', type: 'text', placeholder: 'e.g., 2024' }, { key: 'fileName', label: 'File Name (optional)', type: 'text', placeholder: 'assessment-data' }] },
];

export default function NexquareDataSync() {
  const [configs, setConfigs] = useState<NexquareSchoolConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  /** School ID (sourced_id) from last successful Authenticate or Get Schools, used to pre-fill other APIs */
  const [populatedSchoolId, setPopulatedSchoolId] = useState<string | null>(null);

  useEffect(() => { loadConfigs(); }, []);

  useEffect(() => {
    if (selectedConfigId != null && !configs.some(c => Number(c.id) === Number(selectedConfigId))) {
      setSelectedConfigId(null);
      setSelectedEndpoint(null);
      setResult(null);
      setPopulatedSchoolId(null);
    }
  }, [configs, selectedConfigId]);

  const loadConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const [allConfigs, mySchools] = await Promise.all([
        nexquareConfigService.getConfigs(),
        authService.getMySchools().catch(() => []),
      ]);
      const activeConfigs = allConfigs.filter(c => c.is_active);
      // Filter: show configs where user has school access, OR config has no school_id yet (new configs - user can sync to populate)
      const nexSchoolIds = new Set(
        (mySchools || []).filter(s => s.schoolSource === 'nex').map(s => s.schoolId)
      );
      const filtered = activeConfigs.filter(c => {
        const sid = c.school_id != null ? String(c.school_id).trim() : null;
        const hasNoSchoolId = !sid || sid === '';
        const hasAccess = nexSchoolIds.size > 0 && sid && nexSchoolIds.has(sid);
        return hasNoSchoolId || hasAccess;
      });
      setConfigs(filtered);
    } catch (error: any) {
      console.error('Error loading configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleParamChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setResult(null);
    setSyncLogs([]);
    const initialParams: Record<string, string> = {};
    endpoint.params?.forEach(param => {
      if (param.type === 'select' && param.options && param.options.length > 0) {
        const first = param.options[0];
        if (first) initialParams[param.key] = first.value;
      }
      // Pre-fill School ID from last successful Authenticate or Get Schools
      if (param.key === 'schoolId' && populatedSchoolId) {
        initialParams[param.key] = populatedSchoolId;
      }
    });
    setParams(initialParams);
  };

  const handleExecute = async () => {
    if (!selectedConfigId || !selectedEndpoint) return;
    setLoading(true);
    setResult(null);
    const queryParams = new URLSearchParams();
    queryParams.append('config_id', selectedConfigId.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim() !== '') queryParams.append(key, value);
    });

    const useSyncStream = ['students', 'staff', 'classes', 'student-assessments'].includes(selectedEndpoint.id);

    // All endpoints show sync logs - add initial log so card appears immediately
    setSyncLogs(useSyncStream ? [`📋 Starting ${selectedEndpoint.name}...`] : [`📋 Requesting ${selectedEndpoint.name}...`]);

    if (useSyncStream) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const streamUrl = `${baseUrl}/api/nexquare/sync-stream/${selectedEndpoint.id}?${queryParams.toString()}`;
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { Accept: 'text/event-stream' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const resp = await fetch(streamUrl, { headers, credentials: 'include' });
        if (!resp.ok) {
          const errText = await resp.text();
          const errMsg = errText || `HTTP ${resp.status}`;
          setSyncLogs(prev => [...prev, `❌ Failed: ${errMsg}`]);
          setResult({ success: false, message: 'Stream failed', error: errMsg });
          setLoading(false);
          return;
        }
        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const blocks = buffer.split('\n\n');
              buffer = blocks.pop() || '';
              for (const block of blocks) {
                const m = block.match(/^data:\s*(.+)/m);
                if (m) {
                  try {
                    const ev = JSON.parse(m[1]);
                    if (ev.type === 'log') setSyncLogs((prev) => [...prev, ev.msg]);
                    else if (ev.type === 'done') {
                      if (ev.success) {
                        setResult({ success: true, message: 'Sync completed', data: ev.data, count: ev.count });
                        if (ev.schoolId && typeof ev.schoolId === 'string') setPopulatedSchoolId(ev.schoolId);
                      } else {
                        setResult({ success: false, message: 'Sync failed', error: ev.error });
                      }
                    }
                  } catch {
                    /* ignore */
                  }
                }
              }
            }
            if (buffer) {
              const m = buffer.match(/^data:\s*(.+)/m);
              if (m) {
                try {
                  const ev = JSON.parse(m[1]);
                  if (ev.type === 'log') setSyncLogs((prev) => [...prev, ev.msg]);
                  else if (ev.type === 'done') {
                    if (ev.success) {
                      setResult({ success: true, message: 'Sync completed', data: ev.data, count: ev.count });
                      if (ev.schoolId && typeof ev.schoolId === 'string') setPopulatedSchoolId(ev.schoolId);
                    } else {
                      setResult({ success: false, message: 'Sync failed', error: ev.error });
                    }
                  }
                } catch {
                  /* ignore */
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      } catch (error: any) {
        setResult({ success: false, message: 'Request failed', error: error.message || 'Unknown error' });
      }
      setLoading(false);
      return;
    }

    try {
      const SYNC_TIMEOUT = 300000; // 5 min for non-streaming endpoints
      let response: ApiResult;
      if (selectedEndpoint.method === 'POST') {
        response = await apiClient.post<ApiResult>(`/api/nexquare/${selectedEndpoint.id}?${queryParams.toString()}`, {}, SYNC_TIMEOUT);
      } else {
        response = await apiClient.get<ApiResult>(`/api/nexquare/${selectedEndpoint.id}?${queryParams.toString()}`, undefined, SYNC_TIMEOUT);
      }
      setResult(response);
      setSyncLogs(prev => [...prev, response.success ? `✅ ${response.message || 'Completed'}` + (response.count != null ? ` — ${response.count} record(s)` : '') : `❌ Failed: ${(response as any).error || response.message}`]);
      // Capture School ID from response so we can pre-fill when user selects other APIs
      if (response.success) {
        const schoolId =
          (response as any).schoolId ??
          (response as any).currentSchoolId ??
          (Array.isArray((response as any).schools) && (response as any).schools[0]?.sourcedId
            ? (response as any).schools[0].sourcedId
            : null);
        if (schoolId && typeof schoolId === 'string') {
          setPopulatedSchoolId(schoolId);
        }
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || 'Unknown error';
      setResult({ success: false, message: 'Request failed', error: errMsg });
      setSyncLogs(prev => [...prev, `❌ Failed: ${errMsg}`]);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = configs.find(c => Number(c.id) === Number(selectedConfigId));

  type ParamDef = NonNullable<ApiEndpoint['params']>[number];
  const renderParamInput = (param: ParamDef) => {
    if (param.type === 'select') {
      return (
        <FormControl fullWidth key={param.key}>
          <InputLabel>{param.label}</InputLabel>
          <Select value={params[param.key] || ''} onChange={(e) => handleParamChange(param.key, e.target.value)} label={param.label}>
            {(param.options ?? []).map((opt: { value: string; label: string }) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
      );
    }
    if (param.type === 'date') {
      return <TextField key={param.key} label={param.label} type="date" value={params[param.key] || ''} onChange={(e) => handleParamChange(param.key, e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />;
    }
    return <TextField key={param.key} label={param.label} type={param.type} value={params[param.key] || ''} onChange={(e) => handleParamChange(param.key, e.target.value)} placeholder={param.placeholder} fullWidth />;
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StorageIcon /> Nexquare Data Sync
          </Typography>
          <Typography color="text.secondary">Trigger Nexquare API calls to sync data for specific schools</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 2fr' }, gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Select School</Typography>
                {loadingConfigs ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={24} /> <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading schools...</Typography></Box>
                ) : configs.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center">
                    No active configurations found.<br />
                    <Link component={RouterLink} to="/admin/nexquare-config">Add configuration →</Link>
                  </Typography>
                ) : (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>School</InputLabel>
                      <Select
                        value={selectedConfigId != null ? String(selectedConfigId) : ''}
                        onChange={(e) => { const v = e.target.value; setSelectedConfigId(v ? parseInt(v, 10) : null); setSelectedEndpoint(null); setResult(null); setPopulatedSchoolId(null); }}
                        label="School"
                      >
                        <MenuItem value="">-- Select School --</MenuItem>
                        {configs.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.school_name} ({c.country})</MenuItem>)}
                      </Select>
                    </FormControl>
                    {selectedConfig && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">Domain: {selectedConfig.domain_url}</Typography>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {selectedConfigId && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Available APIs</Typography>
                  <Box sx={{ maxHeight: 600, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {NEXQUARE_ENDPOINTS.map((ep) => (
                      <Button
                        key={ep.id}
                        fullWidth
                        variant={selectedEndpoint?.id === ep.id ? 'contained' : 'outlined'}
                        onClick={() => handleEndpointSelect(ep)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          {ep.icon}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{ep.name}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }} noWrap>{ep.description}</Typography>
                          </Box>
                          <Typography component="span" variant="caption" sx={{ bgcolor: ep.method === 'POST' ? 'success.main' : 'primary.main', color: 'white', px: 1, py: 0.25, borderRadius: 1 }}>{ep.method}</Typography>
                        </Box>
                      </Button>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selectedEndpoint && selectedConfigId && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedEndpoint.icon} {selectedEndpoint.name}
                    </Typography>
                    <Button variant="contained" onClick={handleExecute} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}>
                      {loading ? 'Executing...' : 'Execute'}
                    </Button>
                  </Box>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>{selectedEndpoint.description}</Typography>
                  {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedEndpoint.params.map(renderParamInput)}
                    </Box>
                  )}
                  {(!selectedEndpoint.params || selectedEndpoint.params.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No additional parameters required.</Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {(result || syncLogs.length > 0) && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {result?.success !== false ? <CheckCircleIcon color="success" /> : result ? <ErrorIcon color="error" /> : null} {result ? 'Result' : 'Sync Log'}
                    </Typography>
                    <IconButton size="small" onClick={() => { setResult(null); setSyncLogs([]); }}><CloseIcon /></IconButton>
                  </Box>
                  {syncLogs.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Output</Typography>
                      <Box component="pre" sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', borderRadius: 1, fontFamily: 'monospace', fontSize: 12, overflow: 'auto', maxHeight: 320 }}>
                        {syncLogs.map((line, i) => (
                          <Box key={i} component="span" sx={{ display: 'block' }}>{line}</Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {result && (
                    <>
                      <Box sx={{ p: 2, borderRadius: 1, bgcolor: result.success ? 'success.dark' : 'error.dark', color: 'white', mb: 2 }}>
                        <Typography fontWeight={600}>{result.message}</Typography>
                        {result.error && <Typography variant="body2" sx={{ mt: 1 }}>{result.error}</Typography>}
                        {result.count !== undefined && <Typography variant="body2" sx={{ mt: 1 }}>Records fetched: <strong>{result.count}</strong></Typography>}
                      </Box>
                    </>
                  )}
                  {result?.data && (
                    <Box sx={{ mt: 2 }}>
                      <details>
                        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>View Response Data</summary>
                        <Box component="pre" sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, overflow: 'auto', maxHeight: 400, fontSize: 12 }}>
                          {JSON.stringify(result.data, null, 2)}
                        </Box>
                      </details>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedEndpoint && selectedConfigId && (
              <Card>
                <CardContent>
                  <Typography color="text.secondary" textAlign="center">Select an API endpoint from the left to get started</Typography>
                </CardContent>
              </Card>
            )}
            {!selectedConfigId && (
              <Card>
                <CardContent>
                  <Typography color="text.secondary" textAlign="center">Select a school configuration to begin</Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
