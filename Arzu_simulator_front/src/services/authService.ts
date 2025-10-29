import axiosInstance from '../utils/axiosInstance';

export interface RegisterRequest {
  username: string;
  mail: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface EmailLoginRequest {
  mail: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    username: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

export const authService = {
  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post('/api/v1/auth/register', credentials);
    return response.data;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post('/api/v1/auth/login', credentials);
    return response.data;
  },

  async loginByEmail(credentials: EmailLoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post('/api/v1/auth/login/email', credentials);
    const result = response.data;
    
    return {
      success: result.success,
      message: result.message,
      data: {
        userId: result.data.userId || 0,
        username: result.data.username || '',
        email: result.data.email || credentials.mail,
        accessToken: result.data.token,
        refreshToken: result.data.refreshToken
      }
    };
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await axiosInstance.post('/api/v1/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    }
  }
};
