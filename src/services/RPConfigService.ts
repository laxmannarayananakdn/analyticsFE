/**
 * RP Configuration Service
 * Handles API calls for managing admin.subject_mapping, admin.assessment_component_config, admin.component_filter_config, admin.term_filter_config
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

export interface ComponentFilter {
  id?: number;
  school_id: string;
  filter_type: 'include' | 'exclude';
  pattern: string;
  display_order?: number;
}

export interface TermFilter {
  id?: number;
  school_id: string;
  filter_type: 'include' | 'exclude';
  pattern: string;
  display_order?: number;
}

export interface School {
  school_id: string;
  school_name: string;
}

export interface MarkGradeTranslationConfig {
  id?: number;
  node_id: string;
  effective_date: string;
  grade_name: string;
  marks_start: number;
  marks_end: number;
  calculated_grade: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
   * Get academic years from admin.subject_mapping
   */
  async getAcademicYears(schoolId?: string): Promise<string[]> {
    const params = schoolId ? { school_id: schoolId } : undefined;
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/academic-years', params);
    return response.data;
  }

  /**
   * Get grades from admin.subject_mapping for school + academic year
   */
  async getGrades(schoolId: string, academicYear?: string): Promise<string[]> {
    const params: Record<string, string> = { school_id: schoolId };
    if (academicYear) params.academic_year = academicYear;
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/grades', params);
    return response.data;
  }

  /**
   * Get subject names (from admin.subject_mapping + NEX.student_assessments)
   */
  async getSubjects(schoolId: string, academicYear?: string, grade?: string): Promise<string[]> {
    const params: Record<string, string> = { school_id: schoolId };
    if (academicYear) params.academic_year = academicYear;
    if (grade) params.grade = grade;
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/subjects', params);
    return response.data;
  }

  /**
   * Get subject mappings (filter by school, academic_year, grade)
   */
  async getSubjectMappings(schoolId?: string, academicYear?: string, grade?: string): Promise<SubjectMapping[]> {
    const params: Record<string, string> = {};
    if (schoolId) params.school_id = schoolId;
    if (academicYear) params.academic_year = academicYear;
    if (grade) params.grade = grade;

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

  async getComponentFilters(schoolId: string): Promise<ComponentFilter[]> {
    const response = await apiClient.get<{ success: boolean; data: ComponentFilter[] }>('/api/rp-config/component-filters', { school_id: schoolId });
    return response.data;
  }

  async saveComponentFilters(filters: ComponentFilter[]): Promise<{ success: boolean; successCount: number; errorCount?: number }> {
    return apiClient.post('/api/rp-config/component-filters', { filters });
  }

  async deleteComponentFilter(id: number): Promise<void> {
    await apiClient.delete(`/api/rp-config/component-filters/${id}`);
  }

  async getTermFilters(schoolId: string): Promise<TermFilter[]> {
    const response = await apiClient.get<{ success: boolean; data: TermFilter[] }>('/api/rp-config/term-filters', { school_id: schoolId });
    return response.data;
  }

  async saveTermFilters(filters: TermFilter[]): Promise<{ success: boolean; successCount: number; errorCount?: number }> {
    return apiClient.post('/api/rp-config/term-filters', { filters });
  }

  async deleteTermFilter(id: number): Promise<void> {
    await apiClient.delete(`/api/rp-config/term-filters/${id}`);
  }

  async getMarkGradeTranslations(nodeId?: string, effectiveDate?: string, gradeName?: string): Promise<MarkGradeTranslationConfig[]> {
    const params: Record<string, string> = {};
    if (nodeId) params.node_id = nodeId;
    if (effectiveDate) params.effective_date = effectiveDate;
    if (gradeName) params.grade_name = gradeName;
    const response = await apiClient.get<{ success: boolean; data: MarkGradeTranslationConfig[] }>('/api/rp-config/mark-grade-translations', params);
    return response.data;
  }

  async saveMarkGradeTranslations(mappings: MarkGradeTranslationConfig[]): Promise<{ success: boolean; successCount: number; errorCount?: number; errors?: string[] }> {
    return apiClient.post('/api/rp-config/mark-grade-translations', { mappings });
  }

  async deleteMarkGradeTranslation(id: number): Promise<void> {
    await apiClient.delete(`/api/rp-config/mark-grade-translations/${id}`);
  }

  async getMarkGradeEffectiveDates(nodeId: string): Promise<string[]> {
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/mark-grade-effective-dates', { node_id: nodeId });
    return response.data;
  }

  async getMarkGradeNames(nodeId: string, effectiveDate?: string): Promise<string[]> {
    const params: Record<string, string> = { node_id: nodeId };
    if (effectiveDate) params.effective_date = effectiveDate;
    const response = await apiClient.get<{ success: boolean; data: string[] }>('/api/rp-config/mark-grade-names', params);
    return response.data;
  }
}

export const rpConfigService = new RPConfigService();
