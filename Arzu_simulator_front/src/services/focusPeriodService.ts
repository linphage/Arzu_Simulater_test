import axiosInstance from '../utils/axiosInstance';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface FocusPeriod {
  period_id: number;
  session_id: number;
  start_time: string;
  end_time: string | null;
  duration_min: number | null;
  is_interrupted: boolean | null;
  created_at: string;
}

export interface StartFocusPeriodRequest {
  start_time?: string;
}

export interface EndFocusPeriodRequest {
  end_time?: string;
  is_interrupted: boolean;
}

class FocusPeriodService {
  private getConfig() {
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  async startPeriod(sessionId: number, data?: StartFocusPeriodRequest): Promise<{
    period_id: number;
    session_id: number;
    start_time: string;
  }> {
    try {
      const response = await axiosInstance.post(
        `/api/v1/tasks/pomodoro/${sessionId}/periods/start`,
        data || {},
        this.getConfig()
      );
      return response.data.data;
    } catch (error: any) {
      console.error('开始细分时间段失败:', error);
      throw new Error(error.response?.data?.message || '开始细分时间段失败');
    }
  }

  async endPeriod(
    sessionId: number, 
    periodId: number, 
    data: EndFocusPeriodRequest
  ): Promise<void> {
    try {
      await axiosInstance.post(
        `/api/v1/tasks/pomodoro/${sessionId}/periods/${periodId}/end`,
        data,
        this.getConfig()
      );
    } catch (error: any) {
      console.error('结束细分时间段失败:', error);
      throw new Error(error.response?.data?.message || '结束细分时间段失败');
    }
  }

  async getSessionPeriods(sessionId: number): Promise<FocusPeriod[]> {
    try {
      const response = await axiosInstance.get(
        `/api/v1/tasks/pomodoro/${sessionId}/periods`,
        this.getConfig()
      );
      return response.data.data.periods;
    } catch (error: any) {
      console.error('获取会话细分时间段失败:', error);
      throw new Error(error.response?.data?.message || '获取会话细分时间段失败');
    }
  }

  async getActivePeriod(sessionId: number): Promise<FocusPeriod | null> {
    try {
      const response = await axiosInstance.get(
        `/api/v1/tasks/pomodoro/${sessionId}/periods/active`,
        this.getConfig()
      );
      return response.data.data.active_period;
    } catch (error: any) {
      console.error('获取活跃细分时间段失败:', error);
      throw new Error(error.response?.data?.message || '获取活跃细分时间段失败');
    }
  }

  async getSessionPeriodStats(sessionId: number): Promise<{
    totalPeriods: number;
    interruptedPeriods: number;
    totalFocusMinutes: number;
    averagePeriodMinutes: number;
  }> {
    try {
      const response = await axiosInstance.get(
        `/api/v1/tasks/pomodoro/${sessionId}/periods/stats`,
        this.getConfig()
      );
      return response.data.data;
    } catch (error: any) {
      console.error('获取会话细分时间段统计失败:', error);
      throw new Error(error.response?.data?.message || '获取会话细分时间段统计失败');
    }
  }
}

export const focusPeriodService = new FocusPeriodService();
