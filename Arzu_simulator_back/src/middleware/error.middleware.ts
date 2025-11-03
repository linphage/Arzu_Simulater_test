/**
 * 增强的错误处理中间件
 * 提供统一的错误处理和响应格式
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { createResponse, RESPONSE_MESSAGES } from '../utils/response.utils';
import { 
  ApiError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  ConflictError,
  RateLimitError 
} from '../utils/error.utils';

/**
 * 错误处理中间件
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const startTime = Date.now();
  
  // 记录错误日志
  logger.error('请求处理错误', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId || 'anonymous'
  });

  // 创建响应发送器
  const response = createResponse(res);

  // 处理不同类型的错误
  if (err instanceof ValidationError) {
    response.validation(err.message, err.details);
    return;
  }

  if (err instanceof AuthenticationError) {
    response.unauthorized(err.message);
    return;
  }

  if (err instanceof AuthorizationError) {
    response.forbidden(err.message);
    return;
  }

  if (err instanceof NotFoundError) {
    response.notFound(err.message);
    return;
  }

  if (err instanceof ConflictError) {
    response.conflict(err.message);
    return;
  }

  if (err instanceof RateLimitError) {
    response.error(err.message, undefined, 429);
    return;
  }

  if (err instanceof ApiError) {
    response.error(err.message, undefined, err.statusCode);
    return;
  }

  // 处理Zod验证错误
  if (err instanceof ZodError) {
    const errors = err.issues.map((error: any) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));
    response.validation('输入数据验证失败', errors);
    return;
  }

  // 处理其他未知错误
  logger.error('未处理的错误类型', { error: err.name, message: err.message });
  response.serverError(RESPONSE_MESSAGES.SERVER_ERROR);
};

/**
 * 404处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response = createResponse(res);
  
  logger.warn('请求的资源不存在', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  response.notFound(`请求的资源不存在: ${req.originalUrl}`);
};

/**
 * 请求验证错误处理
 */
export const validationErrorHandler = (errors: any[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (errors.length > 0) {
      const response = createResponse(res);
      const validationErrors = errors.map(error => ({
        field: error.param || error.path,
        message: error.msg || error.message,
        value: error.value
      }));
      
      response.validation('输入数据验证失败', validationErrors);
      return;
    }
    next();
  };
};

/**
 * 异步错误处理器
 */
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 错误恢复中间件
 */
export const errorRecoveryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 添加错误恢复机制
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function(data: any) {
    // 检查是否是错误响应
    if (res.statusCode >= 400) {
      logger.warn('错误响应发送', {
        statusCode: res.statusCode,
        url: req.originalUrl,
        method: req.method,
        responseTime: Date.now() - startTime
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * 错误日志记录器
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // 记录详细的错误信息
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // 根据错误严重程度选择日志级别
  if (error instanceof ValidationError) {
    logger.warn('验证错误', errorInfo);
  } else if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    logger.warn('认证授权错误', errorInfo);
  } else if (error instanceof NotFoundError) {
    logger.info('资源未找到', errorInfo);
  } else if (error instanceof ConflictError) {
    logger.warn('数据冲突', errorInfo);
  } else {
    logger.error('系统错误', errorInfo);
  }

  next(error);
};

/**
 * 错误聚合和报告
 */
export class ErrorAggregator {
  private static errors: Array<{
    error: Error;
    context: any;
    timestamp: Date;
  }> = [];

  static addError(error: Error, context: any) {
    this.errors.push({
      error,
      context,
      timestamp: new Date()
    });

    // 保持错误数量在一个合理范围内
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-500);
    }
  }

  static getRecentErrors(count: number = 10) {
    return this.errors.slice(-count);
  }

  static getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      byTime: {} as Record<string, number>,
      recent: this.getRecentErrors(5)
    };

    // 按错误类型统计
    this.errors.forEach(({ error }) => {
      const type = error.constructor.name;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    // 按时间统计（最近24小时，按小时分组）
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13);
      stats.byTime[hourKey] = 0;
    }

    this.errors.forEach(({ timestamp }) => {
      const hourKey = timestamp.toISOString().slice(0, 13);
      if (stats.byTime[hourKey] !== undefined) {
        stats.byTime[hourKey]++;
      }
    });

    return stats;
  }

  static clearErrors() {
    this.errors = [];
  }
}

export default {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  asyncErrorHandler,
  errorRecoveryMiddleware,
  errorLogger,
  ErrorAggregator
};