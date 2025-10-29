import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: (keyPrefix: string, maxRequests: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const globalRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const loginRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const passwordResetRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const adminRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            rateLimit?: {
                limit: number;
                remaining: number;
                resetTime: Date;
            };
        }
    }
}
//# sourceMappingURL=rate-limit.middleware.d.ts.map