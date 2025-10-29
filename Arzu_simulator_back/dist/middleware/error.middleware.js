"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorAggregator = exports.errorLogger = exports.errorRecoveryMiddleware = exports.asyncErrorHandler = exports.validationErrorHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_1 = require("../config/logger");
const response_utils_1 = require("../utils/response.utils");
const error_utils_1 = require("../utils/error.utils");
const errorHandler = (err, req, res, next) => {
    var _a;
    const startTime = Date.now();
    logger_1.logger.error('请求处理错误', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 'anonymous'
    });
    const response = (0, response_utils_1.createResponse)(res);
    if (err instanceof error_utils_1.ValidationError) {
        response.validation(err.message, err.details);
        return;
    }
    if (err instanceof error_utils_1.AuthenticationError) {
        response.unauthorized(err.message);
        return;
    }
    if (err instanceof error_utils_1.AuthorizationError) {
        response.forbidden(err.message);
        return;
    }
    if (err instanceof error_utils_1.NotFoundError) {
        response.notFound(err.message);
        return;
    }
    if (err instanceof error_utils_1.ConflictError) {
        response.conflict(err.message);
        return;
    }
    if (err instanceof error_utils_1.RateLimitError) {
        response.error(err.message, undefined, 429);
        return;
    }
    if (err instanceof error_utils_1.ApiError) {
        response.error(err.message, undefined, err.statusCode);
        return;
    }
    if (err instanceof zod_1.ZodError) {
        const errors = err.errors.map(error => ({
            field: error.path.join('.'),
            message: error.message,
            code: error.code
        }));
        response.validation('输入数据验证失败', errors);
        return;
    }
    logger_1.logger.error('未处理的错误类型', { error: err.name, message: err.message });
    response.serverError(response_utils_1.RESPONSE_MESSAGES.SERVER_ERROR);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const response = (0, response_utils_1.createResponse)(res);
    logger_1.logger.warn('请求的资源不存在', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    response.notFound(`请求的资源不存在: ${req.originalUrl}`);
};
exports.notFoundHandler = notFoundHandler;
const validationErrorHandler = (errors) => {
    return (req, res, next) => {
        if (errors.length > 0) {
            const response = (0, response_utils_1.createResponse)(res);
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
exports.validationErrorHandler = validationErrorHandler;
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncErrorHandler = asyncErrorHandler;
const errorRecoveryMiddleware = (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();
    res.send = function (data) {
        if (res.statusCode >= 400) {
            logger_1.logger.warn('错误响应发送', {
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
exports.errorRecoveryMiddleware = errorRecoveryMiddleware;
const errorLogger = (error, req, res, next) => {
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
    if (error instanceof error_utils_1.ValidationError) {
        logger_1.logger.warn('验证错误', errorInfo);
    }
    else if (error instanceof error_utils_1.AuthenticationError || error instanceof error_utils_1.AuthorizationError) {
        logger_1.logger.warn('认证授权错误', errorInfo);
    }
    else if (error instanceof error_utils_1.NotFoundError) {
        logger_1.logger.info('资源未找到', errorInfo);
    }
    else if (error instanceof error_utils_1.ConflictError) {
        logger_1.logger.warn('数据冲突', errorInfo);
    }
    else {
        logger_1.logger.error('系统错误', errorInfo);
    }
    next(error);
};
exports.errorLogger = errorLogger;
class ErrorAggregator {
    static addError(error, context) {
        this.errors.push({
            error,
            context,
            timestamp: new Date()
        });
        if (this.errors.length > 1000) {
            this.errors = this.errors.slice(-500);
        }
    }
    static getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    }
    static getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            byTime: {},
            recent: this.getRecentErrors(5)
        };
        this.errors.forEach(({ error }) => {
            const type = error.constructor.name;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
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
exports.ErrorAggregator = ErrorAggregator;
ErrorAggregator.errors = [];
exports.default = {
    errorHandler: exports.errorHandler,
    notFoundHandler: exports.notFoundHandler,
    validationErrorHandler: exports.validationErrorHandler,
    asyncErrorHandler: exports.asyncErrorHandler,
    errorRecoveryMiddleware: exports.errorRecoveryMiddleware,
    errorLogger: exports.errorLogger,
    ErrorAggregator
};
//# sourceMappingURL=error.middleware.js.map