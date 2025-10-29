/**
 * 统一响应格式工具
 * 提供标准化的API响应格式
 */

import { Response } from 'express';

/**
 * API响应数据结构
 */
export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T;
  errors?: any[];
  pagination?: PaginationInfo;
  metadata?: Record<string, any>;
}

/**
 * 分页信息结构
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 成功响应构建器
 */
export class ResponseBuilder<T = any> {
  private response: ApiResponseData<T>;

  constructor(success: boolean = true, message: string = '') {
    this.response = {
      success,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 设置响应数据
   */
  setData(data: T): ResponseBuilder<T> {
    this.response.data = data;
    return this;
  }

  /**
   * 设置错误信息
   */
  setErrors(errors: any[]): ResponseBuilder<T> {
    this.response.errors = errors;
    return this;
  }

  /**
   * 设置分页信息
   */
  setPagination(pagination: PaginationInfo): ResponseBuilder<T> {
    this.response.pagination = pagination;
    return this;
  }

  /**
   * 设置元数据
   */
  setMetadata(metadata: Record<string, any>): ResponseBuilder<T> {
    this.response.metadata = metadata;
    return this;
  }

  /**
   * 设置消息
   */
  setMessage(message: string): ResponseBuilder<T> {
    this.response.message = message;
    return this;
  }

  /**
   * 构建最终响应
   */
  build(): ApiResponseData<T> {
    return this.response;
  }
}

/**
 * 快速创建成功响应
 */
export const successResponse = <T>(message: string, data?: T, pagination?: PaginationInfo) => {
  return new ResponseBuilder<T>(true, message)
    .setData(data)
    .setPagination(pagination!)
    .build();
};

/**
 * 快速创建错误响应
 */
export const errorResponse = <T>(message: string, errors?: any[]) => {
  return new ResponseBuilder<T>(false, message)
    .setErrors(errors || [])
    .build();
};

/**
 * 分页响应构建器
 */
export const paginatedResponse = <T>(
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationInfo = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };

  return new ResponseBuilder<T[]>(true, message)
    .setData(data)
    .setPagination(pagination)
    .build();
};

/**
 * Express响应发送器
 */
export class ResponseSender {
  private res: Response;

  constructor(response: Response) {
    this.res = response;
  }

  /**
   * 发送成功响应
   */
  success<T>(message: string, data?: T, statusCode: number = 200) {
    const response = successResponse(message, data);
    return this.res.status(statusCode).json(response);
  }

  /**
   * 发送分页成功响应
   */
  paginated<T>(message: string, data: T[], page: number, limit: number, total: number) {
    const response = paginatedResponse(message, data, page, limit, total);
    return this.res.status(200).json(response);
  }

  /**
   * 发送创建成功响应
   */
  created<T>(message: string, data?: T) {
    return this.success(message, data, 201);
  }

  /**
   * 发送更新成功响应
   */
  updated<T>(message: string, data?: T) {
    return this.success(message, data, 200);
  }

  /**
   * 发送删除成功响应
   */
  deleted(message: string) {
    return this.success(message, undefined, 200);
  }

  /**
   * 发送错误响应
   */
  error(message: string, errors?: any[], statusCode: number = 400) {
    const response = errorResponse(message, errors);
    return this.res.status(statusCode).json(response);
  }

  /**
   * 发送未授权错误
   */
  unauthorized(message: string = '未授权访问') {
    return this.error(message, undefined, 401);
  }

  /**
   * 发送禁止访问错误
   */
  forbidden(message: string = '禁止访问') {
    return this.error(message, undefined, 403);
  }

  /**
   * 发送未找到错误
   */
  notFound(message: string = '资源未找到') {
    return this.error(message, undefined, 404);
  }

  /**
   * 发送冲突错误
   */
  conflict(message: string = '数据冲突') {
    return this.error(message, undefined, 409);
  }

  /**
   * 发送验证错误
   */
  validation(message: string, errors: any[]) {
    return this.error(message, errors, 422);
  }

  /**
   * 发送服务器错误
   */
  serverError(message: string = '服务器内部错误') {
    return this.error(message, undefined, 500);
  }
}

/**
 * 快速创建响应发送器的工厂函数
 */
export const createResponse = (res: Response) => new ResponseSender(res);

/**
 * 常用的响应消息
 */
export const RESPONSE_MESSAGES = {
  // 成功消息
  SUCCESS: '操作成功',
  CREATED: '创建成功',
  UPDATED: '更新成功',
  DELETED: '删除成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '登出成功',
  REGISTER_SUCCESS: '注册成功',
  
  // 错误消息
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源未找到',
  VALIDATION_ERROR: '输入数据验证失败',
  SERVER_ERROR: '服务器内部错误',
  CONFLICT: '数据冲突',
  RATE_LIMIT: '请求过于频繁',
  
  // 业务相关
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

/**
 * 分页参数解析器
 */
export const parsePaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * 排序参数解析器
 */
export const parseSortParams = (query: any, allowedFields: string[] = []) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = (query.sortOrder || 'desc').toLowerCase() as 'asc' | 'desc';

  // 验证排序字段
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : allowedFields[0] || 'createdAt';

  return { sortBy: validSortBy, sortOrder };
};

/**
 * 过滤参数解析器
 */
export const parseFilterParams = (query: any, allowedFilters: string[] = []) => {
  const filters: Record<string, any> = {};

  allowedFilters.forEach(field => {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  });

  return filters;
};

/**
 * 响应时间计算
 */
export const calculateResponseTime = (startTime: number): number => {
  const endTime = Date.now();
  return endTime - startTime;
};

/**
 * 添加响应头信息
 */
export const addResponseHeaders = (res: Response, startTime: number) => {
  const responseTime = calculateResponseTime(startTime);
  
  res.set({
    'X-Response-Time': `${responseTime}ms`,
    'X-API-Version': '1.0.0',
    'X-Request-ID': res.getHeader('X-Request-ID') || 'unknown'
  });
};

export default {
  ResponseBuilder,
  ResponseSender,
  successResponse,
  errorResponse,
  paginatedResponse,
  createResponse,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  calculateResponseTime,
  addResponseHeaders,
  RESPONSE_MESSAGES
};