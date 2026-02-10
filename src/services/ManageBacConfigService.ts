/**
 * ManageBac Configuration Service
 * Handles API calls for managing ManageBac API tokens per school
 */

import { apiClient } from './apiClient';

export interface ManageBacSchoolConfig {
  id?: number;
  country: string;
  school_name: string;
  api_token: string;
  base_url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  notes?: string;
}

export interface ManageBacConfigsResponse {
  success: boolean;
  count: number;
  configs: ManageBacSchoolConfig[];
}

export interface ManageBacConfigResponse {
  success: boolean;
  config: ManageBacSchoolConfig;
  message?: string;
}

class ManageBacConfigService {
  /**
   * Get all ManageBac school configurations
   */
  async getConfigs(): Promise<ManageBacSchoolConfig[]> {
    const response = await apiClient.get<ManageBacConfigsResponse>('/api/managebac-config');
    return response.configs;
  }

  /**
   * Get a specific configuration by ID
   */
  async getConfig(id: number): Promise<ManageBacSchoolConfig> {
    const response = await apiClient.get<ManageBacConfigResponse>(`/api/managebac-config/${id}`);
    return response.config;
  }

  /**
   * Create a new configuration
   */
  async createConfig(config: Omit<ManageBacSchoolConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ManageBacSchoolConfig> {
    const response = await apiClient.post<ManageBacConfigResponse>('/api/managebac-config', config);
    return response.config;
  }

  /**
   * Update an existing configuration
   */
  async updateConfig(
    id: number,
    config: Partial<Omit<ManageBacSchoolConfig, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ManageBacSchoolConfig> {
    const response = await apiClient.put<ManageBacConfigResponse>(`/api/managebac-config/${id}`, config);
    return response.config;
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(id: number): Promise<void> {
    await apiClient.delete<{ success: boolean; message: string }>(`/api/managebac-config/${id}`);
  }
}

export const manageBacConfigService = new ManageBacConfigService();
