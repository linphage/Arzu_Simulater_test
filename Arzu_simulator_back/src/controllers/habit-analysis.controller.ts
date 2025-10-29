import { Response, NextFunction } from 'express';
import { HabitAnalysisService } from '../services/habit-analysis.service';
import { ValidationError } from '../utils/error.utils';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/error.utils';
import { AuthRequest } from './auth.controller';

export class HabitAnalysisController {
  private habitAnalysisService: HabitAnalysisService;

  constructor() {
    this.habitAnalysisService = new HabitAnalysisService();
  }

  getHabitStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const timeframe = req.query.timeframe as 'week' | 'month';

    if (!timeframe || !['week', 'month'].includes(timeframe)) {
      throw new ValidationError('timeframe 必须是 week 或 month');
    }

    logger.info('收到获取习惯分析统计请求', { userId, timeframe });

    try {
      const stats = await this.habitAnalysisService.getHabitStats(userId, timeframe);

      logger.info('习惯分析统计数据获取成功', { userId, timeframe });

      res.status(200).json({
        success: true,
        message: '获取习惯分析统计数据成功',
        data: stats
      });
    } catch (error: any) {
      logger.error('获取习惯分析统计数据失败', {
        userId,
        timeframe,
        error: error.message
      });

      throw error;
    }
  });
}
