import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import FunctionsIcon from '@mui/icons-material/Functions';
import { authService, Node } from '../services/AuthService';
import { MarkGradeTranslationConfig, rpConfigService } from '../services/RPConfigService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ADD_NEW_EFFECTIVE_DATE = '__add_new_effective_date__';
const ADD_NEW_GRADE = '__add_new_grade__';

export default function MarkGradeConfig() {
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [effectiveDates, setEffectiveDates] = useState<string[]>([]);
  const [gradeNames, setGradeNames] = useState<string[]>([]);
  const [rows, setRows] = useState<MarkGradeTranslationConfig[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedEffectiveDate, setSelectedEffectiveDate] = useState('');
  const [selectedGradeName, setSelectedGradeName] = useState('');
  const [newEffectiveDateInput, setNewEffectiveDateInput] = useState('');
  const [newGradeInput, setNewGradeInput] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  useEffect(() => {
    loadNodes();
  }, []);

  useEffect(() => {
    if (!selectedNodeId) {
      setEffectiveDates([]);
      setGradeNames([]);
      setRows([]);
      setSelectedEffectiveDate('');
      setSelectedGradeName('');
      return;
    }
    void loadEffectiveDates();
  }, [selectedNodeId]);

  useEffect(() => {
    if (!selectedNodeId || !selectedEffectiveDate || selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE) {
      setGradeNames([]);
      setRows([]);
      setSelectedGradeName('');
      return;
    }
    void loadGradeNames();
  }, [selectedNodeId, selectedEffectiveDate]);

  useEffect(() => {
    if (!selectedNodeId || !selectedEffectiveDate || selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE || !selectedGradeName || selectedGradeName === ADD_NEW_GRADE) {
      setRows([]);
      return;
    }
    void loadRows();
  }, [selectedNodeId, selectedEffectiveDate, selectedGradeName]);

  const loadNodes = async () => {
    try {
      const data = await authService.getNodes(false);
      const sorted = [...data].sort((a, b) => a.nodeDescription.localeCompare(b.nodeDescription));
      setNodes(sorted);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to load nodes', 'error');
    }
  };

  const loadEffectiveDates = async () => {
    try {
      const data = await rpConfigService.getMarkGradeEffectiveDates(selectedNodeId);
      setEffectiveDates(data);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to load effective dates', 'error');
    }
  };

  const loadGradeNames = async () => {
    try {
      const data = await rpConfigService.getMarkGradeNames(selectedNodeId, selectedEffectiveDate);
      setGradeNames(data);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to load grades', 'error');
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const data = await rpConfigService.getMarkGradeTranslations(selectedNodeId, selectedEffectiveDate, selectedGradeName);
      setRows(data);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to load mappings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    if (!selectedNodeId || !selectedEffectiveDate || selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE || !selectedGradeName || selectedGradeName === ADD_NEW_GRADE) {
      showToast('Select node, effective date, and grade first', 'error');
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        node_id: selectedNodeId,
        effective_date: selectedEffectiveDate,
        grade_name: selectedGradeName,
        marks_start: 0,
        marks_end: 0,
        calculated_grade: '',
        is_active: true,
      },
    ]);
  };

  const updateRow = (index: number, field: keyof MarkGradeTranslationConfig, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeUnsavedRow = (index: number) => {
    if (rows[index]?.id) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteRow = async (id: number) => {
    if (!confirm('Delete this mapping row?')) return;
    try {
      await rpConfigService.deleteMarkGradeTranslation(id);
      showToast('Mapping deleted', 'success');
      await loadRows();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to delete mapping', 'error');
    }
  };

  const saveAll = async () => {
    if (rows.length === 0) {
      showToast('No rows to save', 'info');
      return;
    }
    const invalid = rows.find((r) => r.marks_start == null || r.marks_end == null || r.calculated_grade.trim() === '' || Number(r.marks_start) > Number(r.marks_end));
    if (invalid) {
      showToast('Each row needs valid marks range and calculated grade', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = rows.map((r) => ({
        ...r,
        node_id: selectedNodeId,
        effective_date: selectedEffectiveDate,
        grade_name: selectedGradeName,
      }));
      const result = await rpConfigService.saveMarkGradeTranslations(payload);
      showToast(
        `Saved ${result.successCount ?? 0} row(s)${result.errorCount ? ` (${result.errorCount} error(s))` : ''}`,
        result.errorCount ? 'error' : 'success'
      );
      await loadRows();
      await loadEffectiveDates();
      await loadGradeNames();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to save mappings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNewEffectiveDate = () => {
    const value = newEffectiveDateInput.trim();
    if (!value) {
      showToast('Enter effective date in YYYY-MM-DD format', 'error');
      return;
    }
    setSelectedEffectiveDate(value);
    setEffectiveDates((prev) => (prev.includes(value) ? prev : [value, ...prev].sort().reverse()));
    setNewEffectiveDateInput('');
  };

  const addNewGrade = () => {
    const value = newGradeInput.trim();
    if (!value) {
      showToast('Enter a grade name', 'error');
      return;
    }
    setSelectedGradeName(value);
    setGradeNames((prev) => (prev.includes(value) ? prev : [...prev, value].sort()));
    setNewGradeInput('');
  };

  const dateOptions = [...effectiveDates];
  if (selectedNodeId) dateOptions.push(ADD_NEW_EFFECTIVE_DATE);
  const gradeOptions = [...gradeNames];
  if (selectedNodeId && selectedEffectiveDate && selectedEffectiveDate !== ADD_NEW_EFFECTIVE_DATE) gradeOptions.push(ADD_NEW_GRADE);

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SettingsIcon />
            Mark Grade Translation Config
          </Typography>
          <Typography color="text.secondary">
            Configure mark range to calculated grade mappings by node, effective date, and grade. These rules are used to populate calculated grade in RP assessments.
          </Typography>
        </Box>

        <Snackbar open={toasts.length > 0} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {toasts.map((toast) => (
              <Alert
                key={toast.id}
                severity={toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : 'info'}
                onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                {toast.message}
              </Alert>
            ))}
          </Box>
        </Snackbar>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel>Node *</InputLabel>
                <Select
                  value={selectedNodeId}
                  label="Node *"
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                >
                  <MenuItem value="">Select node</MenuItem>
                  {nodes.map((n) => (
                    <MenuItem key={n.nodeId} value={n.nodeId}>
                      {n.nodeDescription} ({n.nodeId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Effective Date *</InputLabel>
                <Select
                  value={selectedEffectiveDate}
                  label="Effective Date *"
                  onChange={(e) => setSelectedEffectiveDate(e.target.value)}
                  disabled={!selectedNodeId}
                >
                  <MenuItem value="">Select or add</MenuItem>
                  {dateOptions.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d === ADD_NEW_EFFECTIVE_DATE ? '+ Add new' : d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    type="date"
                    value={newEffectiveDateInput}
                    onChange={(e) => setNewEffectiveDateInput(e.target.value)}
                  />
                  <Button variant="outlined" size="small" onClick={addNewEffectiveDate}>
                    Add
                  </Button>
                </Box>
              )}

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Grade *</InputLabel>
                <Select
                  value={selectedGradeName}
                  label="Grade *"
                  onChange={(e) => setSelectedGradeName(e.target.value)}
                  disabled={!selectedNodeId || !selectedEffectiveDate || selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE}
                >
                  <MenuItem value="">Select or add</MenuItem>
                  {gradeOptions.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g === ADD_NEW_GRADE ? '+ Add new' : g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedGradeName === ADD_NEW_GRADE && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="e.g. 10"
                    value={newGradeInput}
                    onChange={(e) => setNewGradeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNewGrade()}
                  />
                  <Button variant="outlined" size="small" onClick={addNewGrade}>
                    Add
                  </Button>
                </Box>
              )}

              <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadRows} disabled={loading || !selectedNodeId || !selectedEffectiveDate || !selectedGradeName || selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE || selectedGradeName === ADD_NEW_GRADE}>
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FunctionsIcon />
                Marks Range to Calculated Grade
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AddIcon />}
                  onClick={addRow}
                  disabled={!selectedNodeId || !selectedEffectiveDate || !selectedGradeName || selectedEffectiveDate === ADD_NEW_EFFECTIVE_DATE || selectedGradeName === ADD_NEW_GRADE}
                >
                  Add Row
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={saveAll} disabled={loading || rows.length === 0}>
                  Save All
                </Button>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define non-overlapping mark ranges. For a given node and AY, the system uses the latest effective date less than or equal to AY end date, with downstream node override.
            </Typography>

            {loading && rows.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Loading...
              </Typography>
            ) : rows.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No mapping rows. Click Add Row to create mark-to-grade ranges.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={180}>Marks Start</TableCell>
                    <TableCell width={180}>Marks End</TableCell>
                    <TableCell>Calculated Grade</TableCell>
                    <TableCell width={120}>Active</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.id ?? i}>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={r.marks_start}
                          onChange={(e) => updateRow(i, 'marks_start', Number(e.target.value))}
                          inputProps={{ step: '0.01' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={r.marks_end}
                          onChange={(e) => updateRow(i, 'marks_end', Number(e.target.value))}
                          inputProps={{ step: '0.01' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={r.calculated_grade}
                          onChange={(e) => updateRow(i, 'calculated_grade', e.target.value)}
                          placeholder="e.g. A"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={r.is_active !== false}
                          onChange={(e) => updateRow(i, 'is_active', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        {r.id ? (
                          <IconButton size="small" color="error" onClick={() => deleteRow(r.id!)} title="Delete">
                            <DeleteIcon />
                          </IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => removeUnsavedRow(i)} title="Remove">
                            <DeleteIcon />
                          </IconButton>
                        )}
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

