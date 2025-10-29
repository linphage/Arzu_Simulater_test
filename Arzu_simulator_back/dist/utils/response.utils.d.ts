import { Response } from 'express';
export interface ApiResponseData<T = any> {
    success: boolean;
    message: string;
    timestamp: string;
    data?: T;
    errors?: any[];
    pagination?: PaginationInfo;
    metadata?: Record<string, any>;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare class ResponseBuilder<T = any> {
    private response;
    constructor(success?: boolean, message?: string);
    setData(data: T): ResponseBuilder<T>;
    setErrors(errors: any[]): ResponseBuilder<T>;
    setPagination(pagination: PaginationInfo): ResponseBuilder<T>;
    setMetadata(metadata: Record<string, any>): ResponseBuilder<T>;
    setMessage(message: string): ResponseBuilder<T>;
    build(): ApiResponseData<T>;
}
export declare const successResponse: <T>(message: string, data?: T, pagination?: PaginationInfo) => ApiResponseData<T>;
export declare const errorResponse: <T>(message: string, errors?: any[]) => ApiResponseData<T>;
export declare const paginatedResponse: <T>(message: string, data: T[], page: number, limit: number, total: number) => ApiResponseData<T[]>;
export declare class ResponseSender {
    private res;
    constructor(response: Response);
    success<T>(message: string, data?: T, statusCode?: number): Response<any, Record<string, any>>;
    paginated<T>(message: string, data: T[], page: number, limit: number, total: number): Response<any, Record<string, any>>;
    created<T>(message: string, data?: T): Response<any, Record<string, any>>;
    updated<T>(message: string, data?: T): Response<any, Record<string, any>>;
    deleted(message: string): Response<any, Record<string, any>>;
    error(message: string, errors?: any[], statusCode?: number): Response<any, Record<string, any>>;
    unauthorized(message?: string): Response<any, Record<string, any>>;
    forbidden(message?: string): Response<any, Record<string, any>>;
    notFound(message?: string): Response<any, Record<string, any>>;
    conflict(message?: string): Response<any, Record<string, any>>;
    validation(message: string, errors: any[]): Response<any, Record<string, any>>;
    serverError(message?: string): Response<any, Record<string, any>>;
}
export declare const createResponse: (res: Response) => ResponseSender;
export declare const RESPONSE_MESSAGES: {
    SUCCESS: string;
    CREATED: string;
    UPDATED: string;
    DELETED: string;
    LOGIN_SUCCESS: string;
    LOGOUT_SUCCESS: string;
    REGISTER_SUCCESS: string;
    UNAUTHORIZED: string;
    FORBIDDEN: string;
    NOT_FOUND: string;
    VALIDATION_ERROR: string;
    SERVER_ERROR: string;
    CONFLICT: string;
    RATE_LIMIT: string;
    TASK_CREATED: string;
    TASK_UPDATED: string;
    TASK_DELETED: string;
    TASK_NOT_FOUND: string;
    POMODORO_STARTED: string;
    POMODORO_COMPLETED: string;
    USER_NOT_FOUND: string;
    INVALID_CREDENTIALS: string;
    TOKEN_EXPIRED: string;
    TOKEN_INVALID: string;
};
export declare const parsePaginationParams: (query: any) => {
    page: number;
    limit: number;
    offset: number;
};
export declare const parseSortParams: (query: any, allowedFields?: string[]) => {
    sortBy: any;
    sortOrder: "asc" | "desc";
};
export declare const parseFilterParams: (query: any, allowedFilters?: string[]) => Record<string, any>;
export declare const calculateResponseTime: (startTime: number) => number;
export declare const addResponseHeaders: (res: Response, startTime: number) => void;
declare const _default: {
    ResponseBuilder: typeof ResponseBuilder;
    ResponseSender: typeof ResponseSender;
    successResponse: <T>(message: string, data?: T, pagination?: PaginationInfo) => ApiResponseData<T>;
    errorResponse: <T>(message: string, errors?: any[]) => ApiResponseData<T>;
    paginatedResponse: <T>(message: string, data: T[], page: number, limit: number, total: number) => ApiResponseData<T[]>;
    createResponse: (res: Response) => ResponseSender;
    parsePaginationParams: (query: any) => {
        page: number;
        limit: number;
        offset: number;
    };
    parseSortParams: (query: any, allowedFields?: string[]) => {
        sortBy: any;
        sortOrder: "asc" | "desc";
    };
    parseFilterParams: (query: any, allowedFilters?: string[]) => Record<string, any>;
    calculateResponseTime: (startTime: number) => number;
    addResponseHeaders: (res: Response, startTime: number) => void;
    RESPONSE_MESSAGES: {
        SUCCESS: string;
        CREATED: string;
        UPDATED: string;
        DELETED: string;
        LOGIN_SUCCESS: string;
        LOGOUT_SUCCESS: string;
        REGISTER_SUCCESS: string;
        UNAUTHORIZED: string;
        FORBIDDEN: string;
        NOT_FOUND: string;
        VALIDATION_ERROR: string;
        SERVER_ERROR: string;
        CONFLICT: string;
        RATE_LIMIT: string;
        TASK_CREATED: string;
        TASK_UPDATED: string;
        TASK_DELETED: string;
        TASK_NOT_FOUND: string;
        POMODORO_STARTED: string;
        POMODORO_COMPLETED: string;
        USER_NOT_FOUND: string;
        INVALID_CREDENTIALS: string;
        TOKEN_EXPIRED: string;
        TOKEN_INVALID: string;
    };
};
export default _default;
//# sourceMappingURL=response.utils.d.ts.map