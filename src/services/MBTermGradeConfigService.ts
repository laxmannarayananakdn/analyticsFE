/**
 * ManageBac Term Grade Rubric Config Service
 * Maps rubric titles to term_ids per school, academic year, grade_number
 */

import { apiClient } from './apiClient';

export interface MBTermGradeRubricConfig {
  id?: number;
  school_id: number;
  academic_year: string;
  grade_number: number;
  rubric_title: string;
  term_id: number;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MBSchool {
  school_id: number;
  school_name: string;
}

export interface MBTermGradeConfigResponse {
  success: boolean;
  data: MBTermGradeRubricConfig[];
}

export interface MBSchoolsResponse {
  success: boolean;
  data: MBSchool[];
}

export interface MBSaveResponse {
  success: boolean;
  successCount: number;
  errorCount?: number;
  errors?: string[];
}

class MBTermGradeConfigService {
  async getSchools(): Promise<MBSchool[]> {
    const res = await apiClient.get<MBSchoolsResponse>('/api/managebac-config/term-grade-rubric-config/schools');
    return res.data || [];
  }

  async getConfig(params: { school_id?: number; academic_year?: string; grade_number?: number }): Promise<MBTermGradeRubricConfig[]> {
    const q = new URLSearchParams();
    if (params.school_id != null) q.set('school_id', String(params.school_id));
    if (params.academic_year) q.set('academic_year', params.academic_year);
    if (params.grade_number != null) q.set('grade_number', String(params.grade_number));
    const res = await apiClient.get<MBTermGradeConfigResponse>(
      `/api/managebac-config/term-grade-rubric-config?${q.toString()}`
    );
    return res.data || [];
  }

  async saveConfig(configs: MBTermGradeRubricConfig[]): Promise<MBSaveResponse> {
    return apiClient.post<MBSaveResponse>('/api/managebac-config/term-grade-rubric-config', { configs });
  }

  async deleteConfig(id: number): Promise<void> {
    await apiClient.delete(`/api/managebac-config/term-grade-rubric-config/${id}`);
  }
}

export const mbTermGradeConfigService = new MBTermGradeConfigService();
