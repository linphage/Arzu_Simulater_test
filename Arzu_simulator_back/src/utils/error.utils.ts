export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    // 保持正确的错误堆栈
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = '认证失败') {
    super(message, 401);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = '权限不足') {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = '资源不存在') {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = '请求过于频繁') {
    super(message, 429);
  }
}

// 错误处理中间件
export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else {
    // 将未知错误包装为ApiError
    apiError = new ApiError(
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
      500
    );
  }

  const response: any = {
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

// 类型守护函数：检查错误是否有name属性
export function isErrorWithName(error: unknown): error is Error & { name: string } {
  return error instanceof Error && typeof (error as any).name === 'string';
}

// 类型守护函数：检查错误是否有message属性
export function isErrorWithMessage(error: unknown): error is Error & { message: string } {
  return error instanceof Error && typeof error.message === 'string';
}

// 异步错误捕获包装器
export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};