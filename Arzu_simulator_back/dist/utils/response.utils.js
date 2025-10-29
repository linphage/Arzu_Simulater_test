"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addResponseHeaders = exports.calculateResponseTime = exports.parseFilterParams = exports.parseSortParams = exports.parsePaginationParams = exports.RESPONSE_MESSAGES = exports.createResponse = exports.ResponseSender = exports.paginatedResponse = exports.errorResponse = exports.successResponse = exports.ResponseBuilder = void 0;
class ResponseBuilder {
    constructor(success = true, message = '') {
        this.response = {
            success,
            message,
            timestamp: new Date().toISOString()
        };
    }
    setData(data) {
        this.response.data = data;
        return this;
    }
    setErrors(errors) {
        this.response.errors = errors;
        return this;
    }
    setPagination(pagination) {
        this.response.pagination = pagination;
        return this;
    }
    setMetadata(metadata) {
        this.response.metadata = metadata;
        return this;
    }
    setMessage(message) {
        this.response.message = message;
        return this;
    }
    build() {
        return this.response;
    }
}
exports.ResponseBuilder = ResponseBuilder;
const successResponse = (message, data, pagination) => {
    return new ResponseBuilder(true, message)
        .setData(data)
        .setPagination(pagination)
        .build();
};
exports.successResponse = successResponse;
const errorResponse = (message, errors) => {
    return new ResponseBuilder(false, message)
        .setErrors(errors || [])
        .build();
};
exports.errorResponse = errorResponse;
const paginatedResponse = (message, data, page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
    return new ResponseBuilder(true, message)
        .setData(data)
        .setPagination(pagination)
        .build();
};
exports.paginatedResponse = paginatedResponse;
class ResponseSender {
    constructor(response) {
        this.res = response;
    }
    success(message, data, statusCode = 200) {
        const response = (0, exports.successResponse)(message, data);
        return this.res.status(statusCode).json(response);
    }
    paginated(message, data, page, limit, total) {
        const response = (0, exports.paginatedResponse)(message, data, page, limit, total);
        return this.res.status(200).json(response);
    }
    created(message, data) {
        return this.success(message, data, 201);
    }
    updated(message, data) {
        return this.success(message, data, 200);
    }
    deleted(message) {
        return this.success(message, undefined, 200);
    }
    error(message, errors, statusCode = 400) {
        const response = (0, exports.errorResponse)(message, errors);
        return this.res.status(statusCode).json(response);
    }
    unauthorized(message = '未授权访问') {
        return this.error(message, undefined, 401);
    }
    forbidden(message = '禁止访问') {
        return this.error(message, undefined, 403);
    }
    notFound(message = '资源未找到') {
        return this.error(message, undefined, 404);
    }
    conflict(message = '数据冲突') {
        return this.error(message, undefined, 409);
    }
    validation(message, errors) {
        return this.error(message, errors, 422);
    }
    serverError(message = '服务器内部错误') {
        return this.error(message, undefined, 500);
    }
}
exports.ResponseSender = ResponseSender;
const createResponse = (res) => new ResponseSender(res);
exports.createResponse = createResponse;
exports.RESPONSE_MESSAGES = {
    SUCCESS: '操作成功',
    CREATED: '创建成功',
    UPDATED: '更新成功',
    DELETED: '删除成功',
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '登出成功',
    REGISTER_SUCCESS: '注册成功',
    UNAUTHORIZED: '未授权访问',
    FORBIDDEN: '权限不足',
    NOT_FOUND: '资源未找到',
    VALIDATION_ERROR: '输入数据验证失败',
    SERVER_ERROR: '服务器内部错误',
    CONFLICT: '数据冲突',
    RATE_LIMIT: '请求过于频繁',
    TASK_CREATED: '任务创建成功',
    TASK_UPDATED: '任务更新成功',
    TASK_DELETED: '任务删除成功',
    TASK_NOT_FOUND: '任务未找到',
    POMODORO_STARTED: '番茄钟会话开始成功',
    POMODORO_COMPLETED: '番茄钟会话完成成功',
    USER_NOT_FOUND: '用户未找到',
    INVALID_CREDENTIALS: '用户名或密码错误',
    TOKEN_EXPIRED: '访问令牌已过期',
    TOKEN_INVALID: '无效的访问令牌'
};
const parsePaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.parsePaginationParams = parsePaginationParams;
const parseSortParams = (query, allowedFields = []) => {
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc').toLowerCase();
    const validSortBy = allowedFields.includes(sortBy) ? sortBy : allowedFields[0] || 'createdAt';
    return { sortBy: validSortBy, sortOrder };
};
exports.parseSortParams = parseSortParams;
const parseFilterParams = (query, allowedFilters = []) => {
    const filters = {};
    allowedFilters.forEach(field => {
        if (query[field] !== undefined) {
            filters[field] = query[field];
        }
    });
    return filters;
};
exports.parseFilterParams = parseFilterParams;
const calculateResponseTime = (startTime) => {
    const endTime = Date.now();
    return endTime - startTime;
};
exports.calculateResponseTime = calculateResponseTime;
const addResponseHeaders = (res, startTime) => {
    const responseTime = (0, exports.calculateResponseTime)(startTime);
    res.set({
        'X-Response-Time': `${responseTime}ms`,
        'X-API-Version': '1.0.0',
        'X-Request-ID': res.getHeader('X-Request-ID') || 'unknown'
    });
};
exports.addResponseHeaders = addResponseHeaders;
exports.default = {
    ResponseBuilder,
    ResponseSender,
    successResponse: exports.successResponse,
    errorResponse: exports.errorResponse,
    paginatedResponse: exports.paginatedResponse,
    createResponse: exports.createResponse,
    parsePaginationParams: exports.parsePaginationParams,
    parseSortParams: exports.parseSortParams,
    parseFilterParams: exports.parseFilterParams,
    calculateResponseTime: exports.calculateResponseTime,
    addResponseHeaders: exports.addResponseHeaders,
    RESPONSE_MESSAGES: exports.RESPONSE_MESSAGES
};
//# sourceMappingURL=response.utils.js.map