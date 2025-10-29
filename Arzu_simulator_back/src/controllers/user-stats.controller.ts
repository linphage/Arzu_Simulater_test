import { Response, NextFunction } from 'express';
import { UserStatsService } from '../services/user-stats.service';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/error.utils';
import { AuthRequest } from './auth.controller';

export class UserStatsController {
  private userStatsService: UserStatsService;

  constructor() {
    this.userStatsService = new UserStatsService();
  }

  getUserStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;

    logger.info('收到获取用户统计请求', { userId });

    const stats = await this.userStatsService.getUserStats(userId);

    logger.info('用户统计数据获取成功', { userId });

    res.status(200).json({
      success: true,
      message: '获取用户统计数据成功',
      data: stats
    });
  });
}

export default UserStatsController;
