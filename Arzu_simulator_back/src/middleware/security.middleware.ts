import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../config/logger';

/**
 * 安全中间件配置
 */
export const securityMiddleware = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true
    }
  });
};

/**
 * 请求日志中间件
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // 记录请求开始
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * 请求ID中间件 - 为每个请求生成唯一ID
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.id = requestId as string;
  res.setHeader('X-Request-Id', requestId);
  next();
};

/**
 * 请求超时中间件
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    let timeoutId: NodeJS.Timeout;
    
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', {
          method: req.method,
          url: req.originalUrl,
          timeout: timeoutMs,
          requestId: req.id
        });
        
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          requestId: req.id,
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // 清理超时定时器
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

/**
 * 请求大小限制中间件
 */
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const maxSizeBytes = parseSize(maxSize);
    let size = 0;
    
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSizeBytes) {
        logger.warn('Request body too large', {
          method: req.method,
          url: req.originalUrl,
          size,
          maxSize: maxSizeBytes,
          ip: req.ip
        });
        
        req.destroy();
        res.status(413).json({
          success: false,
          message: `Request body too large. Maximum size is ${maxSize}`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    next();
  };
};

/**
 * IP白名单中间件
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        clientIP,
        allowedIPs,
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

/**
 * 防止点击劫持中间件
 */
export const preventClickjacking = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
};

/**
 * 防止MIME类型嗅探中间件
 */
export const preventMimeSniffing = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 解析文件大小字符串
 */
function parseSize(size: string): number {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
  if (!match) {
    throw new Error('Invalid size format');
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] as keyof typeof units;
  
  return Math.floor(value * units[unit]);
}

// 扩展Express请求类型
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * 错误处理中间件
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });

  if (res.headersSent) {
    return;
  }

  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
};

/**
 * 404处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
};