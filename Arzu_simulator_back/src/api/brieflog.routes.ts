import { Router } from 'express';
import { BriefLogController } from '../controllers/brieflog.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const briefLogController = new BriefLogController();

router.post(
  '/',
  authenticateToken,
  rateLimiter('create-brieflog', 50, 60 * 1000),
  briefLogController.createBriefLog
);

router.get(
  '/task/:taskId',
  authenticateToken,
  rateLimiter('get-brieflogs', 100, 60 * 1000),
  briefLogController.getBriefLogsByTaskId
);

router.get(
  '/user',
  authenticateToken,
  rateLimiter('get-user-brieflogs', 100, 60 * 1000),
  briefLogController.getBriefLogsByUserId
);

export default router;
