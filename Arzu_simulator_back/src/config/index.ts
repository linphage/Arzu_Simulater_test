import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

// 配置验证函数
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// 服务器配置
export const serverConfig = {
  port: parseInt(process.env.PORT || '3001'),
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// 数据库配置
export const databaseConfig = {
  path: process.env.DB_PATH || './database.db',
};

// 认证配置
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  loginRateLimitWindow: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '5'),
};

// 日志配置
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || './logs/app.log',
  errorFile: process.env.ERROR_LOG_FILE || './logs/error.log',
};

// 安全配置
export const securityConfig = {
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
};

// 应用配置
export const appConfig = {
  name: 'Arzu Simulator Backend',
  version: '1.0.0',
  apiPrefix: '/api',
};

// 导出所有配置
export default {
  server: serverConfig,
  database: databaseConfig,
  auth: authConfig,
  logger: loggerConfig,
  security: securityConfig,
  app: appConfig,
};