import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { manageBacConfigService, ManageBacSchoolConfig } from '../services/ManageBacConfigService';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ManageBacConfig() {
  const [configs, setConfigs] = useState<ManageBacSchoolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<Record<number | 'new', boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useState(0);

  // Form state
  const [formData, setFormData] = useState<Partial<ManageBacSchoolConfig>>({
    country: '',
    school_name: '',
    api_token: '',
    base_url: 'https://api.managebac.com',
    is_active: true,
    notes: ''
  });

  // Load configurations on mount
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await manageBacConfigService.getConfigs();
      setConfigs(data);
    } catch (error: any) {
      showToast('Failed to load configurations', 'error');
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleInputChange = (field: keyof ManageBacSchoolConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      country: '',
      school_name: '',
      api_token: '',
      base_url: 'https://api.managebac.com',
      is_active: true,
      notes: ''
    });
    setEditingId(null);
  };

  const handleEdit = (config: ManageBacSchoolConfig) => {
    setFormData({
      country: config.country,
      school_name: config.school_name,
      api_token: '', // Never pre-populate token - user must enter new one to update
      base_url: config.base_url || 'https://api.managebac.com',
      is_active: config.is_active,
      notes: config.notes || ''
    });
    setEditingId(config.id!);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSubmit = async () => {
    // Validation - api_token and base_url required only for new entries
    if (!formData.country || !formData.school_name) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // For new entries, api_token and base_url are required
    if (!editingId && (!formData.api_token || !formData.base_url)) {
      showToast('API Token and Base URL are required for new configurations', 'error');
      return;
    }

    try {
      if (editingId) {
        // Update existing - only send api_token if it was provided (not empty)
        const updateData = { ...formData };
        // If token is empty or masked, don't send it (backend will preserve existing)
        if (!updateData.api_token || updateData.api_token.trim() === '') {
          delete updateData.api_token;
        }
        await manageBacConfigService.updateConfig(editingId, updateData);
        showToast(
          updateData.api_token 
            ? 'Configuration updated successfully (token changed)' 
            : 'Configuration updated successfully (token unchanged)',
          'success'
        );
      } else {
        // Create new - api_token is required
        await manageBacConfigService.createConfig(formData as Omit<ManageBacSchoolConfig, 'id' | 'created_at' | 'updated_at'>);
        showToast('Configuration created successfully', 'success');
      }
      resetForm();
      await loadConfigs();
    } catch (error: any) {
      showToast(
        error.response?.data?.error || error.message || 'Failed to save configuration',
        'error'
      );
      console.error('Error saving config:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await manageBacConfigService.deleteConfig(id);
      showToast('Configuration deleted successfully', 'success');
      setShowDeleteConfirm(null);
      await loadConfigs();
    } catch (error: any) {
      showToast('Failed to delete configuration', 'error');
      console.error('Error deleting config:', error);
    }
  };

  const togglePasswordVisibility = (id: number | 'new') => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            ManageBac School Configuration
          </h1>
          <p className="text-gray-400">Manage ManageBac API tokens for each school</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit className="w-6 h-6" />
                  Edit Configuration
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  Add New Configuration
                </>
              )}
            </h2>

            <div className="space-y-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., UAE, UK, USA"
                />
              </div>

              {/* School Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  School Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.school_name || ''}
                  onChange={(e) => handleInputChange('school_name', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter school name"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.base_url || ''}
                  onChange={(e) => handleInputChange('base_url', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="https://api.managebac.com"
                />
                <p className="mt-1 text-xs text-gray-400">
                  ManageBac API base URL (e.g., https://api.managebac.com)
                </p>
              </div>

              {/* API Token */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Token 
                  {editingId ? (
                    <span className="text-gray-500 text-xs ml-2">(Leave empty to keep current)</span>
                  ) : (
                    <span className="text-red-400">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={!showPassword[editingId || 'new'] ? 'password' : 'text'}
                    value={formData.api_token || ''}
                    onChange={(e) => handleInputChange('api_token', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none pr-10"
                    placeholder={
                      editingId 
                        ? "Enter new token to update (leave empty to keep current)" 
                        : "Enter ManageBac API Token"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(editingId || 'new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword[editingId || 'new'] ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {editingId && (
                  <p className="mt-1 text-xs text-gray-400">
                    The current token is hidden for security. Enter a new token only if you want to change it.
                  </p>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Active</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Additional notes or information"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update' : 'Create'}
                </button>
                {editingId && (
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Configurations List */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Configurations ({configs.length})
              </h2>
              <button
                onClick={loadConfigs}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-white transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No configurations found. Add one to get started.
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-4 rounded-lg border ${
                      config.is_active
                        ? 'bg-gray-700/50 border-gray-600'
                        : 'bg-gray-700/30 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">
                            {config.school_name}
                          </h3>
                          {config.is_active ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{config.country}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(config.id!)}
                          className="p-1.5 text-red-400 hover:text-red-300 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-24">Base URL:</span>
                        <span className="text-gray-300 truncate">{config.base_url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-24">API Token:</span>
                        <span className="text-gray-300 font-mono text-xs">
                          {'*'.repeat(20)}
                        </span>
                      </div>
                      {config.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <p className="text-gray-400 text-xs">{config.notes}</p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-500">
                        Updated: {formatDate(config.updated_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this configuration? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
