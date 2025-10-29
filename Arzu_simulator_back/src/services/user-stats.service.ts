import { allQuery, getQuery } from '../database/connection';
import { logger } from '../config/logger';
import { ApiError } from '../utils/error.utils';
import { UserRepository } from '../repositories/user.repository';

export interface UserStatsData {
  userInfo: {
    userId: number;
    username: string;
    email: string;
  };
  statistics: {
    completedTasksCount: number;
    totalFocusMinutes: number;
  };
}

export class UserStatsService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUserStats(userId: number): Promise<UserStatsData> {
    try {
      logger.info('获取用户统计数据', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new ApiError('用户不存在', 404);
      }

      const completedTasksResult = await getQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM tasks 
         WHERE user_id = ? 
         AND completed = 1 
         AND category IS NOT NULL 
         AND category != ''`,
        [userId]
      );
      const completedTasksCount = completedTasksResult?.count || 0;

      const focusTimeResult = await getQuery<{ total_minutes: number }>(
        `SELECT COALESCE(SUM(fp.duration_min), 0) as total_minutes
         FROM focus_periods fp
         INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
         WHERE ps.user_id = ?`,
        [userId]
      );
      const totalFocusMinutes = focusTimeResult?.total_minutes || 0;

      const stats: UserStatsData = {
        userInfo: {
          userId: user.user_id,
          username: user.username,
          email: user.mail
        },
        statistics: {
          completedTasksCount,
          totalFocusMinutes
        }
      };

      logger.info('用户统计数据获取成功', { userId, stats });
      return stats;
    } catch (error) {
      logger.error('获取用户统计数据失败', { userId, error: (error as Error).message });
      throw error instanceof ApiError ? error : new ApiError('获取用户统计数据失败', 500);
    }
  }
}

export default UserStatsService;
