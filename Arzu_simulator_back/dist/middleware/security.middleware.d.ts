import { Request, Response, NextFunction } from 'express';
export declare const securityMiddleware: () => (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeLimit: (maxSize?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const ipWhitelist: (allowedIPs: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const preventClickjacking: (req: Request, res: Response, next: NextFunction) => void;
export declare const preventMimeSniffing: (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=security.middleware.d.ts.map