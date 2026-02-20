/**
 * Sync Schedules and Runs API Service
 */

import { apiClient } from './apiClient';

export interface SyncSchedule {
  id: number;
  node_id: string;
  academic_year: string;
  cron_expression: string;
  endpoints_mb: string | null;
  endpoints_nex: string | null;
  include_descendants: boolean | number;
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface SyncRun {
  id: number;
  schedule_id: number | null;
  node_id: string;
  academic_year: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  total_schools: number;
  schools_succeeded: number;
  schools_failed: number;
  triggered_by: string;
  error_summary: string | null;
  created_at?: string;
  schools?: SyncRunSchool[];
}

export interface SyncRunSchool {
  id: number;
  sync_run_id: number;
  school_id: string;
  school_source: 'mb' | 'nex';
  config_id: number;
  school_name: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface ListRunsParams {
  node_id?: string;
  academic_year?: string;
  status?: string;
  limit?: number;
}

export interface TriggerParams {
  nodeIds?: string[];
  nodeId?: string;
  academicYear?: string;
  all?: boolean;
  includeDescendants?: boolean;
}

class SyncService {
  async getSchedules(): Promise<SyncSchedule[]> {
    const res = await apiClient.get<{ success: boolean; schedules: SyncSchedule[] }>('/api/sync/schedules');
    return res.schedules || [];
  }

  async createSchedule(data: {
    node_id: string;
    academic_year: string;
    cron_expression: string;
    endpoints_mb?: string[] | null;
    endpoints_nex?: string[] | null;
    include_descendants?: boolean;
  }): Promise<SyncSchedule> {
    const res = await apiClient.post<{ success: boolean; schedule: SyncSchedule }>('/api/sync/schedules', data);
    return res.schedule;
  }

  async updateSchedule(
    id: number,
    data: Partial<{
      node_id: string;
      academic_year: string;
      cron_expression: string;
      endpoints_mb: string[] | null;
      endpoints_nex: string[] | null;
      include_descendants: boolean;
      is_active: boolean;
    }>
  ): Promise<SyncSchedule> {
    const res = await apiClient.put<{ success: boolean; schedule: SyncSchedule }>(`/api/sync/schedules/${id}`, data);
    return res.schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await apiClient.delete(`/api/sync/schedules/${id}`);
  }

  async getRuns(params?: ListRunsParams): Promise<SyncRun[]> {
    const query: Record<string, string | number> = {};
    if (params?.node_id) query.node_id = params.node_id;
    if (params?.academic_year) query.academic_year = params.academic_year;
    if (params?.status) query.status = params.status;
    if (params?.limit) query.limit = params.limit;
    const res = await apiClient.get<{ success: boolean; runs: SyncRun[] }>('/api/sync/runs', query);
    return res.runs || [];
  }

  async getRun(id: number): Promise<SyncRun> {
    const res = await apiClient.get<{ success: boolean; run: SyncRun }>(`/api/sync/runs/${id}`);
    return res.run;
  }

  async getRunSchools(id: number, offset?: number, limit?: number): Promise<{
    schools: SyncRunSchool[];
    total: number;
  }> {
    const query: Record<string, number> = {};
    if (offset != null) query.offset = offset;
    if (limit != null) query.limit = limit;
    const res = await apiClient.get<{ success: boolean; schools: SyncRunSchool[]; total: number }>(
      `/api/sync/runs/${id}/schools`,
      Object.keys(query).length ? query : undefined
    );
    return { schools: res.schools || [], total: res.total || 0 };
  }

  async trigger(params: TriggerParams): Promise<{ runId: number; status: string }> {
    const res = await apiClient.post<{ success: boolean; runId: number; status: string }>(
      '/api/sync/trigger',
      params,
      60000
    );
    return { runId: res.runId, status: res.status };
  }

  async cancelRun(id: number): Promise<{ message?: string }> {
    const res = await apiClient.post<{ success: boolean; message?: string }>(`/api/sync/runs/${id}/cancel`, {});
    return { message: res.message };
  }
}

export const syncService = new SyncService();
