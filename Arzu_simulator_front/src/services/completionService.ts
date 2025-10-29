import axiosInstance from '../utils/axiosInstance';

export interface WeeklyStats {
  completionRate: number;
  overdueRate: number;
  totalTasks: number;
}

export interface TrendDataPoint {
  week: string;
  completionRate: number;
  overdueRate: number;
}

export interface CompletionStatsResponse {
  success: boolean;
  message: string;
  data: {
    weeklyStats: WeeklyStats;
    trendData: TrendDataPoint[];
  };
}

export const completionService = {
  async getCompletionStats(): Promise<CompletionStatsResponse> {
    try {
      const response = await axiosInstance.get('/api/v1/tasks/completion/stats');
      return response.data;
    } catch (error: any) {
      console.error('获取完成度统计数据失败:', error);
      throw error;
    }
  }
};
