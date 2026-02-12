import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import {
  rpConfigService,
  SubjectMapping,
  AssessmentComponentConfig,
  School
} from '../services/RPConfigService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

type TabType = 'subject-mapping' | 'component-config';

export default function RPConfig() {
  const [activeTab, setActiveTab] = useState<TabType>('subject-mapping');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [, setSubjectMappings] = useState<SubjectMapping[]>([]);
  const [, setComponentConfigs] = useState<AssessmentComponentConfig[]>([]);
  const [editableMappings, setEditableMappings] = useState<SubjectMapping[]>([]);
  const [editableConfigs, setEditableConfigs] = useState<AssessmentComponentConfig[]>([]);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      loadAcademicYears(selectedSchoolId);
      loadSubjects(selectedSchoolId);
    } else {
      setAcademicYears([]);
      setSubjects([]);
      setSelectedAcademicYear('');
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (activeTab === 'subject-mapping' && selectedSchoolId && selectedAcademicYear) {
      loadSubjectMappings();
    } else if (activeTab === 'component-config' && selectedSchoolId) {
      loadComponentConfigs();
    }
  }, [activeTab, selectedSchoolId, selectedAcademicYear]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const loadSchools = async () => {
    try {
      const data = await rpConfigService.getSchools();
      setSchools(data);
    } catch (error: any) {
      showToast('Failed to load schools', 'error');
      console.error('Error loading schools:', error);
    }
  };

  const loadAcademicYears = async (schoolId: string) => {
    try {
      const data = await rpConfigService.getAcademicYears(schoolId);
      setAcademicYears(data);
    } catch (error: any) {
      showToast('Failed to load academic years', 'error');
      console.error('Error loading academic years:', error);
    }
  };

  const loadSubjects = async (schoolId: string) => {
    try {
      const data = await rpConfigService.getSubjects(schoolId);
      setSubjects(data);
    } catch (error: any) {
      showToast('Failed to load subjects', 'error');
      console.error('Error loading subjects:', error);
    }
  };

  const loadSubjectMappings = async () => {
    try {
      setLoading(true);
      const data = await rpConfigService.getSubjectMappings(selectedSchoolId, selectedAcademicYear);
      setSubjectMappings(data);
      setEditableMappings([...data]);
    } catch (error: any) {
      showToast('Failed to load subject mappings', 'error');
      console.error('Error loading subject mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComponentConfigs = async () => {
    try {
      setLoading(true);
      const data = await rpConfigService.getAssessmentComponentConfigs(selectedSchoolId);
      setComponentConfigs(data);
      setEditableConfigs([...data]);
    } catch (error: any) {
      showToast('Failed to load component configs', 'error');
      console.error('Error loading component configs:', error);
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

  const handleSaveComponentConfigs = async () => {
    try {
      setLoading(true);
      const response = await rpConfigService.saveAssessmentComponentConfigs(editableConfigs);
      if (response.success) {
        showToast(
          `Saved ${response.successCount} config(s) successfully${response.errorCount ? ` (${response.errorCount} error(s))` : ''}`,
          response.errorCount ? 'error' : 'success'
        );
        await loadComponentConfigs();
      } else {
        showToast('Failed to save component configs', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save component configs', 'error');
      console.error('Error saving component configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubjectMapping = () => {
    if (!selectedSchoolId || !selectedAcademicYear) {
      showToast('Please select school and academic year first', 'error');
      return;
    }
    setEditableMappings([
      ...editableMappings,
      { school_id: selectedSchoolId, academic_year: selectedAcademicYear, grade: '', subject: '', reported_subject: null }
    ]);
  };

  const handleAddComponentConfig = () => {
    if (!selectedSchoolId) {
      showToast('Please select school first', 'error');
      return;
    }
    setEditableConfigs([...editableConfigs, { school_id: selectedSchoolId, component_name: '', is_active: true }]);
  };

  const handleDeleteSubjectMapping = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    try {
      await rpConfigService.deleteSubjectMapping(id);
      showToast('Subject mapping deleted successfully', 'success');
      await loadSubjectMappings();
    } catch (error: any) {
      showToast('Failed to delete subject mapping', 'error');
      console.error('Error deleting subject mapping:', error);
    }
  };

  const handleDeleteComponentConfig = async (id: number) => {
    if (!confirm('Are you sure you want to delete this config?')) return;
    try {
      await rpConfigService.deleteAssessmentComponentConfig(id);
      showToast('Component config deleted successfully', 'success');
      await loadComponentConfigs();
    } catch (error: any) {
      showToast('Failed to delete component config', 'error');
      console.error('Error deleting component config:', error);
    }
  };

  const updateSubjectMapping = (index: number, field: keyof SubjectMapping, value: any) => {
    const updated = [...editableMappings];
    updated[index] = { ...updated[index], [field]: value };
    setEditableMappings(updated);
  };

  const updateComponentConfig = (index: number, field: keyof AssessmentComponentConfig, value: any) => {
    const updated = [...editableConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setEditableConfigs(updated);
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SettingsIcon />
            RP Configuration Management
          </Typography>
          <Typography color="text.secondary">
            Manage subject mappings and assessment component configurations. Schools and academic years come from Nexquare (Get Schools &amp; Student Allocations).
          </Typography>
        </Box>

        <Snackbar open={toasts.length > 0} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {toasts.map((toast) => (
              <Alert key={toast.id} severity={toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : 'info'} onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
                {toast.message}
              </Alert>
            ))}
          </Box>
        </Snackbar>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr auto' }, gap: 2, alignItems: 'flex-end' }}>
              <FormControl fullWidth>
                <InputLabel>School *</InputLabel>
                <Select value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} label="School *">
                  <MenuItem value="">Select a school</MenuItem>
                  {schools.map((school) => (
                    <MenuItem key={school.school_id} value={school.school_id}>
                      {school.school_name || school.school_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {activeTab === 'subject-mapping' && (
                <FormControl fullWidth>
                  <InputLabel>Academic Year *</InputLabel>
                  <Select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} label="Academic Year *">
                    <MenuItem value="">Select academic year</MenuItem>
                    {academicYears.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                  {selectedSchoolId && academicYears.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      No years found. Run Student Allocations for this school in Nexquare Data Sync.
                    </Typography>
                  )}
                </FormControl>
              )}
              <Button
                variant="contained"
                onClick={() => (activeTab === 'subject-mapping' ? loadSubjectMappings() : loadComponentConfigs())}
                disabled={loading || (activeTab === 'subject-mapping' ? !selectedSchoolId || !selectedAcademicYear : !selectedSchoolId)}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <Tabs value={activeTab === 'subject-mapping' ? 0 : 1} onChange={(_, v: number) => setActiveTab(v === 0 ? 'subject-mapping' : 'component-config')} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Subject Mapping" icon={<MenuBookIcon />} iconPosition="start" />
            <Tab label="Assessment Component Config" icon={<DescriptionIcon />} iconPosition="start" />
          </Tabs>
          <CardContent>
            {activeTab === 'subject-mapping' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Subject Mappings</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="success" onClick={handleAddSubjectMapping} disabled={!selectedSchoolId || !selectedAcademicYear} startIcon={<AddIcon />}>
                      Add Row
                    </Button>
                    <Button variant="contained" onClick={handleSaveSubjectMappings} disabled={loading || editableMappings.length === 0} startIcon={<SaveIcon />}>
                      Save All
                    </Button>
                  </Box>
                </Box>
                {loading && editableMappings.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>Loading...</Typography>
                ) : editableMappings.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No subject mappings found. Select school and academic year, then click "Add Row" to create one.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Grade</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Reported Subject</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editableMappings.map((mapping, index) => (
                        <TableRow key={mapping.id || index}>
                          <TableCell><TextField size="small" fullWidth value={mapping.grade} onChange={(e) => updateSubjectMapping(index, 'grade', e.target.value)} placeholder="e.g., 10, 12" /></TableCell>
                          <TableCell>
                            <Autocomplete
                              freeSolo
                              size="small"
                              options={subjects}
                              value={mapping.subject}
                              onChange={(_e, v) => updateSubjectMapping(index, 'subject', typeof v === 'string' ? v : (v ?? ''))}
                              onInputChange={(_e, v) => updateSubjectMapping(index, 'subject', v)}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Select or type subject" />
                              )}
                            />
                          </TableCell>
                          <TableCell><TextField size="small" fullWidth value={mapping.reported_subject || ''} onChange={(e) => updateSubjectMapping(index, 'reported_subject', e.target.value || null)} placeholder="Optional" /></TableCell>
                          <TableCell>
                            {mapping.id && (
                              <IconButton size="small" color="error" onClick={() => handleDeleteSubjectMapping(mapping.id!)} title="Delete">
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
            {activeTab === 'component-config' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Assessment Component Configurations</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="success" onClick={handleAddComponentConfig} disabled={!selectedSchoolId} startIcon={<AddIcon />}>
                      Add Row
                    </Button>
                    <Button variant="contained" onClick={handleSaveComponentConfigs} disabled={loading || editableConfigs.length === 0} startIcon={<SaveIcon />}>
                      Save All
                    </Button>
                  </Box>
                </Box>
                {loading && editableConfigs.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>Loading...</Typography>
                ) : editableConfigs.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No component configs found. Select school, then click "Add Row" to create one.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Component Name</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editableConfigs.map((config, index) => (
                        <TableRow key={config.id || index}>
                          <TableCell><TextField size="small" fullWidth value={config.component_name} onChange={(e) => updateComponentConfig(index, 'component_name', e.target.value)} placeholder="e.g., Assignment, Exam" /></TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={<Checkbox checked={config.is_active} onChange={(e) => updateComponentConfig(index, 'is_active', e.target.checked)} />}
                              label="Active"
                            />
                          </TableCell>
                          <TableCell>
                            {config.id && (
                              <IconButton size="small" color="error" onClick={() => handleDeleteComponentConfig(config.id!)} title="Delete">
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
