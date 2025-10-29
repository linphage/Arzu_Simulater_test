import { Response, NextFunction } from 'express';
import { RewardService } from '../services/reward.service';
import { ValidationError } from '../utils/error.utils';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/error.utils';
import { AuthRequest } from './auth.controller';

export class RewardController {
  private rewardService: RewardService;

  constructor() {
    this.rewardService = new RewardService();
  }

  triggerReward = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const { triggerTimeMinutes } = req.body;

    if (!triggerTimeMinutes || triggerTimeMinutes <= 0) {
      throw new ValidationError('触发时间必须大于0');
    }

    logger.info('收到触发奖励请求', { userId, triggerTimeMinutes });

    const reward = await this.rewardService.triggerReward(userId, triggerTimeMinutes);

    res.status(201).json({
      success: true,
      message: '奖励触发成功',
      data: reward
    });
  });

  getAllGiftCards = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到获取所有礼品卡请求');

    const cards = await this.rewardService.getAllGiftCards();

    res.status(200).json({
      success: true,
      message: '获取礼品卡列表成功',
      data: cards
    });
  });
}

export default RewardController;
