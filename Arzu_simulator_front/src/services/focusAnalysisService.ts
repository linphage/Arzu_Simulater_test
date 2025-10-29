import axiosInstance from '../utils/axiosInstance';

export interface KeyMetrics {
  avgFocusTime: number;
  avgInterruptions: number;
  focusIndex: number;
}

export interface DailyData {
  date: string;
  sessionDuration: number;
  interruptions: number;
  focusIndex: number;
}

export interface FocusStatsResponse {
  success: boolean;
  message: string;
  data: {
    keyMetrics: KeyMetrics;
    dailyData: DailyData[];
  };
}

export const focusAnalysisService = {
  async getFocusStats(timeframe: 'week' | 'month' = 'week'): Promise<FocusStatsResponse> {
    try {
      const response = await axiosInstance.get('/api/v1/tasks/pomodoro/focus-stats', {
        params: { timeframe }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取专注度统计数据失败:', error);
      throw error;
    }
  }
};
