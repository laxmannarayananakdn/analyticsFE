import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  BookOpen,
  FileText
} from 'lucide-react';
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
  const toastIdRef = useState(0);

  // Filter state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');

  // Data state
  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [subjectMappings, setSubjectMappings] = useState<SubjectMapping[]>([]);
  const [componentConfigs, setComponentConfigs] = useState<AssessmentComponentConfig[]>([]);

  // Editable data state
  const [editableMappings, setEditableMappings] = useState<SubjectMapping[]>([]);
  const [editableConfigs, setEditableConfigs] = useState<AssessmentComponentConfig[]>([]);

  // Load initial data
  useEffect(() => {
    loadSchools();
    loadAcademicYears();
  }, []);

  // Load data when filters change
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
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
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

  const loadAcademicYears = async () => {
    try {
      const data = await rpConfigService.getAcademicYears();
      setAcademicYears(data);
    } catch (error: any) {
      showToast('Failed to load academic years', 'error');
      console.error('Error loading academic years:', error);
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
      {
        school_id: selectedSchoolId,
        academic_year: selectedAcademicYear,
        grade: '',
        subject: '',
        reported_subject: null
      }
    ]);
  };

  const handleAddComponentConfig = () => {
    if (!selectedSchoolId) {
      showToast('Please select school first', 'error');
      return;
    }
    setEditableConfigs([
      ...editableConfigs,
      {
        school_id: selectedSchoolId,
        component_name: '',
        is_active: true
      }
    ]);
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
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            RP Configuration Management
          </h1>
          <p className="text-gray-400">Manage subject mappings and assessment component configurations</p>
        </div>

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5" />}
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                School <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.school_id} value={school.school_id}>
                    {school.school_name || school.school_id}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'subject-mapping' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Academic Year <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select academic year</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={() => {
                  if (activeTab === 'subject-mapping') {
                    loadSubjectMappings();
                  } else {
                    loadComponentConfigs();
                  }
                }}
                disabled={loading || (activeTab === 'subject-mapping' ? !selectedSchoolId || !selectedAcademicYear : !selectedSchoolId)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex gap-4 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('subject-mapping')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'subject-mapping'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Subject Mapping
            </button>
            <button
              onClick={() => setActiveTab('component-config')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'component-config'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              Assessment Component Config
            </button>
          </div>

          {/* Subject Mapping Tab */}
          {activeTab === 'subject-mapping' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Subject Mappings</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSubjectMapping}
                    disabled={!selectedSchoolId || !selectedAcademicYear}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                  <button
                    onClick={handleSaveSubjectMappings}
                    disabled={loading || editableMappings.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save All
                  </button>
                </div>
              </div>

              {loading && editableMappings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : editableMappings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No subject mappings found. Select school and academic year, then click "Add Row" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-gray-300 font-semibold">Grade</th>
                        <th className="px-4 py-3 text-gray-300 font-semibold">Subject</th>
                        <th className="px-4 py-3 text-gray-300 font-semibold">Reported Subject</th>
                        <th className="px-4 py-3 text-gray-300 font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableMappings.map((mapping, index) => (
                        <tr key={mapping.id || index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={mapping.grade}
                              onChange={(e) => updateSubjectMapping(index, 'grade', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="e.g., 10, 12"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={mapping.subject}
                              onChange={(e) => updateSubjectMapping(index, 'subject', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="e.g., Maths, Mathematics"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={mapping.reported_subject || ''}
                              onChange={(e) => updateSubjectMapping(index, 'reported_subject', e.target.value || null)}
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="e.g., Mathematics (can be empty)"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {mapping.id && (
                              <button
                                onClick={() => handleDeleteSubjectMapping(mapping.id!)}
                                className="p-2 text-red-400 hover:text-red-300 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Component Config Tab */}
          {activeTab === 'component-config' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Assessment Component Configurations</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddComponentConfig}
                    disabled={!selectedSchoolId}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                  <button
                    onClick={handleSaveComponentConfigs}
                    disabled={loading || editableConfigs.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save All
                  </button>
                </div>
              </div>

              {loading && editableConfigs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : editableConfigs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No component configs found. Select school, then click "Add Row" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-gray-300 font-semibold">Component Name</th>
                        <th className="px-4 py-3 text-gray-300 font-semibold">Active</th>
                        <th className="px-4 py-3 text-gray-300 font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableConfigs.map((config, index) => (
                        <tr key={config.id || index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={config.component_name}
                              onChange={(e) => updateComponentConfig(index, 'component_name', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="e.g., Assignment, Exam, Quiz"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.is_active}
                                onChange={(e) => updateComponentConfig(index, 'is_active', e.target.checked)}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-300">Active</span>
                            </label>
                          </td>
                          <td className="px-4 py-3">
                            {config.id && (
                              <button
                                onClick={() => handleDeleteComponentConfig(config.id!)}
                                className="p-2 text-red-400 hover:text-red-300 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
