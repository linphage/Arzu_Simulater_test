import { Request } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
    };
}
export declare class AuthController {
    private authService;
    constructor();
    register: (req: any, res: any, next: any) => void;
    login: (req: any, res: any, next: any) => void;
    loginByEmail: (req: any, res: any, next: any) => void;
    refreshToken: (req: any, res: any, next: any) => void;
    logout: (req: any, res: any, next: any) => void;
    getProfile: (req: any, res: any, next: any) => void;
    getAuthStats: (req: any, res: any, next: any) => void;
    cleanupTokens: (req: any, res: any, next: any) => void;
}
export default AuthController;
//# sourceMappingURL=auth.controller.d.ts.map