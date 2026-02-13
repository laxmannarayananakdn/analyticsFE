/**
 * Superset Dashboard Configuration Service
 * Handles API calls for managing configurable Superset dashboards
 */

import { apiClient } from './apiClient';
import API_ENDPOINTS from '../config/api';

export const DASHBOARD_FOLDERS = ['Education', 'Finance', 'HR', 'Operations'] as const;
export type DashboardFolder = (typeof DASHBOARD_FOLDERS)[number];

export interface SupersetDashboardConfig {
  id?: number;
  uuid: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  folder?: DashboardFolder | string;
}

const BASE = API_ENDPOINTS.SUPERSET.DASHBOARD_CONFIG;

export async function getDashboards(activeOnly = true): Promise<SupersetDashboardConfig[]> {
  const url = activeOnly ? `${BASE}?active=true` : `${BASE}?active=false`;
  const res = await apiClient.get<{ success: boolean; dashboards: SupersetDashboardConfig[] }>(url);
  return res.dashboards || [];
}

export async function getDashboard(id: number): Promise<SupersetDashboardConfig> {
  const res = await apiClient.get<{ success: boolean; dashboard: SupersetDashboardConfig }>(`${BASE}/${id}`);
  return res.dashboard;
}

export async function createDashboard(config: Omit<SupersetDashboardConfig, 'id'>): Promise<SupersetDashboardConfig> {
  const res = await apiClient.post<{ success: boolean; dashboard: SupersetDashboardConfig }>(BASE, config);
  return res.dashboard;
}

export async function updateDashboard(id: number, config: Partial<SupersetDashboardConfig>): Promise<SupersetDashboardConfig> {
  const res = await apiClient.put<{ success: boolean; dashboard: SupersetDashboardConfig }>(`${BASE}/${id}`, config);
  return res.dashboard;
}

export async function deleteDashboard(id: number): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`${BASE}/${id}`);
}
