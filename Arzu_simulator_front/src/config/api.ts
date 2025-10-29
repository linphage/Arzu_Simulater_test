export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  ENDPOINTS: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    PROFILE: '/api/v1/auth/profile',
    TASKS: '/api/v1/tasks',
    TASK_BY_ID: (id: number) => `/api/v1/tasks/${id}`,
    TASK_STATS: '/api/v1/tasks/stats',
    TASK_ANALYTICS: '/api/v1/tasks/analytics'
  }
};
