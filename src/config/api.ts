/**
 * API Configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  SCHOOLS: `${API_BASE_URL}/api/schools`,
  STUDENTS: `${API_BASE_URL}/api/students`,
  TERM_GRADES: `${API_BASE_URL}/api/term-grades`,
  ANALYTICS: {
    METRICS: `${API_BASE_URL}/api/analytics/metrics`,
    SUBJECT_PERFORMANCE: `${API_BASE_URL}/api/analytics/subject-performance`,
    STUDENT_VS_CLASS_AVERAGE: `${API_BASE_URL}/api/analytics/student-vs-class-average`
  },
  EF: {
    FILE_TYPES: `${API_BASE_URL}/api/ef/file-types`,
    UPLOAD: `${API_BASE_URL}/api/ef/upload`,
    UPLOADS: `${API_BASE_URL}/api/ef/uploads`
  },
  SUPERSET: {
    DASHBOARDS: `${API_BASE_URL}/api/superset/dashboards`,
    GUEST_TOKEN: `${API_BASE_URL}/api/superset/guest-token`
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    SET_PASSWORD: `${API_BASE_URL}/api/auth/set-password`
  },
  USERS: {
    BASE: `${API_BASE_URL}/api/users`,
    ME: {
      SCHOOLS: `${API_BASE_URL}/api/users/me/schools`,
      ACCESS: `${API_BASE_URL}/api/users/me/access`,
      DEPARTMENTS: `${API_BASE_URL}/api/users/me/departments`
    }
  },
  DEPARTMENTS: `${API_BASE_URL}/api/departments`,
  NODES: `${API_BASE_URL}/api/nodes`
} as const;

export default API_ENDPOINTS;

