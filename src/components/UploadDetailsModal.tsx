import { useState, useEffect, useMemo } from 'react';
import { efService, Upload, FileType } from '../services/EFService';
import {
  X,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface UploadDetailsModalProps {
  upload: Upload;
  fileTypes: FileType[];
  onClose: () => void;
  onDelete: (uploadId: number) => void;
  onRefresh?: () => void;
}

export default function UploadDetailsModal({
  upload,
  fileTypes,
  onClose,
  onDelete,
  onRefresh
}: UploadDetailsModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['student', 'grades']));

  const fileType = fileTypes.find((ft) => ft.id === upload.file_type_id);

  useEffect(() => {
    loadData();
  }, [upload.id, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await efService.getUploadData(upload.id, page, limit);
      setData(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load upload data');
      console.error('Error loading upload data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      
      // Fetch all data (or at least more data)
      const result = await efService.getUploadData(upload.id, 1, 10000);
      const allData = result.data;

      // Get column headers
      const headers = allData.length > 0 ? Object.keys(allData[0]) : [];
      
      // Filter out internal columns
      const displayHeaders = headers.filter(
        (h) => !['id', 'upload_id', 'file_name', 'uploaded_at', 'uploaded_by'].includes(h)
      );

      // Create CSV content
      const csvRows = [
        displayHeaders.join(','),
        ...allData.map((row) =>
          displayHeaders
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              // Escape quotes and wrap in quotes if contains comma or quote
              const stringValue = String(value);
              if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${upload.file_name}_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
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

  /**
   * Get column tooltip text
   */
  const getColumnTooltip = (column: string): string | null => {
    const tooltips: Record<string, string> = {
      'Residual': 'Difference between actual and predicted grade',
      'Standardised_Residual': 'Residual adjusted for comparison across subjects',
      'Gender_Adj_Prediction': 'Prediction adjusted for gender-based performance patterns',
      'Gender_Adj_Residual': 'Residual adjusted for gender-based performance patterns',
      'Gender_Adj_Std_Residual': 'Standardised residual adjusted for gender-based performance patterns'
    };

    // Check if column name contains any of the tooltip keys
    for (const [key, value] of Object.entries(tooltips)) {
      if (column.includes(key)) {
        return value;
      }
    }
    return null;
  };

  /**
   * Get column groups for CEM_FINAL
   */
  const getCEMFinalColumnGroups = () => {
    return {
      student: {
        label: 'Student Info',
        columns: ['Student_ID', 'Class', 'Surname', 'Forename', 'Gender']
      },
      exam: {
        label: 'Exam Info',
        columns: ['Exam_Type', 'Subject_Title', 'Syllabus_Title', 'Exam_Board', 'Syllabus_Code']
      },
      grades: {
        label: 'Grades',
        columns: ['Grade', 'Grade_as_Points']
      },
      gcse: {
        label: 'GCSE Metrics',
        columns: [
          'GCSE_Score', 'GCSE_Prediction', 'GCSE_Residual', 'GCSE_Standardised_Residual',
          'GCSE_Gender_Adj_Prediction', 'GCSE_Gender_Adj_Residual', 'GCSE_Gender_Adj_Std_Residual'
        ]
      },
      adaptive: {
        label: 'Adaptive Test Metrics',
        columns: [
          'Adaptive_Score', 'Adaptive_Prediction', 'Adaptive_Residual', 'Adaptive_Standardised_Residual',
          'Adaptive_Gender_Adj_Prediction', 'Adaptive_Gender_Adj_Residual', 'Adaptive_Gender_Adj_Std_Residual'
        ]
      },
      tda: {
        label: 'TDA Test Metrics',
        columns: [
          'TDA_Score', 'TDA_Prediction', 'TDA_Residual', 'TDA_Standardised_Residual',
          'TDA_Gender_Adj_Prediction', 'TDA_Gender_Adj_Residual', 'TDA_Gender_Adj_Std_Residual'
        ]
      }
    };
  };

  /**
   * Get key columns for preview (simplified view)
   */
  const getKeyColumns = (): string[] => {
    if (!fileType) return [];
    
    if (fileType.type_code === 'CEM_INITIAL') {
      return [
        'Student_ID',
        'Name',
        'Class',
        'Subject',
        'Level',
        'Test_Score',
        'Test_Prediction_Grade'
      ];
    } else if (fileType.type_code === 'CEM_FINAL') {
      // Use 'Name' as a placeholder - we'll combine Surname and Forename
      return [
        'Student_ID',
        'Name', // This will be replaced with combined Surname + Forename
        'Subject_Title',
        'Grade',
        'Adaptive_Prediction',
        'Adaptive_Residual'
      ];
    }
    return [];
  };

  /**
   * Format name for CEM_FINAL (combine Surname and Forename)
   */
  const formatCEMFinalName = (row: any): string => {
    const surname = row.Surname || '';
    const forename = row.Forename || '';
    if (surname && forename) {
      return `${forename} ${surname}`;
    }
    return surname || forename || '-';
  };

  /**
   * Get all columns for a file type
   */
  const getAllColumns = (): string[] => {
    if (!fileType) return [];
    
    if (fileType.type_code === 'IB_EXTERNAL_EXAMS') {
      return [
        'Year',
        'Month',
        'School',
        'Registration_Number',
        'Personal_Code',
        'Name',
        'Category',
        'Subject',
        'Level',
        'Language',
        'Predicted_Grade',
        'Grade',
        'EE_TOK_Points',
        'Total_Points',
        'Result',
        'Diploma_Requirements_Code'
      ];
    } else if (fileType.type_code === 'MSNAV_FINANCIAL_AID') {
      return [
        'S_No',
        'UCI',
        'Academic_Year',
        'Class',
        'Class_Code',
        'Student_No',
        'Student_Name',
        'Percentage',
        'Fee_Classification',
        'FA_Sub_Type',
        'Fee_Code',
        'Community_Status'
      ];
    } else if (fileType.type_code === 'CEM_INITIAL') {
      return [
        'Student_ID',
        'Class',
        'Name',
        'Gender',
        'Date_of_Birth',
        'Year_Group',
        'GCSE_Score',
        'Subject',
        'Level',
        'GCSE_Prediction_Points',
        'GCSE_Prediction_Grade',
        'Test_Taken',
        'Test_Score',
        'Test_Prediction_Points',
        'Test_Prediction_Grade'
      ];
    } else if (fileType.type_code === 'CEM_FINAL') {
      // Return all columns for CEM_FINAL, but replace Surname/Forename with combined Name
      const groups = getCEMFinalColumnGroups();
      const allCols = [
        ...groups.student.columns,
        ...groups.exam.columns,
        ...groups.grades.columns,
        ...groups.gcse.columns,
        ...groups.adaptive.columns,
        ...groups.tda.columns
      ];
      // Replace Surname and Forename with a combined Name column
      const nameIndex = allCols.indexOf('Surname');
      if (nameIndex !== -1) {
        allCols[nameIndex] = 'Name'; // Replace Surname with Name
        const forenameIndex = allCols.indexOf('Forename');
        if (forenameIndex !== -1) {
          allCols.splice(forenameIndex, 1); // Remove Forename
        }
      }
      return allCols;
    }
    return [];
  };

  /**
   * Get columns to display based on file type and showAllColumns setting
   */
  const getColumns = () => {
    if (!fileType) return [];
    
    // For CEM types, show key columns by default, all columns if toggle is on
    if (fileType.type_code === 'CEM_INITIAL' || fileType.type_code === 'CEM_FINAL') {
      return showAllColumns ? getAllColumns() : getKeyColumns();
    }
    
    // For other types, always show all columns
    return getAllColumns();
  };

  /**
   * Format cell value with color coding for residuals
   */
  const formatCellValue = (column: string, value: any): { text: string; className: string } => {
    if (value === null || value === undefined) {
      return { text: '-', className: '' };
    }

    const text = String(value);
    
    // Color code residuals: green for positive, red for negative
    if (column.includes('Residual') && !column.includes('Standardised') && typeof value === 'number') {
      if (value > 0) {
        return { text, className: 'text-green-400 font-medium' };
      } else if (value < 0) {
        return { text, className: 'text-red-400 font-medium' };
      }
    }
    
    return { text, className: '' };
  };

  /**
   * Toggle section expansion for CEM_FINAL
   */
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const columns = getColumns();
  const totalPages = Math.ceil(total / limit);
  const displayData = filteredAndSortedData.slice(0, limit);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Upload Details</h2>
            <p className="text-gray-400 text-sm mt-1">Upload ID: {upload.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Metadata */}
          <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">File Type</label>
                <p className="text-white">{fileType?.type_name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">File Name</label>
                <p className="text-white break-all">{upload.file_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">File Size</label>
                <p className="text-white">{formatFileSize(upload.file_size_bytes)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Rows Uploaded</label>
                <p className="text-white">{upload.row_count ?? 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Status</label>
                <p className="text-white">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      upload.status
                    )}`}
                  >
                    {getStatusIcon(upload.status)}
                    {upload.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Uploaded By</label>
                <p className="text-white">{upload.uploaded_by}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Upload Date/Time</label>
                <p className="text-white">{formatDate(upload.uploaded_at)}</p>
              </div>
              {upload.processed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Processed Date/Time</label>
                  <p className="text-white">{formatDate(upload.processed_at)}</p>
                </div>
              )}
            </div>
            {upload.error_message && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <label className="text-sm font-medium text-red-400">Error Message</label>
                    <p className="text-red-300 mt-1">{upload.error_message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Preview */}
          {upload.status === 'COMPLETED' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Data Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={exporting || data.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Show All Columns Toggle for CEM types */}
              {(fileType?.type_code === 'CEM_INITIAL' || fileType?.type_code === 'CEM_FINAL') && (
                <div className="mb-4 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllColumns}
                      onChange={(e) => setShowAllColumns(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show All Columns ({getAllColumns().length} total)</span>
                  </label>
                  {!showAllColumns && (
                    <span className="text-xs text-gray-400">
                      (Showing {getKeyColumns().length} key columns)
                    </span>
                  )}
                </div>
              )}

              {/* Data Table */}
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-gray-400">Loading data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : displayData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No data found</p>
                </div>
              ) : fileType?.type_code === 'CEM_FINAL' && !showAllColumns ? (
                // CEM_FINAL with grouped sections (when not showing all columns)
                <div className="space-y-4">
                  {/* Key columns table first */}
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700">
                      <span className="font-medium text-white">Key Information</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700 bg-gray-800/50">
                            {getKeyColumns().map((column) => {
                              const tooltip = getColumnTooltip(column);
                              return (
                                <th
                                  key={column}
                                  className="text-left py-2 px-4 text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-700/50 transition relative group"
                                  onClick={() => {
                                    // For Name column, sort by Surname first
                                    if (column === 'Name') {
                                      handleSort('Surname');
                                    } else {
                                      handleSort(column);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    {column.replace(/_/g, ' ')}
                                    <ArrowUpDown className="w-3 h-3" />
                                    {tooltip && (
                                      <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap border border-gray-700">
                                        <Info className="w-3 h-3 inline mr-1" />
                                        {tooltip}
                                      </div>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.map((row, idx) => (
                            <tr
                              key={row.id || idx}
                              className="border-b border-gray-700 hover:bg-gray-700/30"
                            >
                              {getKeyColumns().map((column) => {
                                let displayValue: any;
                                if (column === 'Surname' || column === 'Forename') {
                                  displayValue = formatCEMFinalName(row);
                                } else {
                                  displayValue = row[column];
                                }
                                const { text, className } = formatCellValue(column, displayValue);
                                return (
                                  <td key={column} className={`py-2 px-4 text-xs text-gray-300 ${className}`}>
                                    {text}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expandable sections for other column groups */}
                  {Object.entries(getCEMFinalColumnGroups()).map(([key, group]) => {
                    // Skip student and grades sections as they're in key columns
                    if (key === 'student' || key === 'grades') return null;
                    
                    const isExpanded = expandedSections.has(key);
                    const visibleColumns = isExpanded ? group.columns : [];
                    const hasVisibleData = visibleColumns.some(col => 
                      displayData.some(row => row[col] !== null && row[col] !== undefined)
                    );

                    return (
                      <div key={key} className="border border-gray-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection(key)}
                          className="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-700/70 transition flex items-center justify-between text-left"
                        >
                          <span className="font-medium text-white">{group.label}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {isExpanded && hasVisibleData && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-700 bg-gray-800/50">
                                  {visibleColumns.map((column) => {
                                    const tooltip = getColumnTooltip(column);
                                    return (
                                      <th
                                        key={column}
                                        className="text-left py-2 px-4 text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-700/50 transition relative group"
                                        onClick={() => handleSort(column)}
                                      >
                                        <div className="flex items-center gap-1">
                                          {column.replace(/_/g, ' ')}
                                          <ArrowUpDown className="w-3 h-3" />
                                          {tooltip && (
                                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap border border-gray-700">
                                              <Info className="w-3 h-3 inline mr-1" />
                                              {tooltip}
                                            </div>
                                          )}
                                        </div>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {displayData.map((row, idx) => (
                                  <tr
                                    key={row.id || idx}
                                    className="border-b border-gray-700 hover:bg-gray-700/30"
                                  >
                                    {visibleColumns.map((column) => {
                                      const { text, className } = formatCellValue(column, row[column]);
                                      return (
                                        <td key={column} className={`py-2 px-4 text-xs text-gray-300 ${className}`}>
                                          {text}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-400">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} rows
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-white px-4">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {searchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      Showing {displayData.length} of {data.length} rows (filtered)
                    </div>
                  )}
                </div>
              ) : (
                // Standard table view for all other cases
                <>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {columns.map((column) => {
                            const tooltip = getColumnTooltip(column);
                            return (
                              <th
                                key={column}
                                className="text-left py-3 px-4 text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-700/50 transition relative group"
                                onClick={() => handleSort(column)}
                              >
                                <div className="flex items-center gap-2">
                                  {column.replace(/_/g, ' ')}
                                  <ArrowUpDown className="w-4 h-4" />
                                  {tooltip && (
                                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap border border-gray-700">
                                      <Info className="w-3 h-3 inline mr-1" />
                                      {tooltip}
                                    </div>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.map((row, idx) => (
                          <tr
                            key={row.id || idx}
                            className="border-b border-gray-700 hover:bg-gray-700/30"
                          >
                            {columns.map((column) => {
                              // For CEM_FINAL, combine Surname and Forename when column is 'Name'
                              let displayValue: any = row[column];
                              if (fileType?.type_code === 'CEM_FINAL' && column === 'Name') {
                                displayValue = formatCEMFinalName(row);
                              }
                              const { text, className } = formatCellValue(column, displayValue);
                              return (
                                <td key={column} className={`py-3 px-4 text-sm text-gray-300 ${className}`}>
                                  {text}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-400">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} rows
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-white px-4">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {searchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      Showing {displayData.length} of {data.length} rows (filtered)
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {upload.status !== 'COMPLETED' && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {upload.status === 'FAILED'
                  ? 'Upload failed. Data is not available.'
                  : 'Data preview will be available once processing is complete.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
          <div className="flex items-center gap-4">
            {onRefresh && (
              <button
                onClick={() => {
                  onRefresh();
                  loadData();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Refresh
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Upload
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this upload? This will also delete all
              associated data records ({upload.row_count || 0} rows). This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  onDelete(upload.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

