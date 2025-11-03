/**
 * API客户端
 * 为前端应用提供完整的API调用封装
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  apiConfig, 
  AUTH_CONSTANTS, 
  API_ENDPOINTS, 
  ERROR_MESSAGES,
  handleApiError,
  retryAsync,
  formatApiResponse
} from './frontend.config';

// 请求配置接口
interface RequestConfig {
  url?: string;
  retry?: boolean;
  showError?: boolean;
  method?: string;
  params?: any;
  headers?: any;
  data?: any;
  timeout?: number;
  _retry?: boolean;
}

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  timestamp: string;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config: any) => {
        // 添加认证令牌
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于调试
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // 处理成功的响应
        if (response.data && typeof response.data === 'object') {
          return {
            ...response,
            data: this.transformResponse(response.data)
          };
        }
        return response;
      },
      async (error: AxiosError) => {
        // 处理错误响应
        const originalRequest = error.config as RequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
          // 处理令牌过期
          originalRequest._retry = true;
          
          try {
            await this.handleTokenRefresh();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuthData();
            this.redirectToLogin();
            return Promise.reject(refreshError);
          }
        }

        // 处理其他错误
        const errorResponse = handleApiError(error);
        if (originalRequest.showError !== false) {
          this.showErrorMessage(errorResponse.message);
        }

        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * 转换API响应格式
   */
  private transformResponse(data: any): any {
    // 如果响应已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }
    
    // 转换为标准格式
    return formatApiResponse(true, '操作成功', data);
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取访问令牌
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.TOKEN_KEY);
  }

  /**
   * 获取刷新令牌
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
  }

  /**
   * 处理令牌刷新
   */
  private async handleTokenRefresh(): Promise<void> {
    if (this.isRefreshing) {
      // 如果正在刷新，加入等待队列
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      this.setAuthData(accessToken, newRefreshToken);
      
      // 处理等待队列
      this.failedQueue.forEach(({ resolve }) => resolve(undefined));
      this.failedQueue = [];
      
    } catch (error) {
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 设置认证数据
   */
  private setAuthData(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_CONSTANTS.TOKEN_KEY, accessToken);
    localStorage.setItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * 清除认证数据
   */
  private clearAuthData(): void {
    localStorage.removeItem(AUTH_CONSTANTS.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONSTANTS.USER_INFO_KEY);
  }

  /**
   * 重定向到登录页面
   */
  private redirectToLogin(): void {
    // 在实际应用中，这里应该重定向到登录页面
    window.location.href = '/login';
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(message: string): void {
    // 在实际应用中，这里应该调用UI组件显示错误消息
    console.error('API Error:', message);
    // 例如：notification.error(message);
  }

  /**
   * 通用的请求方法
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig: RequestConfig = {
      method,
      url,
      data,
      ...config
    };

    try {
      if (config.retry) {
        return await retryAsync(async () => {
          const response = await this.client.request(requestConfig);
          return response.data;
        });
      } else {
        const response = await this.client.request(requestConfig);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  }

  // 认证相关API
  public auth = {
    register: async (userData: { username: string; email: string; password: string }) => {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.REGISTER, userData);
      return response;
    },

    login: async (credentials: { username: string; password: string }) => {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.LOGIN, credentials);
      if (response.success && response.data) {
        this.setAuthData((response.data as any).accessToken, (response.data as any).refreshToken);
      }
      return response;
    },

    refreshToken: async (refreshToken: string) => {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
      if (response.success && response.data) {
        this.setAuthData((response.data as any).accessToken, (response.data as any).refreshToken);
      }
      return response;
    },

    logout: async () => {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.LOGOUT);
      this.clearAuthData();
      return response;
    }
  };

  // 任务管理API
  public tasks = {
    // 基础CRUD操作
    create: async (taskData: any) => {
      return await this.request('POST', API_ENDPOINTS.TASKS.BASE, taskData);
    },

    getAll: async (params?: any) => {
      return await this.request('GET', API_ENDPOINTS.TASKS.BASE, undefined, { params });
    },

    getById: async (id: number) => {
      return await this.request('GET', API_ENDPOINTS.TASKS.BY_ID(id));
    },

    update: async (id: number, updateData: any) => {
      return await this.request('PATCH', API_ENDPOINTS.TASKS.BY_ID(id), updateData);
    },

    delete: async (id: number) => {
      return await this.request('DELETE', API_ENDPOINTS.TASKS.BY_ID(id));
    },

    // 统计和分析
    getStats: async () => {
      return await this.request('GET', API_ENDPOINTS.TASKS.STATS);
    },

    getAnalytics: async (days?: number) => {
      return await this.request('GET', API_ENDPOINTS.TASKS.ANALYTICS, undefined, {
        params: days ? { days } : undefined
      });
    },

    // 搜索和过滤
    search: async (query: string, limit?: number) => {
      return await this.request('GET', API_ENDPOINTS.TASKS.SEARCH, undefined, {
        params: { q: query, limit }
      });
    },

    getUpcoming: async (days?: number) => {
      return await this.request('GET', API_ENDPOINTS.TASKS.UPCOMING, undefined, {
        params: days ? { days } : undefined
      });
    },

    getOverdue: async () => {
      return await this.request('GET', API_ENDPOINTS.TASKS.OVERDUE);
    },

    // 批量操作
    archiveCompleted: async (daysOld?: number) => {
      return await this.request('POST', API_ENDPOINTS.TASKS.ARCHIVE, undefined, {
        params: daysOld ? { daysOld } : undefined
      });
    },

    batchOperate: async (operation: string, taskIds: number[]) => {
      return await this.request('POST', API_ENDPOINTS.TASKS.BATCH, {
        operation,
        taskIds
      });
    },

    // 番茄钟功能
    pomodoro: {
      createSession: async (taskId?: number, durationMinutes: number = 25) => {
        return await this.request('POST', API_ENDPOINTS.TASKS.POMODORO.BASE, {
          taskId,
          durationMinutes
        });
      },

      completeSession: async (sessionId: number) => {
        return await this.request('PATCH', API_ENDPOINTS.TASKS.POMODORO.COMPLETE(sessionId));
      },

      getSessions: async () => {
        return await this.request('GET', API_ENDPOINTS.TASKS.POMODORO.BASE);
      },

      getActiveSession: async () => {
        return await this.request('GET', API_ENDPOINTS.TASKS.POMODORO.ACTIVE);
      },

      getStats: async (days?: number) => {
        return await this.request('GET', API_ENDPOINTS.TASKS.POMODORO.STATS, undefined, {
          params: days ? { days } : undefined
        });
      }
    }
  };

  // 工具方法
  public utils = {
    // 检查是否已认证
    isAuthenticated: (): boolean => {
      return !!this.getAccessToken();
    },

    // 获取用户信息
    getUserInfo: () => {
      const userInfo = localStorage.getItem(AUTH_CONSTANTS.USER_INFO_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    },

    // 设置用户信息
    setUserInfo: (userInfo: any) => {
      localStorage.setItem(AUTH_CONSTANTS.USER_INFO_KEY, JSON.stringify(userInfo));
    },

    // 清除所有本地数据
    clearAllData: () => {
      this.clearAuthData();
      // 清除其他存储的数据
      localStorage.removeItem('arzu_tasks_cache');
      localStorage.removeItem('arzu_pomodoro_cache');
    }
  };
}

// 创建单例实例
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient }; // 也导出类以便需要时可以创建新实例