import { RewardRepository, GiftCard } from '../repositories/reward.repository';
import { logger } from '../config/logger';
import { ApiError } from '../utils/error.utils';

export class RewardService {
  private rewardRepository: RewardRepository;

  constructor() {
    this.rewardRepository = new RewardRepository();
  }

  async triggerReward(userId: number, triggerTimeMinutes: number): Promise<GiftCard> {
    try {
      logger.info('触发奖励', { userId, triggerTimeMinutes });

      const giftCard = await this.rewardRepository.getRandomGiftCard();
      if (!giftCard) {
        throw new ApiError('没有可用的礼品卡', 404);
      }

      logger.info('奖励触发成功', { userId, giftTitle: giftCard.title });
      return giftCard;
    } catch (error) {
      logger.error('触发奖励失败', { userId, error: (error as Error).message });
      throw error instanceof ApiError ? error : new ApiError('触发奖励失败', 500);
    }
  }

  async getAllGiftCards(): Promise<GiftCard[]> {
    try {
      logger.info('获取所有礼品卡列表');
      const cards = await this.rewardRepository.getAllGiftCards();
      return cards;
    } catch (error) {
      logger.error('获取礼品卡列表失败', { error: (error as Error).message });
      throw error instanceof ApiError ? error : new ApiError('获取礼品卡列表失败', 500);
    }
  }
}

export default RewardService;
