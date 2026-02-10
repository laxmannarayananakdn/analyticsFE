import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import { efService, FileType, Upload } from '../services/EFService';
import UploadDetailsModal from '../components/UploadDetailsModal';

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

export default function EFUpload() {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [filterFileType, setFilterFileType] = useState<string>('');
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  useEffect(() => { loadFileTypes(); loadUploads(); }, []);
  useEffect(() => {
    const interval = setInterval(() => { if (!uploading) loadUploads(); }, 30000);
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
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setUploadProgress(0); }
  };

  const handleFileTypeChange = (e: any) => {
    const typeCode = e.target.value;
    setSelectedFileType(typeCode);
    setSelectedFile(null);
    setUploadProgress(0);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFileType) { showToast('Please select a file type and file', 'error'); return; }
    try {
      setUploading(true);
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? (clearInterval(progressInterval), prev) : prev + 10));
      }, 200);
      const result = await efService.uploadFile(selectedFile, selectedFileType);
      clearInterval(progressInterval);
      setUploadProgress(100);
      showToast(`Successfully uploaded ${result.rowCount} records: ${result.message}`, 'success');
      setSelectedFile(null);
      setSelectedFileType('');
      setUploadProgress(0);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadUploads();
    } catch (error: any) {
      setUploadProgress(0);
      let errorMessage = 'Failed to upload file';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.message || errorMessage;
        } else {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      showToast(errorMessage, 'error');
      console.error('Upload error:', error);
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

  const getFileTypeLabel = (typeCode: string, typeName: string): string => {
    switch (typeCode) {
      case 'CEM_INITIAL': return 'CEM Initial - Prediction Report';
      case 'CEM_FINAL': return 'CEM Final - Subject Level Analysis';
      default: return typeName;
    }
  };

  const getFileAcceptAttribute = (typeCode: string): string => {
    switch (typeCode) {
      case 'CEM_INITIAL':
      case 'CEM_FINAL': return '.xls';
      case 'IB_EXTERNAL_EXAMS': return '.csv';
      case 'MSNAV_FINANCIAL_AID': return '.xlsx';
      default: return '';
    }
  };

  const getStatusSeverity = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'PROCESSING': return 'warning';
      default: return 'info';
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

  const fileTypeInfo = fileTypes.find((ft) => ft.type_code === selectedFileType);
  const expectedExtension = fileTypeInfo ? `.${fileTypeInfo.file_extension}` : '';

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>EF Data Upload</Typography>
          <Typography color="text.secondary">Upload and manage external data files</Typography>
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

        <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <UploadFileIcon /> Upload File
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>File Type</InputLabel>
                <Select value={selectedFileType} onChange={handleFileTypeChange} label="File Type" disabled={uploading}>
                  <MenuItem value="">Select file type...</MenuItem>
                  {fileTypes.map((type) => (
                    <MenuItem key={type.id} value={type.type_code}>{getFileTypeLabel(type.type_code, type.type_name)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedFileType && fileTypeInfo && (
                <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                  Expected Format: {fileTypeInfo.description || 'See documentation'}. File extension: <strong>{expectedExtension}</strong>
                </Alert>
              )}

              <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }} disabled={!selectedFileType || uploading}>
                Select File
                <input id="file-input" type="file" hidden accept={selectedFileType ? getFileAcceptAttribute(selectedFileType) : expectedExtension} onChange={handleFileSelect} />
              </Button>
              {selectedFile && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              )}

              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Uploading...</Typography>
                    <Typography variant="body2">{uploadProgress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              <Button variant="contained" fullWidth onClick={handleUpload} disabled={!selectedFile || !selectedFileType || uploading} startIcon={uploading ? <RefreshIcon /> : <UploadFileIcon />}>
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon /> Upload History
                </Typography>
                <IconButton onClick={loadUploads} disabled={loadingUploads} title="Refresh">
                  <RefreshIcon />
                </IconButton>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Filter</InputLabel>
                <Select value={filterFileType} onChange={(e) => { setFilterFileType(e.target.value); loadUploads(); }} label="Filter">
                  <MenuItem value="">All File Types</MenuItem>
                  {fileTypes.map((type) => (
                    <MenuItem key={type.id} value={type.type_code}>{getFileTypeLabel(type.type_code, type.type_name)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loadingUploads ? (
                <Typography color="text.secondary" textAlign="center" py={4}>Loading...</Typography>
              ) : uploads.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No uploads found</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>File Type</TableCell>
                        <TableCell>File Name</TableCell>
                        <TableCell>Rows</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Uploaded By</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploads.map((upload) => {
                        const fileType = fileTypes.find((ft) => ft.id === upload.file_type_id);
                        return (
                          <TableRow key={upload.id} hover>
                            <TableCell>{fileType?.type_name || 'Unknown'}</TableCell>
                            <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={upload.file_name}>{upload.file_name}</TableCell>
                            <TableCell>{upload.row_count ?? 'N/A'}</TableCell>
                            <TableCell>
                              <Chip label={upload.status} color={getStatusSeverity(upload.status)} size="small" />
                            </TableCell>
                            <TableCell>{upload.uploaded_by}</TableCell>
                            <TableCell>{formatDate(upload.uploaded_at)}</TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleViewDetails(upload.id)} title="View details"><VisibilityIcon /></IconButton>
                              <IconButton size="small" color="error" onClick={() => setShowDeleteConfirm(upload.id)} title="Delete"><DeleteIcon /></IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {selectedUpload && showDetailsModal && (
          <UploadDetailsModal
            upload={selectedUpload}
            fileTypes={fileTypes}
            onClose={() => { setShowDetailsModal(false); setSelectedUpload(null); }}
            onDelete={async (uploadId) => {
              await handleDelete(uploadId);
              setShowDetailsModal(false);
              setSelectedUpload(null);
            }}
            onRefresh={loadUploads}
          />
        )}

        <Dialog open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this upload? This will also delete all associated data records. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
