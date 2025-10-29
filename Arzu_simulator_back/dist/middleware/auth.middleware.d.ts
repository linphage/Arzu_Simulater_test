import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../controllers/auth.controller';
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string | string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map