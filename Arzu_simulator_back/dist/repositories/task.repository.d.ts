import { Task, CreateTaskDto, UpdateTaskDto, TaskQueryParams, TaskStats, TaskAnalytics } from '../types/task.types';
export declare class TaskRepository {
    create(userId: number, taskData: CreateTaskDto): Promise<number>;
    findById(taskId: number): Promise<Task | undefined>;
    findByIdAndUserId(taskId: number, userId: number): Promise<Task | undefined>;
    findByUserId(userId: number, options?: TaskQueryParams): Promise<{
        tasks: Task[];
        total: number;
    }>;
    update(taskId: number, updateData: UpdateTaskDto): Promise<void>;
    delete(taskId: number): Promise<void>;
    deleteMany(taskIds: number[]): Promise<number>;
    updateManyStatus(taskIds: number[], completed: boolean): Promise<number>;
    incrementPomodoroCount(taskId: number): Promise<void>;
    getTaskStats(userId: number): Promise<TaskStats>;
    getTaskAnalytics(userId: number, days?: number): Promise<TaskAnalytics>;
    searchTasks(userId: number, query: string, limit?: number): Promise<Task[]>;
    getUpcomingTasks(userId: number, daysAhead?: number): Promise<Task[]>;
    getOverdueTasks(userId: number): Promise<Task[]>;
    archiveCompletedTasks(userId: number, daysOld?: number): Promise<number>;
    softDelete(taskId: number, userId: number): Promise<boolean>;
    restore(taskId: number, userId: number): Promise<boolean>;
    findDeleted(userId: number, options?: TaskQueryParams): Promise<{
        tasks: Task[];
        total: number;
    }>;
    permanentDelete(taskId: number, userId: number): Promise<boolean>;
    updateTaskCompletionFromPomodoro(taskId: number, sessionId: number, data: {
        markAsCompleted: boolean;
        completedAt?: string;
    }): Promise<void>;
    getCompletedDates(userId: number, startDate: string, endDate: string): Promise<string[]>;
    getUserRewardCount(userId: number): Promise<{
        user_id: number;
        reward_count: number;
    }>;
    incrementRewardCount(userId: number): Promise<void>;
    createMakeUpCheckIn(userId: number, taskData: CreateTaskDto, completedAt: string, deletedAt: string): Promise<number>;
    getRecentTaskStats(userId: number, days: number): Promise<Array<{
        date: string;
        time: string;
        totalTasks: number;
        勤政Tasks: number;
        恕己Tasks: number;
        爱人Tasks: number;
    }>>;
    getTasksByDateRange(userId: number, startDate: string, endDate: string): Promise<Task[]>;
}
export default TaskRepository;
//# sourceMappingURL=task.repository.d.ts.map