"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        // 保持正确的错误堆栈
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, details) {
        super(message, 400, details);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends ApiError {
    constructor(message = '认证失败') {
        super(message, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends ApiError {
    constructor(message = '权限不足') {
        super(message, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends ApiError {
    constructor(message = '资源不存在') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ApiError {
    constructor(message = '资源冲突') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends ApiError {
    constructor(message = '请求过于频繁') {
        super(message, 429);
    }
}
exports.RateLimitError = RateLimitError;
// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    let apiError;
    if (err instanceof ApiError) {
        apiError = err;
    }
    else {
        // 将未知错误包装为ApiError
        apiError = new ApiError(process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message, 500);
    }
    const response = {
        success: false,
        message: apiError.message,
        timestamp: new Date().toISOString(),
    };
    // 只在开发环境中返回详细信息
    if (process.env.NODE_ENV !== 'production' && apiError.details) {
        response.details = apiError.details;
    }
    // 只在开发环境中返回堆栈信息
    if (process.env.NODE_ENV !== 'production' && apiError.stack) {
        response.stack = apiError.stack;
    }
    res.status(apiError.statusCode).json(response);
};
exports.errorHandler = errorHandler;
// 异步错误捕获包装器
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
