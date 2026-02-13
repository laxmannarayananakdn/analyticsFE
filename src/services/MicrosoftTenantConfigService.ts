/**
 * Microsoft Tenant Config API Service
 */

import { apiClient } from './apiClient';

export interface MicrosoftTenantConfig {
  tenantConfigId: number;
  domain: string;
  authorityTenant: string | null;
  clientId: string;
  clientSecret: string;
  displayName: string | null;
  isActive: boolean;
}

export async function getTenantConfigs(): Promise<MicrosoftTenantConfig[]> {
  return apiClient.get<MicrosoftTenantConfig[]>('/api/microsoft-tenant-config');
}

export async function createTenantConfig(data: {
  domain: string;
  authorityTenant?: string | null;
  clientId: string;
  clientSecret: string;
  displayName?: string | null;
}): Promise<MicrosoftTenantConfig> {
  return apiClient.post<MicrosoftTenantConfig>('/api/microsoft-tenant-config', data);
}

export async function updateTenantConfig(
  id: number,
  data: {
    domain?: string;
    authorityTenant?: string | null;
    clientId?: string;
    clientSecret?: string;
    displayName?: string | null;
    isActive?: boolean;
  }
): Promise<MicrosoftTenantConfig> {
  return apiClient.put<MicrosoftTenantConfig>(`/api/microsoft-tenant-config/${id}`, data);
}

export async function deleteTenantConfig(id: number): Promise<void> {
  return apiClient.delete(`/api/microsoft-tenant-config/${id}`);
}

/**
 * Get tenant config for login (public - no auth)
 * Returns clientId and authority for MSAL - used when user enters email
 */
export async function getTenantConfigForLogin(domain: string): Promise<{
  clientId: string;
  authority: string;
  displayName: string | null;
}> {
  return apiClient.get('/api/auth/tenant-config-by-domain', { domain });
}
