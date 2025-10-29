import axiosInstance from '../utils/axiosInstance';

export interface CheckInData {
  date: string;
  hasCheckIn: boolean;
}

export interface CalendarCheckInsResponse {
  success: boolean;
  message: string;
  data: {
    checkIns: CheckInData[];
    remainingMakeUps: number;
  };
}

export interface MakeUpCheckInRequest {
  checkInDate: string;
}

export interface MakeUpCheckInResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    title: string;
    completed_at: string;
  };
}

export interface TaskStat {
  date: string;
  time: string;
  totalTasks: number;
  勤政Tasks: number;
  恕己Tasks: number;
  爱人Tasks: number;
}

export interface RecentTaskStatsResponse {
  success: boolean;
  message: string;
  data: TaskStat[];
}

export const calendarService = {
  async getCalendarCheckIns(year: number, month: number): Promise<CalendarCheckInsResponse> {
    try {
      const response = await axiosInstance.get('/api/v1/tasks/calendar/checkins', {
        params: { year, month }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取打卡日历失败:', error);
      throw error;
    }
  },

  async createMakeUpCheckIn(checkInDate: string): Promise<MakeUpCheckInResponse> {
    try {
      const response = await axiosInstance.post('/api/v1/tasks/calendar/makeup', {
        checkInDate
      });
      return response.data;
    } catch (error: any) {
      console.error('补打卡失败:', error);
      throw error;
    }
  },

  async getRecentTaskStats(days: number = 7): Promise<RecentTaskStatsResponse> {
    try {
      const response = await axiosInstance.get('/api/v1/tasks/calendar/recent-stats', {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取近期任务统计失败:', error);
      throw error;
    }
  }
};
