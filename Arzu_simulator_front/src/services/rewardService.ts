import axiosInstance from '../utils/axiosInstance';

export interface GiftCard {
  gift_id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface TriggerRewardRequest {
  triggerTimeMinutes: number;
}

export interface RewardResponse {
  success: boolean;
  message: string;
  data: GiftCard;
}

export interface GiftCardListResponse {
  success: boolean;
  message: string;
  data: GiftCard[];
}

export const rewardService = {
  async triggerReward(triggerTimeMinutes: number): Promise<RewardResponse> {
    console.log('🎁 触发奖励卡:', { triggerTimeMinutes });
    
    const requestBody: TriggerRewardRequest = {
      triggerTimeMinutes
    };
    
    const response = await axiosInstance.post('/api/v1/rewards/trigger', requestBody);
    const result = response.data;
    console.log('✅ 奖励卡触发成功:', result);
    return result;
  },

  async getAllGiftCards(): Promise<GiftCardListResponse> {
    console.log('📥 获取所有礼品卡...');
    
    const response = await axiosInstance.get('/api/v1/rewards');
    const result = response.data;
    console.log('✅ 礼品卡列表获取成功:', result);
    return result;
  }
};
