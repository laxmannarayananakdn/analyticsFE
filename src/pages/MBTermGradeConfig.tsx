import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  mbTermGradeConfigService,
  MBTermGradeRubricConfig,
  MBSchool,
} from '../services/MBTermGradeConfigService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function MBTermGradeConfig() {
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [schools, setSchools] = useState<MBSchool[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | ''>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedGradeNumber, setSelectedGradeNumber] = useState<number | '' | '__add__'>('');
  const [newAyInput, setNewAyInput] = useState('');
  const [newGradeInput, setNewGradeInput] = useState('');

  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [gradeNumbers, setGradeNumbers] = useState<number[]>([]);
  const [editableConfigs, setEditableConfigs] = useState<MBTermGradeRubricConfig[]>([]);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      loadAcademicYearsAndGrades();
    } else {
      setAcademicYears([]);
      setGradeNumbers([]);
      setSelectedAcademicYear('');
      setSelectedGradeNumber('');
    }
  }, [selectedSchoolId]);

  const gradeReady = selectedGradeNumber !== '' && selectedGradeNumber !== '__add__';
  useEffect(() => {
    if (selectedSchoolId && selectedAcademicYear && selectedAcademicYear !== '__add__' && gradeReady) {
      loadConfig();
    } else {
      setEditableConfigs([]);
    }
  }, [selectedSchoolId, selectedAcademicYear, selectedGradeNumber]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const loadSchools = async () => {
    try {
      const data = await mbTermGradeConfigService.getSchools();
      setSchools(data);
    } catch (error: unknown) {
      showToast('Failed to load schools', 'error');
      console.error('Error loading schools:', error);
    }
  };

  const loadAcademicYearsAndGrades = async () => {
    if (!selectedSchoolId) return;
    try {
      const data = await mbTermGradeConfigService.getConfig({ school_id: selectedSchoolId });
      const ays = [...new Set(data.map((c) => c.academic_year))].sort().reverse();
      const grades = [...new Set(data.map((c) => c.grade_number))].sort((a, b) => a - b);
      setAcademicYears(ays);
      setGradeNumbers(grades);
    } catch {
      setAcademicYears([]);
      setGradeNumbers([]);
    }
  };

  const loadConfig = async () => {
    if (
      selectedSchoolId === '' ||
      !selectedAcademicYear ||
      selectedAcademicYear === '__add__' ||
      selectedGradeNumber === '' ||
      selectedGradeNumber === '__add__'
    )
      return;
    try {
      setLoading(true);
      const data = await mbTermGradeConfigService.getConfig({
        school_id: selectedSchoolId,
        academic_year: selectedAcademicYear,
        grade_number: selectedGradeNumber as number,
      });
      setEditableConfigs([...data]);
    } catch (error: unknown) {
      showToast('Failed to load config', 'error');
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSchoolId || !selectedAcademicYear || selectedAcademicYear === '__add__' || !gradeReady) {
      showToast('Select school, academic year, and grade first', 'error');
      return;
    }
    const toSave = editableConfigs.map((c) => ({
      ...c,
      school_id: selectedSchoolId,
      academic_year: selectedAcademicYear,
      grade_number: selectedGradeNumber as number,
    }));
    if (toSave.some((c) => !c.rubric_title || !c.term_id)) {
      showToast('All rows must have rubric title and term ID', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await mbTermGradeConfigService.saveConfig(toSave);
      showToast(
        `Saved ${res.successCount} row(s)${res.errorCount ? ` (${res.errorCount} error(s))` : ''}`,
        res.errorCount ? 'error' : 'success'
      );
      await loadConfig();
      await loadAcademicYearsAndGrades();
    } catch (error: unknown) {
      showToast((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    if (!selectedSchoolId || !selectedAcademicYear || selectedAcademicYear === '__add__' || !gradeReady) {
      showToast('Select school, academic year, and grade first', 'error');
      return;
    }
    setEditableConfigs((prev) => [
      ...prev,
      {
        school_id: selectedSchoolId,
        academic_year: selectedAcademicYear,
        grade_number: selectedGradeNumber as number,
        rubric_title: '',
        term_id: 0,
        display_order: prev.length,
      },
    ]);
  };

  const handleAddNewAy = () => {
    const ay = newAyInput.trim();
    if (!ay) {
      showToast('Enter an academic year (e.g. 2024-2025)', 'error');
      return;
    }
    setSelectedAcademicYear(ay);
    setAcademicYears((prev) => (prev.includes(ay) ? prev : [ay, ...prev].sort().reverse()));
    setNewAyInput('');
  };

  const handleAddNewGrade = () => {
    const g = parseInt(newGradeInput.trim(), 10);
    if (isNaN(g)) {
      showToast('Enter a valid grade number (e.g. 12)', 'error');
      return;
    }
    setSelectedGradeNumber(g);
    setGradeNumbers((prev) => (prev.includes(g) ? prev : [...prev, g].sort((a, b) => a - b)));
    setNewGradeInput('');
  };

  const updateConfig = (index: number, field: keyof MBTermGradeRubricConfig, value: unknown) => {
    setEditableConfigs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this row?')) return;
    try {
      await mbTermGradeConfigService.deleteConfig(id);
      showToast('Deleted', 'success');
      await loadConfig();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleRemove = (index: number) => {
    const c = editableConfigs[index];
    if (c.id) return;
    setEditableConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const ready = selectedSchoolId && selectedAcademicYear && selectedAcademicYear !== '__add__' && gradeReady;

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SettingsIcon />
            ManageBac Term Grade Rubric Config
          </Typography>
          <Typography color="text.secondary">
            Map rubric titles (e.g. University Predicted Grade, CEM Predicted Grade) to term_ids per school, academic year, and grade_number. Used by sync and reporting.
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
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>School *</InputLabel>
                <Select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value as number | '')}
                  label="School *"
                >
                  <MenuItem value="">Select school</MenuItem>
                  {schools.map((s) => (
                    <MenuItem key={s.school_id} value={s.school_id}>
                      {s.school_name || `School ${s.school_id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Academic Year *</InputLabel>
                <Select
                  value={academicYears.length === 0 && selectedSchoolId ? '__add__' : selectedAcademicYear}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__add__') setSelectedAcademicYear('__add__');
                    else setSelectedAcademicYear(v);
                  }}
                  label="Academic Year *"
                  disabled={!selectedSchoolId}
                >
                  <MenuItem value="">Select or add</MenuItem>
                  {academicYears.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                  {selectedSchoolId && <MenuItem value="__add__">+ Add new</MenuItem>}
                </Select>
              </FormControl>
              {(selectedAcademicYear === '__add__' || (academicYears.length === 0 && selectedSchoolId)) && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="e.g. 2024-2025"
                    value={newAyInput}
                    onChange={(e) => setNewAyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewAy()}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddNewAy}>Add</Button>
                </Box>
              )}

              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Grade (number) *</InputLabel>
                <Select
                  value={
                    gradeNumbers.length === 0 && selectedSchoolId && selectedAcademicYear && selectedAcademicYear !== '__add__'
                      ? '__add__'
                      : selectedGradeNumber === '' || selectedGradeNumber === '__add__'
                        ? ''
                        : selectedGradeNumber
                  }
                  onChange={(e) => {
                    const v = e.target.value as string;
                    if (v === '__add__') setSelectedGradeNumber('__add__');
                    else setSelectedGradeNumber(v === '' ? '' : Number(v));
                  }}
                  label="Grade (number) *"
                  disabled={!selectedSchoolId || !selectedAcademicYear || selectedAcademicYear === '__add__'}
                >
                  <MenuItem value="">Select or add</MenuItem>
                  {gradeNumbers.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                  {selectedSchoolId && selectedAcademicYear && selectedAcademicYear !== '__add__' && (
                    <MenuItem value="__add__">+ Add new</MenuItem>
                  )}
                </Select>
              </FormControl>
              {(selectedGradeNumber === '__add__' ||
                (gradeNumbers.length === 0 && selectedSchoolId && selectedAcademicYear && selectedAcademicYear !== '__add__')) && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="e.g. 12"
                    value={newGradeInput}
                    onChange={(e) => setNewGradeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewGrade()}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddNewGrade}>Add</Button>
                </Box>
              )}

              <Button variant="contained" onClick={loadConfig} disabled={loading || !selectedSchoolId} startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBookIcon /> Rubric → Term Mapping
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="success" onClick={handleAddRow} disabled={!ready} startIcon={<AddIcon />}>
                  Add Row
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={loading || editableConfigs.length === 0} startIcon={<SaveIcon />}>
                  Save All
                </Button>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Map rubric titles (e.g. University Predicted Grade, CEM Predicted Grade, Continuous Assessment Grade, Mock Exam Grade) to MB.academic_terms.id.
            </Typography>

            {loading && editableConfigs.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>Loading...</Typography>
            ) : editableConfigs.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No config. Select school, academic year, and grade, then click Add Row.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rubric Title</TableCell>
                    <TableCell width={140}>Term ID</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editableConfigs.map((c, i) => (
                    <TableRow key={c.id ?? i}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={c.rubric_title || ''}
                          onChange={(e) => updateConfig(i, 'rubric_title', e.target.value)}
                          placeholder="e.g. University Predicted Grade"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={c.term_id || ''}
                          onChange={(e) => updateConfig(i, 'term_id', parseInt(e.target.value, 10) || 0)}
                          placeholder="e.g. 225297"
                        />
                      </TableCell>
                      <TableCell>
                        {c.id ? (
                          <IconButton size="small" color="error" onClick={() => handleDelete(c.id!)} title="Delete">
                            <DeleteIcon />
                          </IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => handleRemove(i)} title="Remove">
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
