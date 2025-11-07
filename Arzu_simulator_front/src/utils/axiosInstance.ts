import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加 token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：自动处理 token 过期
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 如果是 401 错误且不是 refresh 接口本身
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      
      // 如果正在刷新 token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 [自动刷新] 访问令牌已过期，正在自动刷新...');

        // 使用原生 axios 调用刷新接口（避免循环调用拦截器）
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

        if (!newAccessToken) {
          throw new Error('刷新令牌返回的 accessToken 为空');
        }

        // 更新本地存储
        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
          console.log('🔄 [自动刷新] 同时更新了 refreshToken');
        }

        console.log('✅ [自动刷新] 访问令牌刷新成功，继续原请求');

        // 更新原请求的 token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // 处理队列中的请求
        failedRequestsQueue.forEach((req) => {
          req.resolve(newAccessToken);
        });
        failedRequestsQueue = [];

        // 重新发送原请求
        return axiosInstance(originalRequest);
      } catch (refreshError: any) {
        console.error('❌ [自动刷新] 刷新访问令牌失败:', refreshError.response?.data || refreshError.message);

        // 清空队列
        failedRequestsQueue.forEach((req) => {
          req.reject(refreshError);
        });
        failedRequestsQueue = [];

        // 清除本地存储
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');

        // 触发全局登出事件（让番茄钟等组件有机会保存数据）
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason: 'token_expired' } 
        }));

        // 延迟重定向到登录页，给组件时间保存数据
        console.warn('⚠️ [自动刷新] 刷新令牌也已过期或无效，3秒后将跳转到登录页...');
        setTimeout(() => {
          // 检查是否还在当前页面（避免用户已手动跳转）
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/';
          }
        }, 3000);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
