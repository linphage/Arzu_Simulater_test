import { PomodoroSession, CreatePomodoroSessionDto } from '../types/task.types';
export declare class PomodoroRepository {
    create(userId: number, sessionData: CreatePomodoroSessionDto): Promise<number>;
    findById(sessionId: number): Promise<PomodoroSession | undefined>;
    findByIdAndUserId(sessionId: number, userId: number): Promise<PomodoroSession | undefined>;
    findByUserId(userId: number, options?: {
        taskId?: number;
        completed?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        sessions: PomodoroSession[];
        total: number;
    }>;
    findByTaskId(taskId: number): Promise<PomodoroSession[]>;
    completeSession(sessionId: number): Promise<void>;
    endSession(sessionId: number, endData: {
        completed: boolean;
        completedAt?: string;
        updateDuration?: boolean;
        actualDuration?: number;
    }): Promise<void>;
    calculateSessionActualDuration(sessionId: number): Promise<number>;
    getActiveSession(userId: number): Promise<PomodoroSession | undefined>;
    getPomodoroStats(userId: number, days?: number): Promise<{
        totalSessions: number;
        completedSessions: number;
        totalMinutes: number;
        averageDuration: number;
        dailyStats: Array<{
            date: string;
            sessions: number;
            completedSessions: number;
            totalMinutes: number;
        }>;
    }>;
    getPomodoroStatsByTask(taskId: number): Promise<{
        totalSessions: number;
        completedSessions: number;
        totalMinutes: number;
        averageDuration: number;
    }>;
    delete(sessionId: number): Promise<void>;
    deleteByTaskId(taskId: number): Promise<number>;
    cleanupExpiredSessions(daysToKeep?: number): Promise<number>;
}
export default PomodoroRepository;
//# sourceMappingURL=pomodoro.repository.d.ts.map