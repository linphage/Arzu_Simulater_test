import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config';
import { logger } from '../config/logger';
import { ApiError } from '../utils/error.utils';

// 内存存储的速率限制器（在生产环境中应使用Redis等持久化存储）
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: Date;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * 清理过期的速率限制记录
 */
const cleanupExpiredEntries = (): void => {
  const now = new Date();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime <= now) {
      delete rateLimitStore[key];
    }
  }
};

/**
 * 速率限制中间件工厂函数
 */
export const rateLimiter = (
  keyPrefix: string,
  maxRequests: number,
  windowMs: number = securityConfig.rateLimitWindow
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 清理过期记录（定期清理）
      if (Math.random() < 0.01) { // 1%的概率进行清理
        cleanupExpiredEntries();
      }

      // 构建速率限制键（结合IP地址和用户标识）
      const userKey = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      const key = `${keyPrefix}:${userKey}`;
      const now = new Date();

      // 获取或创建速率限制记录
      let record = rateLimitStore[key];
      if (!record || record.resetTime <= now) {
        record = {
          count: 0,
          resetTime: new Date(now.getTime() + windowMs)
        };
        rateLimitStore[key] = record;
      }

      // 检查是否超过限制
      if (record.count >= maxRequests) {
        const retryAfter = Math.ceil((record.resetTime.getTime() - now.getTime()) / 1000);
        
        logger.warn('速率限制触发', {
          key,
          count: record.count,
          maxRequests,
          resetTime: record.resetTime,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': record.resetTime.toISOString(),
          'Retry-After': retryAfter.toString()
        });

        res.status(429).json({
          success: false,
          message: '请求过于频繁，请稍后再试',
          retryAfter,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 增加请求计数
      record.count++;

      // 设置响应头
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - record.count).toString(),
        'X-RateLimit-Reset': record.resetTime.toISOString()
      });

      // 将速率限制信息附加到请求对象
      req.rateLimit = {
        limit: maxRequests,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime
      };

      next();

    } catch (error) {
      logger.error('速率限制中间件错误', { 
        keyPrefix, 
        ip: req.ip, 
        error: error.message 
      });
      
      // 如果速率限制出错，允许请求继续（fail-open）
      next();
    }
  };
};

/**
 * 全局速率限制中间件
 */
export const globalRateLimiter = rateLimiter('global', securityConfig.rateLimitMax);

/**
 * 登录尝试速率限制中间件
 */
export const loginRateLimiter = rateLimiter('login', 5, 15 * 60 * 1000); // 15分钟内最多5次

/**
 * API速率限制中间件
 */
export const apiRateLimiter = rateLimiter('api', 100, 60 * 1000); // 1分钟内最多100次

/**
 * 文件上传速率限制中间件
 */
export const uploadRateLimiter = rateLimiter('upload', 10, 60 * 60 * 1000); // 1小时内最多10次

/**
 * 密码重置速率限制中间件
 */
export const passwordResetRateLimiter = rateLimiter('password-reset', 3, 60 * 60 * 1000); // 1小时内最多3次

/**
 * 管理员操作速率限制中间件
 */
export const adminRateLimiter = rateLimiter('admin', 50, 60 * 1000); // 1分钟内最多50次

// 扩展Express请求类型
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}