import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const validationErrorHandler: (errors: any[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncErrorHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const errorRecoveryMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorLogger: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare class ErrorAggregator {
    private static errors;
    static addError(error: Error, context: any): void;
    static getRecentErrors(count?: number): {
        error: Error;
        context: any;
        timestamp: Date;
    }[];
    static getErrorStats(): {
        total: number;
        byType: Record<string, number>;
        byTime: Record<string, number>;
        recent: {
            error: Error;
            context: any;
            timestamp: Date;
        }[];
    };
    static clearErrors(): void;
}
declare const _default: {
    errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
    notFoundHandler: (req: Request, res: Response) => void;
    validationErrorHandler: (errors: any[]) => (req: Request, res: Response, next: NextFunction) => void;
    asyncErrorHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    errorRecoveryMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    errorLogger: (error: Error, req: Request, res: Response, next: NextFunction) => void;
    ErrorAggregator: typeof ErrorAggregator;
};
export default _default;
//# sourceMappingURL=error.middleware.d.ts.map