/**
 * Database Service
 * Frontend service for database operations via API
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface School {
  id: number;
  name: string;
  subdomain?: string;
  country?: string;
  language?: string;
  session_in_may?: boolean;
  kbl_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: number;
  grade_id?: number;
  year_group_id?: number;
  uniq_student_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  gender?: string;
  birthday?: string;
  archived?: boolean;
  program?: string;
  program_code?: string;
  class_grade?: string;
  class_grade_number?: number;
  graduating_year?: number;
  nationalities?: string;
  languages?: string;
  timezone?: string;
  ui_language?: string;
  student_id?: string;
  identifier?: string;
  oa_id?: string;
  withdrawn_on?: string;
  photo_url?: string;
  homeroom_advisor_id?: number;
  attendance_start_date?: string;
  parent_ids?: string;
  additional_homeroom_advisor_ids?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TermGrade {
  student_id: number;
  class_id: number;
  term_id: number;
  grade?: string;
  average_percent?: number;
  comments?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentMetrics {
  totalStudents: number;
  averageGrade: number;
  attendanceRate: number;
}

export interface SubjectPerformance {
  subject: string;
  averageGrade: number;
  studentCount: number;
}

export interface StudentVsClassAverage {
  subject: string;
  grade: string;
  classId: number;
  students: Array<{
    studentId: number;
    studentName: string;
    studentScore: number;
    classAverage: number;
    difference: number;
  }>;
}

export class DatabaseService {
  /**
   * Get school by ID
   */
  async getSchool(schoolId: number): Promise<School> {
    return apiClient.get<School>(`${API_ENDPOINTS.SCHOOLS}/${schoolId}`);
  }

  /**
   * Create or update school
   */
  async upsertSchool(school: School): Promise<School> {
    return apiClient.post<School>(API_ENDPOINTS.SCHOOLS, school);
  }

  /**
   * Get students with optional filters
   */
  async getStudents(filters?: {
    archived?: boolean;
    grade_id?: number;
    year_group_id?: number;
  }): Promise<Student[]> {
    return apiClient.get<Student[]>(API_ENDPOINTS.STUDENTS, filters);
  }

  /**
   * Create or update students (bulk)
   */
  async upsertStudents(students: Student[]): Promise<{ data: Student[]; errors: string[] }> {
    return apiClient.post<{ data: Student[]; errors: string[] }>(
      API_ENDPOINTS.STUDENTS,
      students
    );
  }

  /**
   * Create or update term grades (bulk)
   */
  async upsertTermGrades(termGrades: TermGrade[]): Promise<{ data: TermGrade[]; errors: string[] }> {
    return apiClient.post<{ data: TermGrade[]; errors: string[] }>(
      API_ENDPOINTS.TERM_GRADES,
      termGrades
    );
  }

  /**
   * Get student metrics
   */
  async getStudentMetrics(): Promise<StudentMetrics> {
    return apiClient.get<StudentMetrics>(API_ENDPOINTS.ANALYTICS.METRICS);
  }

  /**
   * Get subject performance data
   */
  async getSubjectPerformance(): Promise<SubjectPerformance[]> {
    return apiClient.get<SubjectPerformance[]>(API_ENDPOINTS.ANALYTICS.SUBJECT_PERFORMANCE);
  }

  /**
   * Get student vs class average data
   */
  async getStudentVsClassAverage(): Promise<StudentVsClassAverage[]> {
    return apiClient.get<StudentVsClassAverage[]>(API_ENDPOINTS.ANALYTICS.STUDENT_VS_CLASS_AVERAGE);
  }
}

export const databaseService = new DatabaseService();

