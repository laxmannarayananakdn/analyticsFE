import { useState, useEffect } from 'react';
import {
  Database,
  Play,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Calendar,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  ClipboardList
} from 'lucide-react';
import { nexquareConfigService, NexquareSchoolConfig } from '../services/NexquareConfigService';
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
  {
    id: 'authenticate',
    name: 'Authenticate',
    description: 'Test authentication and get OAuth token',
    method: 'POST',
    icon: <CheckCircle2 className="w-5 h-5" />
  },
  {
    id: 'schools',
    name: 'Get Schools',
    description: 'Fetch all schools/entities from Nexquare',
    method: 'GET',
    icon: <GraduationCap className="w-5 h-5" />,
    params: [
      {
        key: 'filter',
        label: 'Filter (optional)',
        type: 'text',
        placeholder: "e.g., status='active'"
      }
    ]
  },
  {
    id: 'verify-school',
    name: 'Verify School Access',
    description: 'Verify access to a specific school',
    method: 'GET',
    icon: <CheckCircle2 className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      }
    ]
  },
  {
    id: 'students',
    name: 'Get Students',
    description: 'Fetch all students for a school',
    method: 'GET',
    icon: <Users className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      },
      {
        key: 'filter',
        label: 'Filter (optional)',
        type: 'text',
        placeholder: "e.g., status='active'"
      },
      {
        key: 'fetchMode',
        label: 'Fetch Mode',
        type: 'select',
        options: [
          { value: '1', label: 'Enrolled only' },
          { value: '2', label: 'Preadmission only' },
          { value: '3', label: 'Both' }
        ]
      }
    ]
  },
  {
    id: 'staff',
    name: 'Get Staff',
    description: 'Fetch all staff/teachers for a school',
    method: 'GET',
    icon: <Users className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      },
      {
        key: 'filter',
        label: 'Filter (optional)',
        type: 'text',
        placeholder: "e.g., status='active'"
      }
    ]
  },
  {
    id: 'classes',
    name: 'Get Classes',
    description: 'Fetch all classes for a school',
    method: 'GET',
    icon: <BookOpen className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      }
    ]
  },
  {
    id: 'allocation-master',
    name: 'Get Allocation Master',
    description: 'Fetch allocation master data',
    method: 'GET',
    icon: <ClipboardList className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      }
    ]
  },
  {
    id: 'student-allocations',
    name: 'Get Student Allocations',
    description: 'Fetch student allocations (subjects, cohorts, groups, homerooms)',
    method: 'GET',
    icon: <ClipboardList className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      }
    ]
  },
  {
    id: 'staff-allocations',
    name: 'Get Staff Allocations',
    description: 'Fetch staff allocations',
    method: 'GET',
    icon: <ClipboardList className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      }
    ]
  },
  {
    id: 'daily-plans',
    name: 'Get Daily Plans',
    description: 'Fetch daily plans/timetable (max 1 week range)',
    method: 'GET',
    icon: <Calendar className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      },
      {
        key: 'fromDate',
        label: 'From Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD'
      },
      {
        key: 'toDate',
        label: 'To Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD'
      },
      {
        key: 'subject',
        label: 'Subject (optional)',
        type: 'text'
      },
      {
        key: 'classId',
        label: 'Class ID (optional)',
        type: 'text'
      }
    ]
  },
  {
    id: 'daily-attendance',
    name: 'Get Daily Attendance',
    description: 'Fetch daily attendance records',
    method: 'GET',
    icon: <Clock className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      },
      {
        key: 'startDate',
        label: 'Start Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD'
      },
      {
        key: 'endDate',
        label: 'End Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD'
      },
      {
        key: 'categoryRequired',
        label: 'Category Required',
        type: 'select',
        options: [
          { value: 'false', label: 'No' },
          { value: 'true', label: 'Yes' }
        ]
      }
    ]
  },
  {
    id: 'lesson-attendance',
    name: 'Get Lesson Attendance',
    description: 'Fetch lesson attendance records',
    method: 'GET',
    icon: <Clock className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      },
      {
        key: 'startDate',
        label: 'Start Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD'
      },
      {
        key: 'endDate',
        label: 'End Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD'
      }
    ]
  },
  {
    id: 'student-assessments',
    name: 'Get Student Assessments',
    description: 'Fetch student assessment/grade book data (CSV format)',
    method: 'GET',
    icon: <FileText className="w-5 h-5" />,
    requiresSchoolId: true,
    params: [
      {
        key: 'schoolId',
        label: 'School ID',
        type: 'text',
        placeholder: 'Enter school sourced ID'
      },
      {
        key: 'academicYear',
        label: 'Academic Year',
        type: 'text',
        placeholder: 'e.g., 2024'
      },
      {
        key: 'fileName',
        label: 'File Name (optional)',
        type: 'text',
        placeholder: 'assessment-data'
      }
    ]
  }
];

export default function NexquareDataSync() {
  const [configs, setConfigs] = useState<NexquareSchoolConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const data = await nexquareConfigService.getConfigs();
      setConfigs(data.filter(c => c.is_active));
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
    // Reset params
    const initialParams: Record<string, string> = {};
    endpoint.params?.forEach(param => {
      if (param.type === 'select' && param.options && param.options.length > 0) {
        initialParams[param.key] = param.options[0].value;
      }
    });
    setParams(initialParams);
  };

  const handleExecute = async () => {
    if (!selectedConfigId || !selectedEndpoint) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('config_id', selectedConfigId.toString());
      
      // Add endpoint-specific params
      Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value);
        }
      });

      let response: ApiResult;

      // Use longer timeout for data sync operations (120 seconds)
      const SYNC_TIMEOUT = 120000; // 2 minutes
      
      if (selectedEndpoint.method === 'POST') {
        response = await apiClient.post<ApiResult>(
          `/api/nexquare/${selectedEndpoint.id}?${queryParams.toString()}`,
          {},
          SYNC_TIMEOUT
        );
      } else {
        response = await apiClient.get<ApiResult>(
          `/api/nexquare/${selectedEndpoint.id}?${queryParams.toString()}`,
          undefined,
          SYNC_TIMEOUT
        );
      }

      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Request failed',
        error: error.response?.data?.error || error.message || 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = configs.find(c => c.id === selectedConfigId);

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="w-8 h-8" />
            Nexquare Data Sync
          </h1>
          <p className="text-gray-400">Trigger Nexquare API calls to sync data for specific schools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - School Selection & Endpoints */}
          <div className="lg:col-span-1 space-y-6">
            {/* School Selection */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Select School</h2>
              {loadingConfigs ? (
                <div className="text-center py-4 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading schools...
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  No active configurations found.
                  <br />
                  <a href="/admin/nexquare-config" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                    Add configuration →
                  </a>
                </div>
              ) : (
                <select
                  value={selectedConfigId || ''}
                  onChange={(e) => {
                    setSelectedConfigId(e.target.value ? parseInt(e.target.value) : null);
                    setSelectedEndpoint(null);
                    setResult(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select School --</option>
                  {configs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.school_name} ({config.country})
                    </option>
                  ))}
                </select>
              )}
              {selectedConfig && (
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Domain:</span> {selectedConfig.domain_url}
                  </p>
                </div>
              )}
            </div>

            {/* API Endpoints */}
            {selectedConfigId && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Available APIs</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {NEXQUARE_ENDPOINTS.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => handleEndpointSelect(endpoint)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedEndpoint?.id === endpoint.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {endpoint.icon}
                        <span className="font-semibold">{endpoint.name}</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                          endpoint.method === 'POST' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {endpoint.method}
                        </span>
                      </div>
                      <p className="text-xs opacity-80">{endpoint.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Parameters & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parameters Form */}
            {selectedEndpoint && selectedConfigId && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedEndpoint.icon}
                    {selectedEndpoint.name}
                  </h2>
                  <button
                    onClick={handleExecute}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Execute
                      </>
                    )}
                  </button>
                </div>

                <p className="text-gray-400 mb-6">{selectedEndpoint.description}</p>

                {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                  <div className="space-y-4">
                    {selectedEndpoint.params.map((param) => (
                      <div key={param.key}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {param.label}
                          {param.key === 'schoolId' && selectedEndpoint.requiresSchoolId && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </label>
                        {param.type === 'select' ? (
                          <select
                            value={params[param.key] || ''}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          >
                            {param.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : param.type === 'date' ? (
                          <input
                            type="date"
                            value={params[param.key] || ''}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder={param.placeholder}
                          />
                        ) : (
                          <input
                            type={param.type}
                            value={params[param.key] || ''}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder={param.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(!selectedEndpoint.params || selectedEndpoint.params.length === 0) && (
                  <div className="text-gray-400 text-sm">
                    No additional parameters required for this endpoint.
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    Result
                  </h2>
                  <button
                    onClick={() => setResult(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`p-4 rounded-lg mb-4 ${
                  result.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
                }`}>
                  <p className={`font-semibold ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.message}
                  </p>
                  {result.error && (
                    <p className="text-red-400 mt-2 text-sm">{result.error}</p>
                  )}
                  {result.count !== undefined && (
                    <p className="text-gray-300 mt-2">
                      Records fetched: <span className="font-bold">{result.count}</span>
                    </p>
                  )}
                </div>

                {result.data && (
                  <div className="mt-4">
                    <details className="bg-gray-700/50 rounded-lg p-4">
                      <summary className="cursor-pointer text-gray-300 font-medium mb-2">
                        View Response Data
                      </summary>
                      <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-96 bg-gray-900 p-4 rounded">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {!selectedEndpoint && selectedConfigId && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center text-gray-400">
                Select an API endpoint from the left to get started
              </div>
            )}

            {!selectedConfigId && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center text-gray-400">
                Select a school configuration to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
