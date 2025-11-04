// 自动检测环境并使用相应的API URL
const getBaseURL = () => {
  // 如果有环境变量，优先使用
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 在生产环境中，使用当前域名
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // 开发环境默认使用本地后端
  return 'http://localhost:3002';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
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
