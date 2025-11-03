import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { ApiError, ValidationError } from '../utils/error.utils';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/error.utils';
import { getErrorMessage } from '../utils/error-handler';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    mail: string;
    email: string;
  };
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 用户注册 - 适配loginplan.md规范
   */
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到用户注册请求', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const { username, mail, password } = req.body;

    try {
      // 调用服务层进行注册
      const result = await this.authService.register(username, mail, password);

      // 记录成功日志
      logger.info('用户注册成功', { 
        userId: result.userId, 
        username, 
        mail,
        ip: req.ip 
      });

      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '用户注册成功',
        data: result
      });

    } catch (error) {
      // 记录失败日志
      logger.error('用户注册失败', { 
        username, 
        mail, 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 用户登录
   */
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到用户登录请求', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const { username, password } = req.body;
    const clientIp = req.ip;

    try {
      // 调用服务层进行登录
      const result = await this.authService.login(username, password, clientIp);

      // 设置安全HTTP头
      res.set({
        'X-RateLimit-Remaining': req.rateLimit?.remaining || 'unknown',
        'X-RateLimit-Reset': req.rateLimit?.resetTime?.toISOString() || 'unknown'
      });

      // 记录成功日志
      logger.info('用户登录成功', { 
        userId: result.user.id, 
        username: result.user.username,
        ip: clientIp 
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '登录成功',
        data: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email
          }
        }
      });

    } catch (error) {
      // 记录失败日志
      logger.error('用户登录失败', { 
        username, 
        ip: clientIp,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 邮箱登录 - 适配loginplan.md规范
   */
  loginByEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到邮箱登录请求', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const { mail, password } = req.body;

    try {
      // 调用服务层进行邮箱登录
      const result = await this.authService.loginByEmail(mail, password);

      logger.info('邮箱登录成功', { 
        mail,
        ip: req.ip 
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '登录成功',
        data: result
      });

    } catch (error) {
      // 记录失败日志
      logger.error('邮箱登录失败', { 
        mail, 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 刷新访问令牌
   */
  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到刷新令牌请求', { ip: req.ip });

    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('刷新令牌不能为空');
    }

    try {
      // 调用服务层刷新令牌
      const tokens = await this.authService.refreshAccessToken(refreshToken);

      logger.info('访问令牌刷新成功', { ip: req.ip });

      // 返回成功响应
      res.json({
        success: true,
        message: '令牌刷新成功',
        data: tokens
      });

    } catch (error) {
      logger.error('刷新访问令牌失败', { 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 用户登出
   */
  logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const { refreshToken } = req.body;

    logger.info('收到用户登出请求', { userId });

    try {
      // 调用服务层进行登出
      await this.authService.logout(userId, refreshToken);

      logger.info('用户登出成功', { userId });

      // 返回成功响应
      res.json({
        success: true,
        message: '登出成功'
      });

    } catch (error) {
      logger.error('用户登出失败', { 
        userId,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 获取用户信息
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;

    logger.info('收到获取用户信息请求', { userId });

    try {
      const userProfile = await this.authService.getUserProfile(userId);

      logger.debug('用户信息获取成功', { userId });

      res.json({
        success: true,
        data: userProfile
      });

    } catch (error) {
      logger.error('获取用户信息失败', { 
        userId,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 获取认证统计信息
   */
  getAuthStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到获取认证统计信息请求', { ip: req.ip });

    try {
      const stats = await this.authService.getAuthStats();

      logger.debug('认证统计信息获取成功');

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取认证统计信息失败', { 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 清理过期令牌（管理员功能）
   */
  cleanupTokens = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('收到清理过期令牌请求', { ip: req.ip });

    try {
      const deletedCount = await this.authService.cleanupExpiredRefreshTokens();

      logger.info('过期令牌清理完成', { deletedCount });

      res.json({
        success: true,
        message: '过期令牌清理完成',
        data: { deletedCount }
      });

    } catch (error) {
      logger.error('清理过期令牌失败', { 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });
}

export default AuthController;