import { getQuery, runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';

export interface GiftCard {
  gift_id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface UserRewardCard {
  id: number;
  user_id: number;
  gift_id: number;
  obtained_at: string;
  trigger_time_minutes: number;
  is_viewed: boolean;
  created_at: string;
  title?: string;
  description?: string;
}

export class RewardRepository {
  async getRandomGiftCard(): Promise<GiftCard | undefined> {
    try {
      const result = await getQuery<GiftCard>(
        'SELECT * FROM gift_card ORDER BY RANDOM() LIMIT 1'
      );
      return result;
    } catch (error: any) {
      logger.error('获取随机礼品卡失败', { error: error.message });
      throw error;
    }
  }

  async createUserRewardCard(
    userId: number,
    giftId: number,
    triggerTimeMinutes: number
  ): Promise<number> {
    try {
      const result = await runQuery(
        `INSERT INTO user_reward_cards (user_id, gift_id, trigger_time_minutes, obtained_at, is_viewed)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)`,
        [userId, giftId, triggerTimeMinutes]
      );

      logger.info('用户奖励卡创建成功', { userId, giftId, rewardId: result.lastID });
      return result.lastID!;
    } catch (error: any) {
      logger.error('创建用户奖励卡失败', { userId, giftId, error: error.message });
      throw error;
    }
  }

  async getUserRewardCards(userId: number): Promise<UserRewardCard[]> {
    try {
      const results = await allQuery<UserRewardCard>(
        `SELECT 
          urc.id,
          urc.user_id,
          urc.gift_id,
          urc.obtained_at,
          urc.trigger_time_minutes,
          urc.is_viewed,
          urc.created_at,
          gc.title,
          gc.description
         FROM user_reward_cards urc
         INNER JOIN gift_card gc ON urc.gift_id = gc.gift_id
         WHERE urc.user_id = ?
         ORDER BY urc.obtained_at DESC`,
        [userId]
      );

      logger.info('获取用户奖励卡列表', { userId, count: results.length });
      return results;
    } catch (error: any) {
      logger.error('获取用户奖励卡失败', { userId, error: error.message });
      throw error;
    }
  }

  async markRewardAsViewed(rewardId: number, userId: number): Promise<void> {
    try {
      await runQuery(
        'UPDATE user_reward_cards SET is_viewed = 1 WHERE id = ? AND user_id = ?',
        [rewardId, userId]
      );

      logger.info('奖励卡标记为已查看', { rewardId, userId });
    } catch (error: any) {
      logger.error('标记奖励卡失败', { rewardId, userId, error: error.message });
      throw error;
    }
  }

  async deleteUserRewardCard(rewardId: number, userId: number): Promise<void> {
    try {
      await runQuery(
        'DELETE FROM user_reward_cards WHERE id = ? AND user_id = ?',
        [rewardId, userId]
      );

      logger.info('删除用户奖励卡', { rewardId, userId });
    } catch (error: any) {
      logger.error('删除用户奖励卡失败', { rewardId, userId, error: error.message });
      throw error;
    }
  }

  async getAllGiftCards(): Promise<GiftCard[]> {
    try {
      const results = await allQuery<GiftCard>('SELECT * FROM gift_card ORDER BY created_at DESC');
      return results;
    } catch (error: any) {
      logger.error('获取所有礼品卡失败', { error: error.message });
      throw error;
    }
  }
}

export default RewardRepository;
