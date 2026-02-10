/**
 * EF (External Files) Upload Service
 * Handles API calls for file upload system
 */

import { apiClient } from './apiClient';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface FileType {
  id: number;
  type_code: string;
  type_name: string;
  description?: string;
  file_extension: string;
  target_table: string;
  is_active: boolean;
  validation_rules?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Upload {
  id: number;
  file_type_id: number;
  file_name: string;
  file_size_bytes?: number;
  row_count?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  uploaded_by: string;
  uploaded_at: Date;
  processed_at?: Date;
}

export interface ValidationErrorDetail {
  row?: number;
  column?: string;
  value?: string;
  expected?: string;
  message?: string;
}

export interface UploadError {
  code: string;
  message: string;
  step?: 'VALIDATION' | 'PARSE' | 'VALIDATE_DATA' | 'INSERT' | 'UNKNOWN';
  details?: ValidationErrorDetail[];
}

export interface UploadResponse {
  uploadId: number;
  status: string;
  rowCount: number;
  message: string;
  skippedRows?: number;
  totalRows?: number;
}

export interface UploadErrorResponse {
  code: string;
  message: string;
  errors: UploadError[];
  skippedRows?: number;
  totalRows?: number;
  uploadId?: number | null;
}

export interface FileTypesResponse {
  fileTypes: FileType[];
}

export interface UploadsResponse {
  uploads: Upload[];
}

export interface UploadDetailResponse {
  upload: Upload;
}

class EFService {
  /**
   * Get active file types
   */
  async getFileTypes(): Promise<FileType[]> {
    const response = await apiClient.get<FileTypesResponse>('/api/ef/file-types');
    return response.fileTypes;
  }

  /**
   * Upload a file
   */
  async uploadFile(
    file: File,
    fileTypeCode: string,
    uploadedBy?: string,
    skipInvalidRows: boolean = false
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileTypeCode', fileTypeCode);
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }
    formData.append('skipInvalidRows', skipInvalidRows.toString());

    try {
      const response = await axios.post<UploadResponse>(
        `${API_BASE_URL}/api/ef/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes for large files
          onUploadProgress: () => {
            // Progress will be handled by the component
          },
        }
      );

      return response.data;
    } catch (error: any) {
      // Re-throw with better error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw {
          ...error,
          response: {
            ...error.response,
            data: error.response.data
          }
        };
      }
      throw error;
    }
  }

  /**
   * Get recent uploads
   */
  async getUploads(fileTypeCode?: string, limit?: number): Promise<Upload[]> {
    const params: Record<string, any> = {};
    if (fileTypeCode) params.fileTypeCode = fileTypeCode;
    if (limit) params.limit = limit;

    const response = await apiClient.get<UploadsResponse>('/api/ef/uploads', params);
    return response.uploads;
  }

  /**
   * Get upload by ID
   */
  async getUploadById(uploadId: number): Promise<Upload> {
    const response = await apiClient.get<UploadDetailResponse>(`/api/ef/uploads/${uploadId}`);
    return response.upload;
  }

  /**
   * Get upload data (paginated)
   */
  async getUploadData(
    uploadId: number,
    page: number = 1,
    limit: number = 100
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    return await apiClient.get<{ data: any[]; total: number; page: number; limit: number }>(
      `/api/ef/uploads/${uploadId}/data`,
      { page, limit }
    );
  }

  /**
   * Retry a failed upload
   */
  async retryUpload(uploadId: number): Promise<{ success: boolean; message: string; uploadId: number }> {
    return await apiClient.post<{ success: boolean; message: string; uploadId: number }>(
      `/api/ef/uploads/${uploadId}/retry`
    );
  }

  /**
   * Delete upload
   */
  async deleteUpload(uploadId: number): Promise<{ success: boolean; message: string }> {
    return await apiClient.delete<{ success: boolean; message: string }>(
      `/api/ef/uploads/${uploadId}`
    );
  }
}

export const efService = new EFService();

