/**
 * RP Configuration Service
 * Handles API calls for managing RP.subject_mapping and RP.assessment_component_config
 */

import { apiClient } from './apiClient';

export interface SubjectMapping {
  id?: number;
  school_id: string;
  academic_year: string;
  grade: string;
  subject: string;
  reported_subject?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentComponentConfig {
  id?: number;
  school_id: string;
  component_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface School {
  school_id: string;
  school_name: string;
}

export interface RPConfigResponse<T> {
  success: boolean;
  count?: number;
  data: T[];
  message?: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
}

class RPConfigService {
  /**
   * Get schools list
   */
  async getSchools(): Promise<School[]> {
    const response = await apiClient.get<RPConfigResponse<School>>('/api/rp-config/schools');
    return response.data;
  }

  /**
   * Get academic years list (from NEX.student_allocations).
   * @param schoolId - optional; when provided, returns only years for that school
   */
  async getAcademicYears(schoolId?: string): Promise<string[]> {
    const params = schoolId ? { school_id: schoolId } : undefined;
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/academic-years', params);
    return response.data;
  }

  /**
   * Get subject names for a school (from NEX.subjects - populated by Student Allocations).
   */
  async getSubjects(schoolId: string): Promise<string[]> {
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/subjects', { school_id: schoolId });
    return response.data;
  }

  /**
   * Get subject mappings
   */
  async getSubjectMappings(schoolId?: string, academicYear?: string): Promise<SubjectMapping[]> {
    const params: any = {};
    if (schoolId) params.school_id = schoolId;
    if (academicYear) params.academic_year = academicYear;

    const response = await apiClient.get<RPConfigResponse<SubjectMapping>>('/api/rp-config/subject-mapping', params);
    return response.data;
  }

  /**
   * Save subject mappings (bulk create/update)
   */
  async saveSubjectMappings(mappings: SubjectMapping[]): Promise<RPConfigResponse<SubjectMapping>> {
    const response = await apiClient.post<RPConfigResponse<SubjectMapping>>('/api/rp-config/subject-mapping', {
      mappings
    });
    return response;
  }

  /**
   * Delete a subject mapping
   */
  async deleteSubjectMapping(id: number): Promise<void> {
    await apiClient.delete<{ success: boolean; message: string }>(`/api/rp-config/subject-mapping/${id}`);
  }

  /**
   * Get assessment component configs
   */
  async getAssessmentComponentConfigs(schoolId?: string): Promise<AssessmentComponentConfig[]> {
    const params: any = {};
    if (schoolId) params.school_id = schoolId;

    const response = await apiClient.get<RPConfigResponse<AssessmentComponentConfig>>('/api/rp-config/assessment-component-config', params);
    return response.data;
  }

  /**
   * Save assessment component configs (bulk create/update)
   */
  async saveAssessmentComponentConfigs(configs: AssessmentComponentConfig[]): Promise<RPConfigResponse<AssessmentComponentConfig>> {
    const response = await apiClient.post<RPConfigResponse<AssessmentComponentConfig>>('/api/rp-config/assessment-component-config', {
      configs
    });
    return response;
  }

  /**
   * Delete an assessment component config
   */
  async deleteAssessmentComponentConfig(id: number): Promise<void> {
    await apiClient.delete<{ success: boolean; message: string }>(`/api/rp-config/assessment-component-config/${id}`);
  }
}

export const rpConfigService = new RPConfigService();
