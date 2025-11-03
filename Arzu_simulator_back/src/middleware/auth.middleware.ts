import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config';
import { logger } from '../config/logger';
import { AuthenticationError } from '../utils/error.utils';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../controllers/auth.controller';
import { getErrorMessage } from '../utils/error-handler';

/**
 * 认证中间件 - 验证JWT令牌
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      logger.warn('认证失败 - 缺少令牌', { 
        ip: req.ip, 
        path: req.path, 
        method: req.method 
      });
      throw new AuthenticationError('访问令牌缺失');
    }

    // 验证令牌
    let decoded: any;
    try {
      decoded = jwt.verify(token, authConfig.jwtSecret);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('认证失败 - 令牌已过期', { 
          ip: req.ip, 
          path: req.path, 
          userId: decoded?.userId 
        });
        throw new AuthenticationError('访问令牌已过期');
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('认证失败 - 无效的令牌', { 
          ip: req.ip, 
          path: req.path 
        });
        throw new AuthenticationError('访问令牌无效');
      }
      throw new AuthenticationError('访问令牌验证失败');
    }

    // 验证用户是否存在且活跃
    const authService = new AuthService();
    const user = await authService.validateAccessToken(token);

    // 将用户信息附加到请求对象
    req.user = {
      id: user.userId,
      username: user.username,
      mail: user.mail,
      email: user.email
    };

    logger.debug('认证成功', { 
      userId: user.userId, 
      username: user.username, 
      path: req.path 
    });

    next();

  } catch (error) {
    logger.error('认证中间件错误', { 
      ip: req.ip, 
      path: req.path, 
      error: getErrorMessage(error) 
    });
    
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        success: false,
        message: '认证失败',
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * 可选认证中间件 - 不强制要求令牌，但如果提供则验证
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    next();
    return;
  }

  try {
    const authService = new AuthService();
    const user = await authService.validateAccessToken(token);
    
    req.user = {
      id: user.userId,
      username: user.username,
      mail: user.mail,
      email: user.email
    };
    
  } catch (error) {
    // 可选认证失败不影响请求继续
    logger.debug('可选认证失败', { 
      ip: req.ip, 
      path: req.path, 
      error: getErrorMessage(error) 
    });
  }
  
  next();
};

/**
 * 角色权限检查中间件
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '需要认证',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 这里可以根据需要实现角色系统
    // 目前简化为检查用户是否活跃
    // 如果需要更复杂的角色系统，可以扩展数据库结构
    
    next();
  };
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: '需要认证',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 这里可以实现管理员权限检查
  // 例如：检查用户是否属于管理员角色
  // 目前简化为检查用户是否活跃
  
  logger.debug('管理员权限检查', { 
    userId: req.user.id, 
    username: req.user.username 
  });
  
  next();
};

/**
   * 刷新令牌验证中间件
   */
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: '刷新令牌不能为空',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // 基本格式验证
    if (typeof refreshToken !== 'string' || refreshToken.length < 10) {
      throw new Error('无效的刷新令牌格式');
    }

    next();
  } catch (error) {
    logger.warn('刷新令牌验证失败', { 
      ip: req.ip, 
      error: getErrorMessage(error) 
    });
    
    res.status(400).json({
      success: false,
      message: '无效的刷新令牌',
      timestamp: new Date().toISOString()
    });
  }
};