"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// 日志格式
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
        logMessage += `\n${stack}`;
    }
    return logMessage;
}));
// 创建日志目录
const logsDir = path_1.default.join(process.cwd(), 'logs');
// 配置logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // 控制台输出
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
        }),
        // 错误日志文件
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 综合日志文件
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ],
    // 异常处理
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: path_1.default.join(logsDir, 'exceptions.log') })
    ],
    // 拒绝处理
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: path_1.default.join(logsDir, 'rejections.log') })
    ]
});
exports.logger = logger;
// 如果是开发环境，简化控制台输出
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
