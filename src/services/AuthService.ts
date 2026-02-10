/**
 * Authentication Service
 * Handles authentication, user management, and access control
 */

import { apiClient } from './apiClient';

export interface User {
  email: string;
  displayName: string | null;
  authType: 'AppRegistration' | 'Password';
  isActive: boolean;
  isTemporaryPassword?: boolean;
  createdDate?: string;
  lastLogin?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Department {
  departmentId: string;
  departmentName: string;
  departmentDescription?: string;
  schemaName?: string;
  displayOrder?: number;
}

export interface Node {
  nodeId: string;
  nodeDescription: string;
  isHeadOffice: boolean;
  isSchoolNode?: boolean;
  parentNodeId?: string | null;
  children?: Node[];
}

export interface UserAccess {
  userId: string;
  nodeId: string;
  departmentId: string;
}

export interface SchoolAccess {
  schoolId: string;
  schoolSource: 'nex' | 'mb';
  departments: string[];
}

class AuthService {
  private tokenKey = 'auth_token';

  /**
   * Store JWT token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Remove token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Get current user's schools
   */
  async getMySchools(): Promise<SchoolAccess[]> {
    return apiClient.get<SchoolAccess[]>('/api/users/me/schools');
  }

  /**
   * Get current user's access
   */
  async getMyAccess(): Promise<UserAccess[]> {
    return apiClient.get<UserAccess[]>('/api/users/me/access');
  }

  /**
   * Get current user's departments
   */
  async getMyDepartments(): Promise<{ departments: string[] }> {
    return apiClient.get<{ departments: string[] }>('/api/users/me/departments');
  }

  // Admin functions

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/api/users');
  }

  /**
   * Get user by email (admin only)
   */
  async getUser(email: string): Promise<User> {
    return apiClient.get<User>(`/api/users/${encodeURIComponent(email)}`);
  }

  /**
   * Create user (admin only)
   */
  async createUser(data: {
    email: string;
    displayName?: string;
    authType: 'AppRegistration' | 'Password';
    password?: string;
  }): Promise<{ user: User; temporaryPassword?: string }> {
    return apiClient.post<{ user: User; temporaryPassword?: string }>('/api/users', data);
  }

  /**
   * Update user (admin only)
   */
  async updateUser(email: string, data: { displayName?: string; isActive?: boolean }): Promise<User> {
    return apiClient.put<User>(`/api/users/${encodeURIComponent(email)}`, data);
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(email: string): Promise<User> {
    return apiClient.patch<User>(`/api/users/${encodeURIComponent(email)}/deactivate`, {});
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(email: string): Promise<{ temporaryPassword: string }> {
    return apiClient.post<{ temporaryPassword: string }>(`/api/users/${encodeURIComponent(email)}/reset-password`, {});
  }

  /**
   * Get all departments (admin only)
   */
  async getDepartments(): Promise<Department[]> {
    return apiClient.get<Department[]>('/api/departments');
  }

  /**
   * Create department (admin only)
   */
  async createDepartment(data: {
    departmentId: string;
    departmentName: string;
    departmentDescription?: string;
    schemaName?: string;
    displayOrder?: number;
  }): Promise<Department> {
    return apiClient.post<Department>('/api/departments', data);
  }

  /**
   * Get all nodes (admin only)
   */
  async getNodes(tree?: boolean): Promise<Node[]> {
    const params = tree ? { tree: 'true' } : undefined;
    return apiClient.get<Node[]>('/api/nodes', params);
  }

  /**
   * Create node (admin only)
   */
  async createNode(data: {
    nodeId: string;
    nodeDescription: string;
    isHeadOffice?: boolean;
    isSchoolNode?: boolean;
    parentNodeId?: string | null;
  }): Promise<Node> {
    return apiClient.post<Node>('/api/nodes', data);
  }

  /**
   * Update node (admin only)
   */
  async updateNode(nodeId: string, data: {
    nodeDescription?: string;
    isHeadOffice?: boolean;
    isSchoolNode?: boolean;
    parentNodeId?: string | null;
  }): Promise<Node> {
    return apiClient.put<Node>(`/api/nodes/${nodeId}`, data);
  }

  /**
   * Assign school to node (admin only)
   */
  async assignSchoolToNode(nodeId: string, schoolId: string, schoolSource: 'nex' | 'mb'): Promise<void> {
    await apiClient.post(`/api/nodes/${nodeId}/schools`, {
      schoolId,
      schoolSource,
    });
  }

  /**
   * Get schools in node (admin only)
   */
  async getSchoolsInNode(nodeId: string): Promise<Array<{ schoolId: string; nodeId: string; schoolSource: string }>> {
    return apiClient.get(`/api/nodes/${nodeId}/schools`);
  }

  /**
   * Unassign school from node (admin only)
   */
  async unassignSchoolFromNode(nodeId: string, schoolId: string, schoolSource: 'nex' | 'mb'): Promise<void> {
    await apiClient.delete(`/api/nodes/${nodeId}/schools/${schoolId}/${schoolSource}`);
  }

  /**
   * Grant user access (admin only)
   */
  async grantAccess(email: string, nodeId: string, departmentIds: string[]): Promise<UserAccess[]> {
    return apiClient.post<UserAccess[]>(`/api/users/${encodeURIComponent(email)}/access`, {
      nodeId,
      departmentIds,
    });
  }

  /**
   * Get user access (admin only)
   */
  async getUserAccess(email: string): Promise<UserAccess[]> {
    return apiClient.get<UserAccess[]>(`/api/users/${encodeURIComponent(email)}/access`);
  }

  /**
   * Revoke all access to a node (admin only)
   */
  async revokeNodeAccess(email: string, nodeId: string): Promise<void> {
    await apiClient.delete(`/api/users/${encodeURIComponent(email)}/access/${nodeId}`);
  }
}

export const authService = new AuthService();
