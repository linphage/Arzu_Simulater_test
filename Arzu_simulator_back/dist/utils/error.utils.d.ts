export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    constructor(message: string, statusCode?: number, details?: any);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, details?: any);
}
export declare class AuthenticationError extends ApiError {
    constructor(message?: string);
}
export declare class AuthorizationError extends ApiError {
    constructor(message?: string);
}
export declare class NotFoundError extends ApiError {
    constructor(message?: string);
}
export declare class ConflictError extends ApiError {
    constructor(message?: string);
}
export declare class RateLimitError extends ApiError {
    constructor(message?: string);
}
export declare const errorHandler: (err: Error, req: any, res: any, next: any) => void;
export declare const asyncHandler: (fn: Function) => (req: any, res: any, next: any) => void;
//# sourceMappingURL=error.utils.d.ts.map