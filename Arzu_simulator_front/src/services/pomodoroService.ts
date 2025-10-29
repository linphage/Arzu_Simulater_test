import axiosInstance from '../utils/axiosInstance';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface PomodoroSession {
  id: number;
  user_id: number;
  task_id: number | null;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface CreatePomodoroSessionRequest {
  taskId?: number;
  durationMinutes: number;
}

class PomodoroService {
  private getConfig() {
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  async createSession(data: CreatePomodoroSessionRequest): Promise<PomodoroSession> {
    try {
      const response = await axiosInstance.post(
        `/api/v1/tasks/pomodoro`,
        data,
        this.getConfig()
      );
      return response.data.data;
    } catch (error: any) {
      console.error('创建番茄钟会话失败:', error);
      throw new Error(error.response?.data?.message || '创建番茄钟会话失败');
    }
  }

  async completeSession(sessionId: number, data: {
    endedAt?: string;
    isCompleted: boolean;
  }): Promise<void> {
    try {
      await axiosInstance.patch(
        `/api/v1/tasks/pomodoro/${sessionId}/complete`,
        data,
        this.getConfig()
      );
    } catch (error: any) {
      console.error('完成番茄钟会话失败:', error);
      throw new Error(error.response?.data?.message || '完成番茄钟会话失败');
    }
  }

  /**
   * 结束番茄钟会话（支持多种场景）
   * @param sessionId 会话ID
   * @param data 结束数据
   *   - completed: 是否完成任务
   *   - completedAt: 结束时间（可选）
   *   - updateDuration: 是否更新duration_minutes为实际累计时长
   */
  async endSession(sessionId: number, data: {
    completed: boolean;
    completedAt?: string;
    updateDuration?: boolean;
  }): Promise<void> {
    try {
      await axiosInstance.patch(
        `/api/v1/tasks/pomodoro/${sessionId}/end`,
        data,
        this.getConfig()
      );
      console.log('✅ 番茄钟会话结束', { sessionId, ...data });
    } catch (error: any) {
      console.error('❌ 结束番茄钟会话失败:', error);
      throw new Error(error.response?.data?.message || '结束番茄钟会话失败');
    }
  }

  async getSessions(params?: {
    startDate?: string;
    endDate?: string;
    taskId?: number;
  }): Promise<PomodoroSession[]> {
    try {
      const response = await axiosInstance.get(
        `/api/v1/tasks/pomodoro`,
        {
          ...this.getConfig(),
          params
        }
      );
      return response.data.data.sessions;
    } catch (error: any) {
      console.error('获取番茄钟会话列表失败:', error);
      throw new Error(error.response?.data?.message || '获取番茄钟会话列表失败');
    }
  }

  async getActiveSession(): Promise<PomodoroSession | null> {
    try {
      const response = await axiosInstance.get(
        `/api/v1/tasks/pomodoro/active`,
        this.getConfig()
      );
      return response.data.data.session;
    } catch (error: any) {
      console.error('获取活跃番茄钟会话失败:', error);
      throw new Error(error.response?.data?.message || '获取活跃番茄钟会话失败');
    }
  }

  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    averageSessionMinutes: number;
  }> {
    try {
      const response = await axiosInstance.get(
        `/api/v1/tasks/pomodoro/stats`,
        {
          ...this.getConfig(),
          params
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('获取番茄钟统计失败:', error);
      throw new Error(error.response?.data?.message || '获取番茄钟统计失败');
    }
  }
}

export const pomodoroService = new PomodoroService();
