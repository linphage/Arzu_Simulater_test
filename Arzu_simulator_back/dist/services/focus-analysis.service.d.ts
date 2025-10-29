export declare class FocusAnalysisService {
    private focusPeriodRepository;
    private pomodoroRepository;
    constructor();
    getFocusStats(userId: number, timeframe: 'week' | 'month'): Promise<{
        keyMetrics: {
            avgFocusTime: number;
            avgInterruptions: number;
            focusIndex: number;
        };
        dailyData: Array<{
            date: string;
            sessionDuration: number;
            interruptions: number;
            focusIndex: number;
        }>;
    }>;
}
export default FocusAnalysisService;
//# sourceMappingURL=focus-analysis.service.d.ts.map