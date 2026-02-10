/**
 * Superset Service
 * Handles Superset API calls and authentication
 */

import { apiClient } from './apiClient';

export interface SupersetDashboard {
  id: number;
  dashboard_title: string;
  slug: string;
  published: boolean;
  changed_on?: string;
  created_on?: string;
}

export interface SupersetGuestTokenResponse {
  token: string;
  expires_in?: number;
}

class SupersetService {
  private baseUrl: string;
  private apiKey?: string;
  private username?: string;
  private password?: string;

  constructor() {
    // Get Superset configuration from environment variables
    this.baseUrl = import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088';
    this.apiKey = import.meta.env.VITE_SUPERSET_API_KEY;
    this.username = import.meta.env.VITE_SUPERSET_USERNAME || 'admin';
    this.password = import.meta.env.VITE_SUPERSET_PASSWORD || 'admin';
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Get CSRF token from Superset
   */
  private async getCsrfToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/security/csrf_token/`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw new Error('Failed to get CSRF token');
    }
  }

  /**
   * Authenticate with Superset and get access token
   */
  async authenticate(): Promise<string> {
    try {
      // First get CSRF token
      const csrfToken = await this.getCsrfToken();

      // Then authenticate
      const response = await fetch(`${this.baseUrl}/api/v1/security/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          provider: 'db',
          refresh: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error authenticating with Superset:', error);
      throw new Error('Failed to authenticate with Superset');
    }
  }

  /**
   * Get guest token for embedded dashboards
   * Uses backend endpoint to generate guest tokens
   */
  async getGuestToken(dashboardId: number, resources?: Array<{ type: string; id: string }>): Promise<string> {
    try {
      // Use backend endpoint to generate guest tokens
      const response = await apiClient.post<SupersetGuestTokenResponse>('/api/superset/guest-token', {
        dashboard_id: dashboardId,
        resources: resources || [{ type: 'dashboard', id: String(dashboardId) }],
      });
      return response.token;
    } catch (error: any) {
      console.error('Error getting guest token from backend:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      throw new Error(`Failed to get guest token from backend: ${errorMessage}. Please check backend server logs for details.`);
    }
  }

  /**
   * Get list of dashboards
   */
  async getDashboards(): Promise<SupersetDashboard[]> {
    try {
      // Option 1: Use backend API if available
      try {
        const dashboards = await apiClient.get<SupersetDashboard[]>('/api/superset/dashboards');
        return dashboards;
      } catch (backendError) {
        // Option 2: Fallback - call Superset directly
        const accessToken = await this.authenticate();
        const response = await fetch(`${this.baseUrl}/api/v1/dashboard/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboards: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result || [];
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      throw new Error('Failed to fetch dashboards');
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(dashboardId: number): Promise<SupersetDashboard> {
    try {
      // Option 1: Use backend API if available
      try {
        const dashboard = await apiClient.get<SupersetDashboard>(`/api/superset/dashboards/${dashboardId}`);
        return dashboard;
      } catch (backendError) {
        // Option 2: Fallback - call Superset directly
        const accessToken = await this.authenticate();
        const response = await fetch(`${this.baseUrl}/api/v1/dashboard/${dashboardId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result;
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw new Error('Failed to fetch dashboard');
    }
  }

  /**
   * Get iframe URL for a dashboard (simpler embedding method)
   */
  getDashboardIframeUrl(dashboardId: number, standalone: boolean = true): string {
    const params = new URLSearchParams({
      standalone: String(standalone),
    });
    return `${this.baseUrl}/superset/dashboard/${dashboardId}/?${params.toString()}`;
  }
}

export const supersetService = new SupersetService();
