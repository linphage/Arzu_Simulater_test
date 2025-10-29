"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRateLimiter = exports.passwordResetRateLimiter = exports.uploadRateLimiter = exports.apiRateLimiter = exports.loginRateLimiter = exports.globalRateLimiter = exports.rateLimiter = void 0;
const config_1 = require("../config");
const logger_1 = require("../config/logger");
const rateLimitStore = {};
const cleanupExpiredEntries = () => {
    const now = new Date();
    for (const key in rateLimitStore) {
        if (rateLimitStore[key].resetTime <= now) {
            delete rateLimitStore[key];
        }
    }
};
const rateLimiter = (keyPrefix, maxRequests, windowMs = config_1.securityConfig.rateLimitWindow) => {
    return (req, res, next) => {
        try {
            if (Math.random() < 0.01) {
                cleanupExpiredEntries();
            }
            const userKey = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
            const key = `${keyPrefix}:${userKey}`;
            const now = new Date();
            let record = rateLimitStore[key];
            if (!record || record.resetTime <= now) {
                record = {
                    count: 0,
                    resetTime: new Date(now.getTime() + windowMs)
                };
                rateLimitStore[key] = record;
            }
            if (record.count >= maxRequests) {
                const retryAfter = Math.ceil((record.resetTime.getTime() - now.getTime()) / 1000);
                logger_1.logger.warn('速率限制触发', {
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
            record.count++;
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': (maxRequests - record.count).toString(),
                'X-RateLimit-Reset': record.resetTime.toISOString()
            });
            req.rateLimit = {
                limit: maxRequests,
                remaining: maxRequests - record.count,
                resetTime: record.resetTime
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('速率限制中间件错误', {
                keyPrefix,
                ip: req.ip,
                error: error.message
            });
            next();
        }
    };
};
exports.rateLimiter = rateLimiter;
exports.globalRateLimiter = (0, exports.rateLimiter)('global', config_1.securityConfig.rateLimitMax);
exports.loginRateLimiter = (0, exports.rateLimiter)('login', 5, 15 * 60 * 1000);
exports.apiRateLimiter = (0, exports.rateLimiter)('api', 100, 60 * 1000);
exports.uploadRateLimiter = (0, exports.rateLimiter)('upload', 10, 60 * 60 * 1000);
exports.passwordResetRateLimiter = (0, exports.rateLimiter)('password-reset', 3, 60 * 60 * 1000);
exports.adminRateLimiter = (0, exports.rateLimiter)('admin', 50, 60 * 1000);
//# sourceMappingURL=rate-limit.middleware.js.map