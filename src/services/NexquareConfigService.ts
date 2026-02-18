/**
 * Nexquare Configuration Service
 * Handles API calls for managing Nexquare school configurations
 */

import { apiClient } from './apiClient';

export interface Curriculum {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
}

export interface NexquareSchoolConfig {
  id?: number;
  country: string;
  school_name: string;
  school_id?: string | null;
  client_id: string;
  client_secret: string;
  domain_url: string;
  curriculum_id?: number | null;
  curriculum_code?: string;
  curriculum_description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  notes?: string;
}

export interface NexquareConfigsResponse {
  success: boolean;
  count: number;
  configs: NexquareSchoolConfig[];
}

export interface NexquareConfigResponse {
  success: boolean;
  config: NexquareSchoolConfig;
  message?: string;
}

export interface DomainUrlResponse {
  success: boolean;
  domain_url: string;
}

class NexquareConfigService {
  /**
   * Get all Nexquare school configurations
   */
  async getConfigs(): Promise<NexquareSchoolConfig[]> {
    const response = await apiClient.get<NexquareConfigsResponse>('/api/nexquare-config');
    return response.configs;
  }

  /**
   * Get a specific configuration by ID
   */
  async getConfig(id: number): Promise<NexquareSchoolConfig> {
    const response = await apiClient.get<NexquareConfigResponse>(`/api/nexquare-config/${id}`);
    return response.config;
  }

  /**
   * Create a new configuration
   */
  async createConfig(config: Omit<NexquareSchoolConfig, 'id' | 'created_at' | 'updated_at'>): Promise<NexquareSchoolConfig> {
    const response = await apiClient.post<NexquareConfigResponse>('/api/nexquare-config', config);
    return response.config;
  }

  /**
   * Update an existing configuration
   */
  async updateConfig(
    id: number,
    config: Partial<Omit<NexquareSchoolConfig, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<NexquareSchoolConfig> {
    const response = await apiClient.put<NexquareConfigResponse>(`/api/nexquare-config/${id}`, config);
    return response.config;
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(id: number): Promise<void> {
    await apiClient.delete<{ success: boolean; message: string }>(`/api/nexquare-config/${id}`);
  }

  /**
   * Get the shared domain URL
   */
  async getDomainUrl(): Promise<string> {
    const response = await apiClient.get<DomainUrlResponse>('/api/nexquare-config/domain-url');
    return response.domain_url;
  }

  /**
   * Get all available curricula
   */
  async getCurricula(): Promise<Curriculum[]> {
    const response = await apiClient.get<{ success: boolean; curricula: Curriculum[] }>('/api/nexquare-config/curricula');
    return response.curricula;
  }
}

export const nexquareConfigService = new NexquareConfigService();
