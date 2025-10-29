/**
 * 前端集成配置
 * 提供前端应用与后端API集成的配置和工具函数
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  timestamp: string;
  stack?: string;
}

// API配置
export const apiConfig: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30秒
  retryAttempts: 3,
  retryDelay: 1000 // 1秒
};

// 认证相关的常量
export const AUTH_CONSTANTS = {
  TOKEN_KEY: 'arzu_access_token',
  REFRESH_TOKEN_KEY: 'arzu_refresh_token',
  USER_INFO_KEY: 'arzu_user_info',
  TOKEN_EXPIRY_MARGIN: 5 * 60 * 1000 // 5分钟提前刷新
};

// API端点定义
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout'
  },
  // 任务管理
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: number) => `/tasks/${id}`,
    STATS: '/tasks/stats',
    ANALYTICS: '/tasks/analytics',
    SEARCH: '/tasks/search',
    UPCOMING: '/tasks/upcoming',
    OVERDUE: '/tasks/overdue',
    ARCHIVE: '/tasks/archive',
    BATCH: '/tasks/batch',
    // 番茄钟
    POMODORO: {
      BASE: '/tasks/pomodoro',
      COMPLETE: (sessionId: number) => `/tasks/pomodoro/${sessionId}/complete`,
      ACTIVE: '/tasks/pomodoro/active',
      STATS: '/tasks/pomodoro/stats'
    }
  }
};

// 状态码映射
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// 错误消息映射
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络连接',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  AUTH_ERROR: '认证失败，请重新登录',
  VALIDATION_ERROR: '输入数据验证失败',
  NOT_FOUND_ERROR: '请求的资源不存在',
  CONFLICT_ERROR: '数据冲突，请检查输入',
  RATE_LIMIT_ERROR: '请求过于频繁，请稍后重试'
};

// 成功消息映射
export const SUCCESS_MESSAGES = {
  TASK_CREATED: '任务创建成功',
  TASK_UPDATED: '任务更新成功',
  TASK_DELETED: '任务删除成功',
  TASK_COMPLETED: '任务完成成功',
  POMODORO_STARTED: '番茄钟会话开始成功',
  POMODORO_COMPLETED: '番茄钟会话完成成功',
  LOGIN_SUCCESS: '登录成功',
  REGISTER_SUCCESS: '注册成功',
  LOGOUT_SUCCESS: '登出成功'
};

// 任务分类和优先级配置
export const TASK_CONFIG = {
  CATEGORIES: [
    { value: '勤政', label: '勤政', color: '#1890ff', description: '勤奋治理，努力工作' },
    { value: '恕己', label: '恕己', color: '#52c41a', description: '宽恕自己，善待自己' },
    { value: '爱人', label: '爱人', color: '#faad14', description: '关爱他人，服务社会' }
  ],
  PRIORITIES: [
    { value: '金', label: '金级', color: '#ffd700', level: 1, description: '最高优先级' },
    { value: '银', label: '银级', color: '#c0c0c0', level: 2, description: '高优先级' },
    { value: '铜', label: '铜级', color: '#cd7f32', level: 3, description: '中等优先级' },
    { value: '石', label: '石级', color: '#8b7355', level: 4, description: '低优先级' }
  ]
};

// 番茄钟配置
export const POMODORO_CONFIG = {
  DEFAULT_DURATION: 25, // 分钟
  SHORT_BREAK: 5, // 分钟
  LONG_BREAK: 15, // 分钟
  SESSIONS_BEFORE_LONG_BREAK: 4,
  MIN_DURATION: 1,
  MAX_DURATION: 120
};

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// 本地存储键名
export const STORAGE_KEYS = {
  TASKS_VIEW_TYPE: 'arzu_tasks_view_type', // list | grid
  TASKS_SORT_BY: 'arzu_tasks_sort_by',
  TASKS_SORT_ORDER: 'arzu_tasks_sort_order',
  POMODORO_SETTINGS: 'arzu_pomodoro_settings',
  THEME_PREFERENCE: 'arzu_theme_preference', // light | dark | auto
  LANGUAGE_PREFERENCE: 'arzu_language_preference'
};

// API响应格式工具函数
export const formatApiResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  errors?: any[]
) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  data,
  errors
});

// 错误处理工具函数
export const handleApiError = (error: any): ErrorResponse => {
  let message = ERROR_MESSAGES.SERVER_ERROR;
  let statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

  if (error.response) {
    // 服务器返回的错误响应
    statusCode = error.response.status;
    message = error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR;
  } else if (error.request) {
    // 请求发出但没有收到响应
    message = ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.message) {
    // 其他错误
    message = error.message;
  }

  return {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

// 重试逻辑工具函数
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  attempts: number = apiConfig.retryAttempts,
  delay: number = apiConfig.retryDelay
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

// 日期格式化工具函数
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

// 任务状态工具函数
export const getTaskStatus = (task: any): string => {
  if (task.completed) return 'completed';
  if (task.due_date && new Date(task.due_date) < new Date()) return 'overdue';
  return 'pending';
};

// 优先级排序工具函数
export const sortByPriority = (tasks: any[]): any[] => {
  const priorityOrder = { '金': 1, '银': 2, '铜': 3, '石': 4 };
  return tasks.sort((a, b) => {
    const priorityA = priorityOrder[a.priority] || 999;
    const priorityB = priorityOrder[b.priority] || 999;
    return priorityA - priorityB;
  });
};