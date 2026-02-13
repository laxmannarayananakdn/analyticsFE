/**
 * Sidebar Access Service
 * RBAC for sidebar visibility
 */

import { apiClient } from './apiClient';
import API_ENDPOINTS from '../config/api';

export interface SidebarItem {
  id: string;
  label: string;
  category: 'main' | 'report' | 'admin';
  folder?: string;
}

export interface SidebarAccessMatrix {
  users: { email: string; displayName: string | null }[];
  items: SidebarItem[];
  permissions: Record<string, string[]>;
}

const BASE = API_ENDPOINTS.SIDEBAR_ACCESS;

export async function getSidebarAccessMatrix(): Promise<SidebarAccessMatrix> {
  const res = await apiClient.get<SidebarAccessMatrix>(BASE);
  return res;
}

export async function setUserSidebarAccess(email: string, itemIds: string[]): Promise<void> {
  await apiClient.put<{ message: string }>(`${BASE}/users/${encodeURIComponent(email)}`, {
    itemIds,
  });
}

export async function getMySidebarAccess(): Promise<string[]> {
  const res = await apiClient.get<{ itemIds: string[] }>(API_ENDPOINTS.USERS.ME.SIDEBAR_ACCESS);
  return (res as { itemIds?: string[] }).itemIds ?? [];
}
