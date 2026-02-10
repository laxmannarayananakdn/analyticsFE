import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorIcon from '@mui/icons-material/Error';
import { efService, Upload, FileType } from '../services/EFService';

interface UploadDetailsModalProps {
  upload: Upload;
  fileTypes: FileType[];
  onClose: () => void;
  onDelete: (uploadId: number) => void;
  onRefresh?: () => void;
}

export default function UploadDetailsModal({ upload, fileTypes, onClose, onDelete, onRefresh }: UploadDetailsModalProps) {
  const { showToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 100;
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['student', 'grades']));

  const fileType = fileTypes.find((ft) => ft.id === upload.file_type_id);

  useEffect(() => { loadData(); }, [upload.id, page]);

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

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) => Object.values(row).some((value) => value != null && String(value).toLowerCase().includes(term)));
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const comparison = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const result = await efService.getUploadData(upload.id, 1, 10000);
      const allData = result.data;
      const headers = allData.length > 0 ? Object.keys(allData[0]) : [];
      const displayHeaders = headers.filter((h) => !['id', 'upload_id', 'file_name', 'uploaded_at', 'uploaded_by'].includes(h));
      const csvRows = [
        displayHeaders.join(','),
        ...allData.map((row) =>
          displayHeaders.map((header) => {
            const value = row[header];
            if (value == null) return '';
            const s = String(value);
            return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(',')
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${upload.file_name}_data.csv`;
      link.click();
    } catch (err: any) {
      showToast('Failed to export CSV: ' + err.message, 'error');
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

  const formatDate = (date: Date | string) => (typeof date === 'string' ? new Date(date) : date).toLocaleString();

  const getStatusSeverity = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'PROCESSING': return 'warning';
      default: return 'info';
    }
  };

  const getCEMFinalColumnGroups = () => ({
    student: { label: 'Student Info', columns: ['Student_ID', 'Class', 'Surname', 'Forename', 'Gender'] },
    exam: { label: 'Exam Info', columns: ['Exam_Type', 'Subject_Title', 'Syllabus_Title', 'Exam_Board', 'Syllabus_Code'] },
    grades: { label: 'Grades', columns: ['Grade', 'Grade_as_Points'] },
    gcse: { label: 'GCSE Metrics', columns: ['GCSE_Score', 'GCSE_Prediction', 'GCSE_Residual', 'GCSE_Standardised_Residual', 'GCSE_Gender_Adj_Prediction', 'GCSE_Gender_Adj_Residual', 'GCSE_Gender_Adj_Std_Residual'] },
    adaptive: { label: 'Adaptive Test Metrics', columns: ['Adaptive_Score', 'Adaptive_Prediction', 'Adaptive_Residual', 'Adaptive_Standardised_Residual', 'Adaptive_Gender_Adj_Prediction', 'Adaptive_Gender_Adj_Residual', 'Adaptive_Gender_Adj_Std_Residual'] },
    tda: { label: 'TDA Test Metrics', columns: ['TDA_Score', 'TDA_Prediction', 'TDA_Residual', 'TDA_Standardised_Residual', 'TDA_Gender_Adj_Prediction', 'TDA_Gender_Adj_Residual', 'TDA_Gender_Adj_Std_Residual'] },
  });

  const getKeyColumns = (): string[] => {
    if (!fileType) return [];
    if (fileType.type_code === 'CEM_INITIAL') return ['Student_ID', 'Name', 'Class', 'Subject', 'Level', 'Test_Score', 'Test_Prediction_Grade'];
    if (fileType.type_code === 'CEM_FINAL') return ['Student_ID', 'Name', 'Subject_Title', 'Grade', 'Adaptive_Prediction', 'Adaptive_Residual'];
    return [];
  };

  const formatCEMFinalName = (row: any): string => {
    const surname = row.Surname || '';
    const forename = row.Forename || '';
    return (surname && forename) ? `${forename} ${surname}` : (surname || forename || '-');
  };

  const getAllColumns = (): string[] => {
    if (!fileType) return [];
    if (fileType.type_code === 'IB_EXTERNAL_EXAMS') return ['Year', 'Month', 'School', 'Registration_Number', 'Personal_Code', 'Name', 'Category', 'Subject', 'Level', 'Language', 'Predicted_Grade', 'Grade', 'EE_TOK_Points', 'Total_Points', 'Result', 'Diploma_Requirements_Code'];
    if (fileType.type_code === 'MSNAV_FINANCIAL_AID') return ['S_No', 'UCI', 'Academic_Year', 'Class', 'Class_Code', 'Student_No', 'Student_Name', 'Percentage', 'Fee_Classification', 'FA_Sub_Type', 'Fee_Code', 'Community_Status'];
    if (fileType.type_code === 'CEM_INITIAL') return ['Student_ID', 'Class', 'Name', 'Gender', 'Date_of_Birth', 'Year_Group', 'GCSE_Score', 'Subject', 'Level', 'GCSE_Prediction_Points', 'GCSE_Prediction_Grade', 'Test_Taken', 'Test_Score', 'Test_Prediction_Points', 'Test_Prediction_Grade'];
    if (fileType.type_code === 'CEM_FINAL') {
      const groups = getCEMFinalColumnGroups();
      const allCols = [...groups.student.columns, ...groups.exam.columns, ...groups.grades.columns, ...groups.gcse.columns, ...groups.adaptive.columns, ...groups.tda.columns];
      const nameIndex = allCols.indexOf('Surname');
      if (nameIndex !== -1) {
        allCols[nameIndex] = 'Name';
        const fi = allCols.indexOf('Forename');
        if (fi !== -1) allCols.splice(fi, 1);
      }
      return allCols;
    }
    return [];
  };

  const getColumns = () => {
    if (!fileType) return [];
    if (fileType.type_code === 'CEM_INITIAL' || fileType.type_code === 'CEM_FINAL') return showAllColumns ? getAllColumns() : getKeyColumns();
    return getAllColumns();
  };

  const formatCellValue = (column: string, value: any): { text: string; color?: string } => {
    if (value == null) return { text: '-' };
    const text = String(value);
    if (column.includes('Residual') && !column.includes('Standardised') && typeof value === 'number') {
      if (value > 0) return { text, color: 'success.main' };
      if (value < 0) return { text, color: 'error.main' };
    }
    return { text };
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const columns = getColumns();
  const totalPages = Math.ceil(total / limit);
  const displayData = filteredAndSortedData.slice(0, limit);

  const renderDataTable = (cols: string[], getDisplayValue: (row: any, col: string) => any) => (
    <Table size="small">
      <TableHead>
        <TableRow>
          {cols.map((col) => (
            <TableCell key={col} component="th" onClick={() => (col === 'Name' ? handleSort('Surname') : handleSort(col))} sx={{ cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {col.replace(/_/g, ' ')}
                <SwapVertIcon fontSize="small" />
              </Box>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {displayData.map((row, idx) => (
          <TableRow key={row.id || idx} hover>
            {cols.map((col) => {
              const val = getDisplayValue(row, col);
              const { text, color } = formatCellValue(col, val);
              return (
                <TableCell key={col} sx={{ color: color || 'inherit' }}>{text}</TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { maxHeight: '95vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Upload Details</Typography>
          <Typography variant="body2" color="text.secondary">Upload ID: {upload.id}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Upload Information</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box><Typography variant="caption" color="text.secondary">File Type</Typography><Typography>{fileType?.type_name || 'Unknown'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">File Name</Typography><Typography sx={{ wordBreak: 'break-all' }}>{upload.file_name}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">File Size</Typography><Typography>{formatFileSize(upload.file_size_bytes)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Rows</Typography><Typography>{upload.row_count ?? 'N/A'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Status</Typography><Chip label={upload.status} color={getStatusSeverity(upload.status)} size="small" /></Box>
            <Box><Typography variant="caption" color="text.secondary">Uploaded By</Typography><Typography>{upload.uploaded_by}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Upload Date</Typography><Typography>{formatDate(upload.uploaded_at)}</Typography></Box>
            {upload.processed_at && <Box><Typography variant="caption" color="text.secondary">Processed</Typography><Typography>{formatDate(upload.processed_at)}</Typography></Box>}
          </Box>
          {upload.error_message && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.dark', borderRadius: 1 }}>
              <Typography variant="body2" color="error.contrastText">{upload.error_message}</Typography>
            </Box>
          )}
        </Box>

        {upload.status === 'COMPLETED' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Data Preview</Typography>
              <Button variant="contained" color="success" onClick={handleExportCSV} disabled={exporting || data.length === 0} startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}>
                Export CSV
              </Button>
            </Box>
            <TextField
              fullWidth
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
            {(fileType?.type_code === 'CEM_INITIAL' || fileType?.type_code === 'CEM_FINAL') && (
              <FormControlLabel
                control={<Checkbox checked={showAllColumns} onChange={(e) => setShowAllColumns(e.target.checked)} />}
                label={`Show All Columns (${getAllColumns().length} total)`}
                sx={{ mb: 2 }}
              />
            )}

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading data...</Typography></Box>
            ) : error ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
                <Button variant="contained" onClick={loadData} sx={{ mt: 2 }}>Retry</Button>
              </Box>
            ) : displayData.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>No data found</Typography>
            ) : fileType?.type_code === 'CEM_FINAL' && !showAllColumns ? (
              <Box>
                <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover' }}><Typography fontWeight={500}>Key Information</Typography></Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    {renderDataTable(getKeyColumns(), (row, col) => (col === 'Name' ? formatCEMFinalName(row) : row[col]))}
                  </Box>
                </Paper>
                {Object.entries(getCEMFinalColumnGroups()).map(([key, group]) => {
                  if (key === 'student' || key === 'grades') return null;
                  const isExpanded = expandedSections.has(key);
                  const hasVisibleData = group.columns.some((col) => displayData.some((row) => row[col] != null));
                  return (
                    <Accordion key={key} expanded={isExpanded} onChange={() => toggleSection(key)}>
                      <AccordionSummary expandIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
                        <Typography fontWeight={500}>{group.label}</Typography>
                      </AccordionSummary>
                      {hasVisibleData && (
                        <AccordionDetails>
                          <Box sx={{ overflowX: 'auto' }}>{renderDataTable(group.columns, (row, col) => row[col])}</Box>
                        </AccordionDetails>
                      )}
                    </Accordion>
                  );
                })}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeftIcon /></IconButton>
                      <Typography sx={{ alignSelf: 'center' }}>Page {page} of {totalPages}</Typography>
                      <IconButton size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRightIcon /></IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                  <Box sx={{ overflowX: 'auto' }}>
                    {renderDataTable(columns, (row, col) => (fileType?.type_code === 'CEM_FINAL' && col === 'Name' ? formatCEMFinalName(row) : row[col]))}
                  </Box>
                </Paper>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeftIcon /></IconButton>
                      <Typography sx={{ alignSelf: 'center' }}>Page {page} of {totalPages}</Typography>
                      <IconButton size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRightIcon /></IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {upload.status !== 'COMPLETED' && (
          <Typography color="text.secondary" textAlign="center" py={4}>
            {upload.status === 'FAILED' ? 'Upload failed. Data is not available.' : 'Data preview will be available once processing is complete.'}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {onRefresh && (
          <Button variant="contained" onClick={() => { onRefresh(); loadData(); }}>Refresh</Button>
        )}
        <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setShowDeleteConfirm(true)}>
          Delete Upload
        </Button>
      </DialogActions>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this upload? This will also delete all associated data records ({upload.row_count || 0} rows). This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => { onDelete(upload.id); setShowDeleteConfirm(false); onClose(); }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
