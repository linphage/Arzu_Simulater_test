import axiosInstance from '../utils/axiosInstance';

export interface CreateBriefLogRequest {
  session_id?: number;
  task_id: number;
  brief_type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  brief_content: string;
}

export interface BriefLog {
  debrief_id: number;
  session_id: number | null;
  task_id: number;
  user_id: number;
  brief_type: number;
  brief_content: string;
  created_at: string;
}

export interface BriefLogResponse {
  success: boolean;
  message: string;
  data: BriefLog;
}

export const brieflogService = {
  async createBriefLog(data: CreateBriefLogRequest): Promise<BriefLogResponse> {
    try {
      const response = await axiosInstance.post('/api/v1/brieflogs', data);
      return response.data;
    } catch (error: any) {
      console.error('创建brieflog失败:', error);
      throw error;
    }
  },

  async getBriefLogsByTaskId(taskId: number): Promise<{ success: boolean; message: string; data: BriefLog[] }> {
    try {
      const response = await axiosInstance.get(`/api/v1/brieflogs/task/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error('获取任务brieflog失败:', error);
      throw error;
    }
  },

  async getBriefLogsByUserId(limit: number = 50): Promise<{ success: boolean; message: string; data: BriefLog[] }> {
    try {
      const response = await axiosInstance.get(`/api/v1/brieflogs/user?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('获取用户brieflog失败:', error);
      throw error;
    }
  }
};
