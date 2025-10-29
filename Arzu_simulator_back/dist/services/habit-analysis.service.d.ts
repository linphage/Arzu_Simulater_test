export declare class HabitAnalysisService {
    private briefLogRepository;
    private taskRepository;
    constructor();
    getHabitStats(userId: number, timeframe: 'week' | 'month'): Promise<{
        keyMetrics: {
            totalProblematicEvents: number;
            problematicEventRatio: number;
            totalTasksCreated: number;
        };
        dailyData: Array<{
            date: string;
            taskDeletion: number;
            categoryChange: number;
            priorityChange: number;
            dueDateChange: number;
        }>;
        taskTypeStats: Array<{
            taskType: string;
            affectedCount: number;
            totalCount: number;
            percentage: number;
        }>;
        highFrequencyTimeSlots: Array<{
            timeSlot: string;
            count: number;
        }>;
    }>;
}
export default HabitAnalysisService;
//# sourceMappingURL=habit-analysis.service.d.ts.map