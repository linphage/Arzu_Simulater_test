import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import morgan from 'morgan';

// 导入配置
import { serverConfig, securityConfig } from './config';
import { logger } from './config/logger';
import { initDb } from './database/init';

// 导入中间件
import { 
  securityMiddleware, 
  requestLogger, 
  requestId, 
  requestTimeout,
  errorHandler,
  notFoundHandler 
} from './middleware/security.middleware';

// 导入路由
import apiRoutes from './api/index';

// 导入错误处理
import { errorHandler as apiErrorHandler } from './utils/error.utils';

// 导入定时任务
import { startScheduledTasks } from './utils/scheduler';

// 在程序顶部加载环境变量
dotenv.config();

const app = express();
const port = serverConfig.port;

// 初始化数据库
initDb().catch(error => {
  logger.error('数据库初始化失败', { error: error.message });
  process.exit(1);
});

// 启动定时任务
startScheduledTasks();

/**
 * 全局中间件配置
 */

// 安全中间件
app.use(securityMiddleware());

// 请求ID中间件
app.use(requestId);

// 请求超时中间件
app.use(requestTimeout(30000)); // 30秒超时

// CORS配置
app.use(cors({
  origin: securityConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP请求日志（使用Morgan）
const morganFormat = serverConfig.isDevelopment ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message: string) => logger.http(message.trim())
  }
}));

// 自定义请求日志
app.use(requestLogger);

/**
 * 健康检查端点（不受保护）
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'Arzu Simulator Backend is running!',
    timestamp: new Date().toISOString(),
    environment: serverConfig.env,
    version: '1.0.0'
  });
});

// API健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    environment: serverConfig.env
  });
});

/**
 * API路由配置
 */
// 挂载API路由（使用新的版本化路由结构）
app.use('/api', apiRoutes);

/**
 * 全局错误处理
 */

// API错误处理中间件
app.use(apiErrorHandler);

// 404处理中间件
app.use(notFoundHandler);

// 通用错误处理中间件
app.use(errorHandler);

/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason, promise });
  process.exit(1);
});

/**
 * 优雅关闭处理
 */
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

/**
 * 启动服务器
 */
const server = app.listen(port, () => {
  logger.info(`🚀 Server is running on http://localhost:${port}`);
  logger.info(`📊 Health check available at http://localhost:${port}/health`);
  logger.info(`🔧 Environment: ${serverConfig.env}`);
  logger.info(`📁 API documentation available at http://localhost:${port}/api`);
});

export default app;