import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Autocomplete from '@mui/material/Autocomplete';
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
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import {
  rpConfigService,
  SubjectMapping,
  ComponentFilter,
  TermFilter,
  School
} from '../services/RPConfigService';
import { authService } from '../services/AuthService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

type TabType = 'subject' | 'assessment' | 'term';

const ADD_NEW_AY = '__add_new_ay__';
const ADD_NEW_GRADE = '__add_new_grade__';

export default function RPConfig() {
  const [activeTab, setActiveTab] = useState<TabType>('subject');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [newAyInput, setNewAyInput] = useState('');
  const [newGradeInput, setNewGradeInput] = useState('');

  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [editableMappings, setEditableMappings] = useState<SubjectMapping[]>([]);
  const [editableCompFilters, setEditableCompFilters] = useState<ComponentFilter[]>([]);
  const [editableTermFilters, setEditableTermFilters] = useState<TermFilter[]>([]);

  useEffect(() => { loadSchools(); }, []);

  useEffect(() => {
    if (selectedSchoolId && !schools.some((s) => s.school_id === selectedSchoolId)) {
      setSelectedSchoolId('');
      setSelectedAcademicYear('');
      setSelectedGrade('');
    }
  }, [schools, selectedSchoolId]);

  useEffect(() => {
    if (selectedSchoolId) {
      loadAcademicYears();
    } else {
      setAcademicYears([]);
      setSelectedAcademicYear('');
      setSelectedGrade('');
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (selectedSchoolId && selectedAcademicYear) {
      loadGrades();
    } else {
      setGrades([]);
      setSelectedGrade('');
    }
  }, [selectedSchoolId, selectedAcademicYear]);

  useEffect(() => {
    if (selectedSchoolId && selectedAcademicYear && selectedGrade) {
      loadSubjects();
    } else {
      setSubjects([]);
    }
  }, [selectedSchoolId, selectedAcademicYear, selectedGrade]);

  useEffect(() => {
    if (activeTab === 'subject' && selectedSchoolId && selectedAcademicYear && selectedGrade) {
      loadSubjectMappings();
    } else if (activeTab === 'assessment' && selectedSchoolId) {
      loadComponentFilters();
    } else if (activeTab === 'term' && selectedSchoolId) {
      loadTermFilters();
    }
  }, [activeTab, selectedSchoolId, selectedAcademicYear, selectedGrade]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const loadSchools = async () => {
    try {
      const [allSchools, mySchools] = await Promise.all([
        rpConfigService.getSchools(),
        authService.getMySchools().catch(() => []),
      ]);
      const nexSchoolIds = new Set(
        (mySchools || []).filter((s) => s.schoolSource === 'nex').map((s) => s.schoolId)
      );
      const filtered =
        nexSchoolIds.size > 0 ? allSchools.filter((s) => nexSchoolIds.has(s.school_id)) : [];
      setSchools(filtered);
    } catch (error: any) {
      showToast('Failed to load schools', 'error');
      console.error('Error loading schools:', error);
    }
  };

  const loadAcademicYears = async () => {
    try {
      const data = await rpConfigService.getAcademicYears(selectedSchoolId);
      setAcademicYears(data);
    } catch (error: any) {
      showToast('Failed to load academic years', 'error');
      console.error('Error loading academic years:', error);
    }
  };

  const loadGrades = async () => {
    try {
      const data = await rpConfigService.getGrades(selectedSchoolId, selectedAcademicYear);
      setGrades(data);
    } catch (error: any) {
      showToast('Failed to load grades', 'error');
      console.error('Error loading grades:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await rpConfigService.getSubjects(
        selectedSchoolId,
        selectedAcademicYear,
        selectedGrade
      );
      setSubjects(data);
    } catch (error: any) {
      showToast('Failed to load subjects', 'error');
      console.error('Error loading subjects:', error);
    }
  };

  const loadSubjectMappings = async () => {
    try {
      setLoading(true);
      const data = await rpConfigService.getSubjectMappings(
        selectedSchoolId,
        selectedAcademicYear,
        selectedGrade
      );
      setEditableMappings([...data]);
    } catch (error: any) {
      showToast('Failed to load subject mappings', 'error');
      console.error('Error loading subject mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComponentFilters = async () => {
    try {
      setLoading(true);
      const data = await rpConfigService.getComponentFilters(selectedSchoolId);
      setEditableCompFilters([...data]);
    } catch (error: any) {
      showToast('Failed to load component filters', 'error');
      console.error('Error loading component filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTermFilters = async () => {
    try {
      setLoading(true);
      const data = await rpConfigService.getTermFilters(selectedSchoolId);
      setEditableTermFilters([...data]);
    } catch (error: any) {
      showToast('Failed to load term filters', 'error');
      console.error('Error loading term filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubjectMappings = async () => {
    try {
      setLoading(true);
      const response = await rpConfigService.saveSubjectMappings(editableMappings);
      if (response.success) {
        showToast(
          `Saved ${response.successCount} mapping(s) successfully${response.errorCount ? ` (${response.errorCount} error(s))` : ''}`,
          response.errorCount ? 'error' : 'success'
        );
        await loadSubjectMappings();
        await loadAcademicYears();
        await loadGrades();
        await loadSubjects();
      } else {
        showToast('Failed to save subject mappings', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save subject mappings', 'error');
      console.error('Error saving subject mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComponentFilters = async () => {
    try {
      setLoading(true);
      const filters = editableCompFilters.map((f) => ({
        ...f,
        school_id: selectedSchoolId,
      }));
      const response = await rpConfigService.saveComponentFilters(filters);
      if (response.success) {
        showToast(`Saved ${response.successCount} component filter(s) successfully`, 'success');
        await loadComponentFilters();
      } else {
        showToast('Failed to save component filters', 'error');
      }
    } catch (error: any) {
      showToast('Failed to save component filters', 'error');
      console.error('Error saving component filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTermFilters = async () => {
    try {
      setLoading(true);
      const filters = editableTermFilters.map((f) => ({
        ...f,
        school_id: selectedSchoolId,
      }));
      const response = await rpConfigService.saveTermFilters(filters);
      if (response.success) {
        showToast(`Saved ${response.successCount} term filter(s) successfully`, 'success');
        await loadTermFilters();
      } else {
        showToast('Failed to save term filters', 'error');
      }
    } catch (error: any) {
      showToast('Failed to save term filters', 'error');
      console.error('Error saving term filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubjectMapping = () => {
    if (!selectedSchoolId || !selectedAcademicYear || !selectedGrade) {
      showToast('Please select school, academic year, and grade first', 'error');
      return;
    }
    setEditableMappings([
      ...editableMappings,
      {
        school_id: selectedSchoolId,
        academic_year: selectedAcademicYear,
        grade: selectedGrade,
        subject: '',
        reported_subject: null,
      },
    ]);
  };

  const handleAddComponentFilter = () => {
    if (!selectedSchoolId) {
      showToast('Please select school first', 'error');
      return;
    }
    setEditableCompFilters([
      ...editableCompFilters,
      { school_id: selectedSchoolId, filter_type: 'include', pattern: '' },
    ]);
  };

  const handleAddTermFilter = () => {
    if (!selectedSchoolId) {
      showToast('Please select school first', 'error');
      return;
    }
    setEditableTermFilters([
      ...editableTermFilters,
      { school_id: selectedSchoolId, filter_type: 'exclude', pattern: '' },
    ]);
  };

  const handleAyChange = (value: string) => {
    if (value === ADD_NEW_AY) {
      setSelectedAcademicYear(ADD_NEW_AY);
      setNewAyInput('');
    } else {
      setSelectedAcademicYear(value);
    }
  };

  const handleGradeChange = (value: string) => {
    if (value === ADD_NEW_GRADE) {
      setSelectedGrade(ADD_NEW_GRADE);
      setNewGradeInput('');
    } else {
      setSelectedGrade(value);
    }
  };

  const handleAddNewAy = () => {
    const ay = newAyInput.trim();
    if (!ay) {
      showToast('Enter an academic year (e.g., 2024-2025)', 'error');
      return;
    }
    if (!selectedSchoolId || !selectedGrade) {
      showToast('Select school and grade first', 'error');
      return;
    }
    setSelectedAcademicYear(ay);
    setAcademicYears((prev) => (prev.includes(ay) ? prev : [ay, ...prev].sort().reverse()));
    setNewAyInput('');
  };

  const handleAddNewGrade = () => {
    const grade = newGradeInput.trim();
    if (!grade) {
      showToast('Enter a grade (e.g., 10)', 'error');
      return;
    }
    if (!selectedSchoolId || !selectedAcademicYear) {
      showToast('Select school and academic year first', 'error');
      return;
    }
    setSelectedGrade(grade);
    setGrades((prev) => (prev.includes(grade) ? prev : [grade, ...prev].sort()));
    setNewGradeInput('');
  };

  const handleDeleteSubjectMapping = async (id: number) => {
    if (!confirm('Delete this mapping?')) return;
    try {
      await rpConfigService.deleteSubjectMapping(id);
      showToast('Mapping deleted', 'success');
      await loadSubjectMappings();
    } catch (error: any) {
      showToast('Failed to delete mapping', 'error');
    }
  };

  const handleRemoveSubjectMapping = (index: number) => {
    const m = editableMappings[index];
    if (m.id) return;
    setEditableMappings(editableMappings.filter((_, i) => i !== index));
  };

  const handleDeleteComponentFilter = async (id: number) => {
    if (!confirm('Delete this filter?')) return;
    try {
      await rpConfigService.deleteComponentFilter(id);
      showToast('Filter deleted', 'success');
      await loadComponentFilters();
    } catch (error: any) {
      showToast('Failed to delete filter', 'error');
    }
  };

  const handleRemoveComponentFilter = (index: number) => {
    const f = editableCompFilters[index];
    if (f.id) return;
    setEditableCompFilters(editableCompFilters.filter((_, i) => i !== index));
  };

  const handleDeleteTermFilter = async (id: number) => {
    if (!confirm('Delete this filter?')) return;
    try {
      await rpConfigService.deleteTermFilter(id);
      showToast('Filter deleted', 'success');
      await loadTermFilters();
    } catch (error: any) {
      showToast('Failed to delete filter', 'error');
    }
  };

  const handleRemoveTermFilter = (index: number) => {
    const f = editableTermFilters[index];
    if (f.id) return;
    setEditableTermFilters(editableTermFilters.filter((_, i) => i !== index));
  };

  const updateSubjectMapping = (index: number, field: keyof SubjectMapping, value: any) => {
    const updated = [...editableMappings];
    updated[index] = { ...updated[index], [field]: value };
    setEditableMappings(updated);
  };

  const updateComponentFilter = (index: number, field: keyof ComponentFilter, value: any) => {
    const updated = [...editableCompFilters];
    updated[index] = { ...updated[index], [field]: value };
    setEditableCompFilters(updated);
  };

  const updateTermFilter = (index: number, field: keyof TermFilter, value: any) => {
    const updated = [...editableTermFilters];
    updated[index] = { ...updated[index], [field]: value };
    setEditableTermFilters(updated);
  };

  const refreshCurrent = () => {
    if (activeTab === 'subject') loadSubjectMappings();
    else if (activeTab === 'assessment') loadComponentFilters();
    else if (activeTab === 'term') loadTermFilters();
  };

  const ayOptions = [...academicYears];
  if (selectedSchoolId) ayOptions.push(ADD_NEW_AY);
  const gradeOptions = [...grades];
  if (selectedSchoolId && selectedAcademicYear) gradeOptions.push(ADD_NEW_GRADE);

  const subjectTabReady = selectedSchoolId && selectedAcademicYear && selectedGrade;
  const assessmentTabReady = selectedSchoolId;
  const termTabReady = selectedSchoolId;

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SettingsIcon />
            RP Configuration Management
          </Typography>
          <Typography color="text.secondary">
            Configure how data flows from NEX.student_assessments to RP.student_assessments. Select school, academic year, and grade. Subject mappings, component filters, and term filters control the sync.
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
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>School *</InputLabel>
                <Select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  label="School *"
                >
                  <MenuItem value="">Select school</MenuItem>
                  {schools.map((s) => (
                    <MenuItem key={s.school_id} value={s.school_id}>
                      {s.school_name || s.school_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Academic Year *</InputLabel>
                <Select
                  value={selectedAcademicYear}
                  onChange={(e) => handleAyChange(e.target.value)}
                  label="Academic Year *"
                  disabled={!selectedSchoolId}
                >
                  <MenuItem value="">Select or add</MenuItem>
                  {academicYears.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                  {selectedSchoolId && <MenuItem value={ADD_NEW_AY}>+ Add new</MenuItem>}
                </Select>
              </FormControl>
              {selectedAcademicYear === ADD_NEW_AY && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="e.g., 2024-2025"
                    value={newAyInput}
                    onChange={(e) => setNewAyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewAy()}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddNewAy}>
                    Add
                  </Button>
                </Box>
              )}

              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Grade *</InputLabel>
                <Select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  label="Grade *"
                  disabled={!selectedSchoolId || !selectedAcademicYear || selectedAcademicYear === ADD_NEW_AY}
                >
                  <MenuItem value="">Select or add</MenuItem>
                  {grades.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                  {selectedSchoolId && selectedAcademicYear && selectedAcademicYear !== ADD_NEW_AY && (
                    <MenuItem value={ADD_NEW_GRADE}>+ Add new</MenuItem>
                  )}
                </Select>
              </FormControl>
              {selectedGrade === ADD_NEW_GRADE && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="e.g., 10"
                    value={newGradeInput}
                    onChange={(e) => setNewGradeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewGrade()}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddNewGrade}>
                    Add
                  </Button>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={refreshCurrent}
                disabled={loading || !selectedSchoolId}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <Tabs
            value={activeTab === 'subject' ? 0 : activeTab === 'assessment' ? 1 : 2}
            onChange={(_, v: number) => setActiveTab(v === 0 ? 'subject' : v === 1 ? 'assessment' : 'term')}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Subject" icon={<MenuBookIcon />} iconPosition="start" disabled={!subjectTabReady} />
            <Tab label="Assessment" icon={<DescriptionIcon />} iconPosition="start" disabled={!assessmentTabReady} />
            <Tab label="Term" icon={<EventIcon />} iconPosition="start" disabled={!termTabReady} />
          </Tabs>
          <CardContent>
            {activeTab === 'subject' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Subject Mappings</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAddSubjectMapping}
                      disabled={!subjectTabReady}
                      startIcon={<AddIcon />}
                    >
                      Add Row
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveSubjectMappings}
                      disabled={loading || editableMappings.length === 0}
                      startIcon={<SaveIcon />}
                    >
                      Save All
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Map subject names (from assessment file) to reported subject for RP schema.
                </Typography>
                {loading && editableMappings.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    Loading...
                  </Typography>
                ) : editableMappings.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No mappings. Click Add Row to create. Subjects come from the assessment file.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Reported Subject</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editableMappings.map((m, i) => (
                        <TableRow key={m.id ?? i}>
                          <TableCell>
                            <Autocomplete
                              freeSolo
                              size="small"
                              options={subjects}
                              value={m.subject}
                              onChange={(_, v) => updateSubjectMapping(i, 'subject', typeof v === 'string' ? v : v ?? '')}
                              onInputChange={(_, v) => updateSubjectMapping(i, 'subject', v)}
                              renderInput={(params) => <TextField {...params} placeholder="Subject from file" />}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={m.reported_subject || ''}
                              onChange={(e) => updateSubjectMapping(i, 'reported_subject', e.target.value || null)}
                              placeholder="Standardized name"
                            />
                          </TableCell>
                          <TableCell>
                            {m.id ? (
                              <IconButton size="small" color="error" onClick={() => handleDeleteSubjectMapping(m.id!)} title="Delete">
                                <DeleteIcon />
                              </IconButton>
                            ) : (
                              <IconButton size="small" onClick={() => handleRemoveSubjectMapping(i)} title="Remove">
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {activeTab === 'assessment' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Component Filters</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAddComponentFilter}
                      disabled={!assessmentTabReady}
                      startIcon={<AddIcon />}
                    >
                      Add Row
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveComponentFilters}
                      disabled={loading || editableCompFilters.length === 0}
                      startIcon={<SaveIcon />}
                    >
                      Save All
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Include or exclude components by pattern (e.g., exclude %Flag%, include %Promotion%, %Grade%, %Percentage%).
                </Typography>
                {loading && editableCompFilters.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    Loading...
                  </Typography>
                ) : editableCompFilters.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No filters. Click Add Row. Example: exclude %Flag%, include %Promotion%.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Pattern (SQL LIKE)</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editableCompFilters.map((f, i) => (
                        <TableRow key={f.id ?? i}>
                          <TableCell>
                            <Select
                              size="small"
                              value={f.filter_type}
                              onChange={(e) => updateComponentFilter(i, 'filter_type', e.target.value)}
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="include">Include</MenuItem>
                              <MenuItem value="exclude">Exclude</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={f.pattern}
                              onChange={(e) => updateComponentFilter(i, 'pattern', e.target.value)}
                              placeholder="e.g., %Promotion% or %Flag%"
                            />
                          </TableCell>
                          <TableCell>
                            {f.id ? (
                              <IconButton size="small" color="error" onClick={() => handleDeleteComponentFilter(f.id!)} title="Delete">
                                <DeleteIcon />
                              </IconButton>
                            ) : (
                              <IconButton size="small" onClick={() => handleRemoveComponentFilter(i)} title="Remove">
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {activeTab === 'term' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Term Filters</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAddTermFilter}
                      disabled={!termTabReady}
                      startIcon={<AddIcon />}
                    >
                      Add Row
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveTermFilters}
                      disabled={loading || editableTermFilters.length === 0}
                      startIcon={<SaveIcon />}
                    >
                      Save All
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Include or exclude terms by pattern (e.g., exclude %BI MONTHLY%).
                </Typography>
                {loading && editableTermFilters.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    Loading...
                  </Typography>
                ) : editableTermFilters.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No filters. Click Add Row. Example: exclude %BI MONTHLY%.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Pattern (SQL LIKE)</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editableTermFilters.map((f, i) => (
                        <TableRow key={f.id ?? i}>
                          <TableCell>
                            <Select
                              size="small"
                              value={f.filter_type}
                              onChange={(e) => updateTermFilter(i, 'filter_type', e.target.value)}
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="include">Include</MenuItem>
                              <MenuItem value="exclude">Exclude</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={f.pattern}
                              onChange={(e) => updateTermFilter(i, 'pattern', e.target.value)}
                              placeholder="e.g., %BI MONTHLY%"
                            />
                          </TableCell>
                          <TableCell>
                            {f.id ? (
                              <IconButton size="small" color="error" onClick={() => handleDeleteTermFilter(f.id!)} title="Delete">
                                <DeleteIcon />
                              </IconButton>
                            ) : (
                              <IconButton size="small" onClick={() => handleRemoveTermFilter(i)} title="Remove">
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
