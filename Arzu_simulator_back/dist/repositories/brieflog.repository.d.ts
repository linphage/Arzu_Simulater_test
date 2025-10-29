export declare enum BriefType {
    DELETE_REASON = 1,
    CATEGORY_CHANGE = 2,
    PRIORITY_CHANGE = 3,
    DUE_DATE_CHANGE = 4,
    CONTINUE_WORK_REMARK = 5,
    LEAVE_REMARK = 6,
    TASK_COMPLETE_REMARK = 7,
    REFLECTION_REMARK = 8
}
export interface BriefLog {
    debrief_id: number;
    session_id: number | null;
    task_id: number;
    user_id: number;
    brief_type: BriefType;
    brief_content: string;
    created_at: string;
}
export interface CreateBriefLogDto {
    session_id?: number;
    task_id: number;
    user_id: number;
    brief_type: BriefType;
    brief_content: string;
}
export declare class BriefLogRepository {
    create(data: CreateBriefLogDto): Promise<BriefLog>;
    createBatch(logs: CreateBriefLogDto[]): Promise<BriefLog[]>;
    findById(debrief_id: number): Promise<BriefLog | null>;
    findByTaskId(task_id: number): Promise<BriefLog[]>;
    findByUserId(user_id: number, limit?: number): Promise<BriefLog[]>;
    getHabitStatsByDateRange(user_id: number, startDate: string, endDate: string): Promise<BriefLog[]>;
}
export default BriefLogRepository;
//# sourceMappingURL=brieflog.repository.d.ts.map