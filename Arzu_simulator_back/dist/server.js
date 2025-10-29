"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const logger_1 = require("./config/logger");
const init_1 = require("./database/init");
const security_middleware_1 = require("./middleware/security.middleware");
const index_1 = __importDefault(require("./api/index"));
const error_utils_1 = require("./utils/error.utils");
const scheduler_1 = require("./utils/scheduler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = config_1.serverConfig.port;
(0, init_1.initDb)().catch(error => {
    logger_1.logger.error('数据库初始化失败', { error: error.message });
    process.exit(1);
});
(0, scheduler_1.startScheduledTasks)();
app.use((0, security_middleware_1.securityMiddleware)());
app.use(security_middleware_1.requestId);
app.use((0, security_middleware_1.requestTimeout)(30000));
app.use((0, cors_1.default)({
    origin: config_1.securityConfig.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const morganFormat = config_1.serverConfig.isDevelopment ? 'dev' : 'combined';
app.use((0, morgan_1.default)(morganFormat, {
    stream: {
        write: (message) => logger_1.logger.http(message.trim())
    }
}));
app.use(security_middleware_1.requestLogger);
app.get('/', (req, res) => {
    res.json({
        message: 'Arzu Simulator Backend is running!',
        timestamp: new Date().toISOString(),
        environment: config_1.serverConfig.env,
        version: '1.0.0'
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        environment: config_1.serverConfig.env
    });
});
app.use('/api', index_1.default);
app.use(error_utils_1.errorHandler);
app.use(security_middleware_1.notFoundHandler);
app.use(security_middleware_1.errorHandler);
process.on('uncaughtException', (error) => {
    logger_1.logger.error('未捕获的异常', { error: error.message, stack: error.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('未处理的Promise拒绝', { reason, promise });
    process.exit(1);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
        logger_1.logger.info('服务器已关闭');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('收到SIGINT信号，开始优雅关闭...');
    server.close(() => {
        logger_1.logger.info('服务器已关闭');
        process.exit(0);
    });
});
const server = app.listen(port, () => {
    logger_1.logger.info(`🚀 Server is running on http://localhost:${port}`);
    logger_1.logger.info(`📊 Health check available at http://localhost:${port}/health`);
    logger_1.logger.info(`🔧 Environment: ${config_1.serverConfig.env}`);
    logger_1.logger.info(`📁 API documentation available at http://localhost:${port}/api`);
});
exports.default = app;
//# sourceMappingURL=server.js.map