import { Router } from 'express';
import { UserStatsController } from '../controllers/user-stats.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const userStatsController = new UserStatsController();

router.get('/stats', authenticateToken, userStatsController.getUserStats);

export default router;
