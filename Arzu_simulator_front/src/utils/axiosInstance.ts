import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

    // 如果是 401 错误且不是 refresh 接口
    if (error.response?.status === 401 && !originalRequest._retry) {
      
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

        console.log('🔄 访问令牌过期，正在刷新...');

        // 调用刷新接口
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

        // 更新本地存储
        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        console.log('✅ 访问令牌刷新成功');

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
      } catch (refreshError) {
        console.error('❌ 刷新访问令牌失败:', refreshError);

        // 清空队列
        failedRequestsQueue.forEach((req) => {
          req.reject(refreshError);
        });
        failedRequestsQueue = [];

        // 清除本地存储
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');

        // 延迟重定向到登录页，给用户一些时间保存数据
        setTimeout(() => {
          console.warn('⚠️ Token刷新失败，即将跳转到登录页...');
          window.location.href = '/';
        }, 1000);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
