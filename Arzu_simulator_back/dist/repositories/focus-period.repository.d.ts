export interface FocusPeriod {
    period_id: number;
    session_id: number;
    start_time: string;
    end_time: string | null;
    duration_min: number | null;
    is_interrupted: boolean | null;
    created_at: string;
}
export interface CreateFocusPeriodDto {
    session_id: number;
    start_time?: string;
}
export interface EndFocusPeriodDto {
    end_time?: string;
    is_interrupted: boolean;
}
export declare class FocusPeriodRepository {
    create(data: CreateFocusPeriodDto): Promise<number>;
    endPeriod(periodId: number, data: EndFocusPeriodDto): Promise<void>;
    findById(periodId: number): Promise<FocusPeriod | undefined>;
    findBySessionId(sessionId: number): Promise<FocusPeriod[]>;
    getActivePeriod(sessionId: number): Promise<FocusPeriod | undefined>;
    getSessionPeriodStats(sessionId: number): Promise<{
        totalPeriods: number;
        interruptedPeriods: number;
        totalFocusMinutes: number;
        averagePeriodMinutes: number;
    }>;
    deleteBySessionId(sessionId: number): Promise<number>;
    getFocusStatsByDateRange(userId: number, startDate: string, endDate: string): Promise<FocusPeriod[]>;
}
export default FocusPeriodRepository;
//# sourceMappingURL=focus-period.repository.d.ts.map