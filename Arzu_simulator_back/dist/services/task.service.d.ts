import { Task, CreateTaskDto, UpdateTaskDto, TaskQueryParams, TaskStats, TaskAnalytics, BatchOperationResult, BatchTaskOperationDto, PomodoroSession, CreatePomodoroSessionDto } from '../types/task.types';
export declare class TaskService {
    private taskRepository;
    private pomodoroRepository;
    private briefLogRepository;
    constructor();
    createTask(userId: number, taskData: CreateTaskDto): Promise<Task>;
    createOfficeTask(userId: number, taskData: {
        title: string;
        description?: string;
        category?: string;
        priority?: string;
    }): Promise<Task>;
    getUserTasks(userId: number, options?: TaskQueryParams): Promise<{
        tasks: Task[];
        total: number;
    }>;
    getTaskById(userId: number, taskId: number): Promise<Task>;
    updateTask(userId: number, taskId: number, updateData: UpdateTaskDto): Promise<Task>;
    deleteTask(userId: number, taskId: number, deleteReason?: string): Promise<void>;
    batchOperateTasks(userId: number, operationData: BatchTaskOperationDto): Promise<BatchOperationResult>;
    getTaskStats(userId: number): Promise<TaskStats>;
    getTaskAnalytics(userId: number, days?: number): Promise<TaskAnalytics>;
    searchTasks(userId: number, query: string, limit?: number): Promise<Task[]>;
    getUpcomingTasks(userId: number, daysAhead?: number): Promise<Task[]>;
    getOverdueTasks(userId: number): Promise<Task[]>;
    archiveCompletedTasks(userId: number, daysOld?: number): Promise<number>;
    createPomodoroSession(userId: number, sessionData: CreatePomodoroSessionDto): Promise<PomodoroSession>;
    completePomodoroSession(userId: number, sessionId: number): Promise<PomodoroSession>;
    endPomodoroSession(userId: number, sessionId: number, endData: {
        completed: boolean;
        completedAt?: string;
        updateDuration?: boolean;
    }): Promise<PomodoroSession>;
    getPomodoroSessions(userId: number, options?: {
        taskId?: number;
        completed?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        sessions: PomodoroSession[];
        total: number;
    }>;
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
    getActivePomodoroSession(userId: number): Promise<PomodoroSession | null>;
    private validateTaskData;
    private validateUpdateData;
    updateTaskCompletionFromPomodoro(userId: number, taskId: number, sessionId: number, markAsCompleted: boolean, completedAt?: string): Promise<Task>;
    getCalendarCheckIns(userId: number, year: number, month: number): Promise<{
        date: string;
        hasCheckIn: boolean;
    }[]>;
    createMakeUpCheckIn(userId: number, checkInDate: string): Promise<Task>;
    getRecentTaskStats(userId: number, days?: number): Promise<Array<{
        date: string;
        time: string;
        totalTasks: number;
        勤政Tasks: number;
        恕己Tasks: number;
        爱人Tasks: number;
    }>>;
    getCompletionStats(userId: number): Promise<{
        weeklyStats: {
            completionRate: number;
            overdueRate: number;
            totalTasks: number;
        };
        trendData: Array<{
            week: string;
            completionRate: number;
            overdueRate: number;
        }>;
    }>;
}
export default TaskService;
//# sourceMappingURL=task.service.d.ts.map