import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { 
  registerValidation, 
  loginValidation, 
  emailLoginValidation,
  validateRequest 
} from '../utils/validators';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const authController = new AuthController();

/**
 * 公开路由 - 不需要认证
 */

// 用户注册
router.post(
  '/register',
  rateLimiter('register', 5, 15 * 60 * 1000), // 15分钟内最多5次
  registerValidation,
  validateRequest,
  authController.register
);

// 用户登录
router.post(
  '/login',
  rateLimiter('login', 5, 15 * 60 * 1000), // 15分钟内最多5次
  loginValidation,
  validateRequest,
  authController.login
);

// 邮箱登录 - 适配loginplan.md规范
router.post(
  '/login/email',
  rateLimiter('email-login', 5, 15 * 60 * 1000), // 15分钟内最多5次
  emailLoginValidation,
  validateRequest,
  authController.loginByEmail
);

// 刷新访问令牌
router.post(
  '/refresh',
  rateLimiter('refresh', 10, 60 * 1000), // 1分钟内最多10次
  authController.refreshToken
);

/**
 * 受保护路由 - 需要认证
 */

// 用户登出
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

// 获取用户信息
router.get(
  '/profile',
  authenticateToken,
  authController.getProfile
);

// 获取认证统计信息（管理员功能）
router.get(
  '/stats',
  authenticateToken,
  authController.getAuthStats
);

// 清理过期令牌（管理员功能）
router.delete(
  '/cleanup-tokens',
  authenticateToken,
  authController.cleanupTokens
);

export default router;