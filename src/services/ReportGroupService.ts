/**
 * Report Group Service
 * Manages report groups and user-report-group assignments
 */

import { apiClient } from './apiClient';
import API_ENDPOINTS from '../config/api';

const BASE = API_ENDPOINTS.REPORT_GROUPS;
const USERS_BASE = API_ENDPOINTS.USERS.BASE;

export interface ReportGroup {
  reportGroupId: string;
  groupName: string;
  groupDescription: string | null;
}

export async function getReportGroups(): Promise<ReportGroup[]> {
  return apiClient.get(BASE);
}

export async function createReportGroup(data: {
  reportGroupId: string;
  groupName: string;
  groupDescription?: string;
}): Promise<ReportGroup> {
  return apiClient.post(BASE, data);
}

export async function updateReportGroup(
  reportGroupId: string,
  data: { groupName: string; groupDescription?: string }
): Promise<ReportGroup> {
  return apiClient.put(`${BASE}/${encodeURIComponent(reportGroupId)}`, data);
}

export async function deleteReportGroup(reportGroupId: string): Promise<void> {
  return apiClient.delete(`${BASE}/${encodeURIComponent(reportGroupId)}`);
}

export async function getReportGroupReports(reportGroupId: string): Promise<string[]> {
  const res = await apiClient.get<{ dashboardUuids: string[] }>(
    `${BASE}/${encodeURIComponent(reportGroupId)}/reports`
  );
  return res.dashboardUuids ?? [];
}

export async function setReportGroupReports(
  reportGroupId: string,
  dashboardUuids: string[]
): Promise<void> {
  return apiClient.put(`${BASE}/${encodeURIComponent(reportGroupId)}/reports`, {
    dashboardUuids,
  });
}

export async function getUserReportGroups(email: string): Promise<string[]> {
  const res = await apiClient.get<{ reportGroupIds: string[] }>(
    `${USERS_BASE}/${encodeURIComponent(email)}/report-groups`
  );
  return res.reportGroupIds ?? [];
}

export async function setUserReportGroups(email: string, reportGroupIds: string[]): Promise<void> {
  return apiClient.put(`${USERS_BASE}/${encodeURIComponent(email)}/report-groups`, {
    reportGroupIds,
  });
}
