import { Router } from 'express';
import { RewardController } from '../controllers/reward.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const rewardController = new RewardController();

router.post('/trigger', authenticateToken, rewardController.triggerReward);
router.get('/', authenticateToken, rewardController.getAllGiftCards);

export default router;
