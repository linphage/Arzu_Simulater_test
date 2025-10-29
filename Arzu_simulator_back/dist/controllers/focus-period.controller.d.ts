import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
    };
}
export declare class FocusPeriodController {
    private focusPeriodRepository;
    private focusAnalysisService;
    constructor();
    startPeriod: (req: Request, res: Response) => Promise<void>;
    endPeriod: (req: Request, res: Response) => Promise<void>;
    getSessionPeriods: (req: Request, res: Response) => Promise<void>;
    getActivePeriod: (req: Request, res: Response) => Promise<void>;
    getSessionPeriodStats: (req: Request, res: Response) => Promise<void>;
    getFocusStats: (req: AuthRequest, res: Response) => Promise<void>;
}
export default FocusPeriodController;
//# sourceMappingURL=focus-period.controller.d.ts.map