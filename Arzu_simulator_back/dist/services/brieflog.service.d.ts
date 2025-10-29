import { CreateBriefLogDto, BriefLog } from '../repositories/brieflog.repository';
export declare class BriefLogService {
    private briefLogRepository;
    constructor();
    createBriefLog(data: CreateBriefLogDto): Promise<BriefLog>;
    getBriefLogsByTaskId(taskId: number): Promise<BriefLog[]>;
    getBriefLogsByUserId(userId: number, limit?: number): Promise<BriefLog[]>;
}
//# sourceMappingURL=brieflog.service.d.ts.map