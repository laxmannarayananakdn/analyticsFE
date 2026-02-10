import { useState, useEffect, useRef } from 'react';
import { efService, FileType, Upload } from '../services/EFService';
import UploadDetailsModal from '../components/UploadDetailsModal';
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function EFUpload() {
  // File upload state
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload history state
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [filterFileType, setFilterFileType] = useState<string>('');
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Load file types on mount
  useEffect(() => {
    loadFileTypes();
    loadUploads();
  }, []);

  // Auto-refresh uploads every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!uploading) {
        loadUploads();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [uploading]);

  const loadFileTypes = async () => {
    try {
      const types = await efService.getFileTypes();
      setFileTypes(types);
    } catch (error: any) {
      showToast('Failed to load file types', 'error');
      console.error('Error loading file types:', error);
    }
  };

  const loadUploads = async () => {
    try {
      setLoadingUploads(true);
      const data = await efService.getUploads(filterFileType || undefined, 50);
      setUploads(data);
    } catch (error: any) {
      showToast('Failed to load upload history', 'error');
      console.error('Error loading uploads:', error);
    } finally {
      setLoadingUploads(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleFileTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeCode = e.target.value;
    setSelectedFileType(typeCode);
    setSelectedFile(null);
    setUploadProgress(0);
    
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFileType) {
      showToast('Please select a file type and file', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress (actual progress would come from axios onUploadProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await efService.uploadFile(selectedFile, selectedFileType);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      showToast(
        `Successfully uploaded ${result.rowCount} records: ${result.message}`,
        'success'
      );

      // Reset form
      setSelectedFile(null);
      setSelectedFileType('');
      setUploadProgress(0);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Reload uploads
      await loadUploads();
    } catch (error: any) {
      setUploadProgress(0);
      
      // Handle structured error response
      let errorMessage = 'Failed to upload file';
      let errorDetails: string[] = [];
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // New error format with structured errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData.errors.map((err: any) => {
            if (err.details && Array.isArray(err.details)) {
              return err.details.map((detail: any) => {
                if (detail.row && detail.column) {
                  return `Row ${detail.row}, ${detail.column}: ${detail.message || err.message}`;
                }
                return detail.message || err.message;
              }).join('; ');
            }
            return err.message;
          });
        } else {
          // Fallback to old format
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      // Show main error message
      showToast(errorMessage, 'error');
      
      // Log full error details for debugging
      console.error('Upload error:', {
        message: errorMessage,
        details: errorDetails,
        fullError: error.response?.data || error
      });
      
      // If there are detailed errors, show them in console
      if (errorDetails.length > 0) {
        console.error('Validation errors:', errorDetails);
      }
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDelete = async (uploadId: number) => {
    try {
      await efService.deleteUpload(uploadId);
      showToast('Upload deleted successfully', 'success');
      setShowDeleteConfirm(null);
      await loadUploads();
    } catch (error: any) {
      showToast('Failed to delete upload', 'error');
      console.error('Delete error:', error);
    }
  };

  const handleViewDetails = async (uploadId: number) => {
    try {
      const upload = await efService.getUploadById(uploadId);
      setSelectedUpload(upload);
      setShowDetailsModal(true);
    } catch (error: any) {
      showToast('Failed to load upload details', 'error');
      console.error('Error loading upload details:', error);
    }
  };

  const getSelectedFileTypeInfo = () => {
    return fileTypes.find((ft) => ft.type_code === selectedFileType);
  };

  /**
   * Get helpful description/hint for a file type
   */
  const getFileTypeHint = (typeCode: string): string | null => {
    switch (typeCode) {
      case 'CEM_INITIAL':
        return 'Alis Prediction Report (.xls) - Contains student predictions based on GCSE and adaptive test scores';
      case 'CEM_FINAL':
        return 'Alis SLR Report (.xls) - Contains actual results with value-added analysis and residuals';
      case 'IB_EXTERNAL_EXAMS':
        return 'CSV file with IB exam results, grades, and diploma information';
      case 'MSNAV_FINANCIAL_AID':
        return 'Excel file (.xlsx) with Financial Aid and Community Status data';
      default:
        return null;
    }
  };

  /**
   * Get column information for a file type
   */
  const getFileTypeColumns = (typeCode: string): string | null => {
    switch (typeCode) {
      case 'CEM_INITIAL':
        return '15 columns including Student ID, Name, Subject, GCSE Score, Predictions, Test Scores...';
      case 'CEM_FINAL':
        return '33 columns including Student ID, Grades, GCSE metrics, Adaptive metrics, TDA metrics...';
      default:
        return null;
    }
  };

  /**
   * Get display label for a file type
   */
  const getFileTypeLabel = (typeCode: string, typeName: string): string => {
    switch (typeCode) {
      case 'CEM_INITIAL':
        return 'CEM Initial - Prediction Report';
      case 'CEM_FINAL':
        return 'CEM Final - Subject Level Analysis';
      default:
        return typeName;
    }
  };

  /**
   * Get accept attribute for file input based on file type
   */
  const getFileAcceptAttribute = (typeCode: string): string => {
    switch (typeCode) {
      case 'CEM_INITIAL':
      case 'CEM_FINAL':
        return '.xls';
      case 'IB_EXTERNAL_EXAMS':
        return '.csv';
      case 'MSNAV_FINANCIAL_AID':
        return '.xlsx';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-400 bg-green-400/20';
      case 'FAILED':
        return 'text-red-400 bg-red-400/20';
      case 'PROCESSING':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'PENDING':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4" />;
      case 'PROCESSING':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const fileTypeInfo = getSelectedFileTypeInfo();
  const expectedExtension = fileTypeInfo
    ? `.${fileTypeInfo.file_extension}`
    : '';

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">EF Data Upload</h1>
          <p className="text-gray-400">Upload and manage external data files</p>
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
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <UploadIcon className="w-6 h-6" />
              Upload File
            </h2>

            {/* File Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File Type
              </label>
              <select
                value={selectedFileType}
                onChange={handleFileTypeChange}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={uploading}
              >
                <option value="">Select file type...</option>
                {fileTypes.map((type) => (
                  <option key={type.id} value={type.type_code}>
                    {getFileTypeLabel(type.type_code, type.type_name)}
                  </option>
                ))}
              </select>
            </div>

            {/* File Format Info */}
            {selectedFileType && fileTypeInfo && (
              <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-blue-300 font-medium mb-2">
                      Expected Format:
                    </p>
                    {/* Use API description if available, otherwise use hint */}
                    {fileTypeInfo.description ? (
                      <p className="text-blue-200 text-sm mb-2">
                        {fileTypeInfo.description}
                      </p>
                    ) : (
                      getFileTypeHint(selectedFileType) && (
                        <p className="text-blue-200 text-sm mb-2">
                          {getFileTypeHint(selectedFileType)}
                        </p>
                      )
                    )}
                    <p className="text-blue-200 text-sm">
                      File extension: <strong>{expectedExtension}</strong>
                    </p>
                    {/* Show column information for CEM types */}
                    {getFileTypeColumns(selectedFileType) && (
                      <p className="text-blue-200 text-sm mt-2 italic">
                        {getFileTypeColumns(selectedFileType)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* File Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File
              </label>
              <input
                id="file-input"
                type="file"
                accept={selectedFileType ? getFileAcceptAttribute(selectedFileType) : expectedExtension}
                onChange={handleFileSelect}
                disabled={!selectedFileType || uploading}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-400">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Uploading...</span>
                  <span className="text-sm text-gray-300">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedFileType || uploading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  Upload File
                </>
              )}
            </button>
          </div>

          {/* Upload History Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Upload History
              </h2>
              <button
                onClick={loadUploads}
                disabled={loadingUploads}
                className="p-2 text-gray-400 hover:text-white transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loadingUploads ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <select
                value={filterFileType}
                onChange={(e) => {
                  setFilterFileType(e.target.value);
                  loadUploads();
                }}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All File Types</option>
                {fileTypes.map((type) => (
                  <option key={type.id} value={type.type_code}>
                    {getFileTypeLabel(type.type_code, type.type_name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Uploads Table */}
            {loadingUploads ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No uploads found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        File Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        File Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        Rows
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        Uploaded By
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((upload) => {
                      const fileType = fileTypes.find(
                        (ft) => ft.id === upload.file_type_id
                      );
                      return (
                        <tr
                          key={upload.id}
                          className="border-b border-gray-700 hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {fileType?.type_name || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            <div className="max-w-[200px] truncate" title={upload.file_name}>
                              {upload.file_name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {upload.row_count ?? 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                upload.status
                              )}`}
                            >
                              {getStatusIcon(upload.status)}
                              {upload.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {upload.uploaded_by}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {formatDate(upload.uploaded_at)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetails(upload.id)}
                                className="p-1 text-blue-400 hover:text-blue-300 transition"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(upload.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Upload Details Modal */}
        {selectedUpload && showDetailsModal && (
          <UploadDetailsModal
            upload={selectedUpload}
            fileTypes={fileTypes}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedUpload(null);
            }}
            onDelete={async (uploadId) => {
              await handleDelete(uploadId);
              setShowDetailsModal(false);
              setSelectedUpload(null);
            }}
            onRefresh={loadUploads}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this upload? This will also delete all
                associated data records. This action cannot be undone.
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

