export type TaskCategory = '勤政' | '恕己' | '爱人';
export type TaskPriority = '金' | '银' | '铜' | '石';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export interface Task {
    id: number;
    userId: number;
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    completed: boolean;
    completedAt?: string;
    focusTime?: number;
    pomodoroCount: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateTaskDto {
    title: string;
    description?: string;
    category?: TaskCategory;
    priority?: TaskPriority;
    dueDate?: string;
    alarm?: string;
    repeatDays?: number;
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    category?: TaskCategory;
    priority?: TaskPriority;
    completed?: boolean;
    dueDate?: string;
    alarm?: string;
    changeReason?: string;
}
export interface TaskFilterOptions {
    category?: TaskCategory;
    priority?: TaskPriority;
    completed?: boolean;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
}
export interface TaskSortOptions {
    sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'category' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export interface TaskStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    tasksByCategory: Record<TaskCategory, number>;
    tasksByPriority: Record<TaskPriority, number>;
    tasksByStatus: Record<TaskStatus, number>;
    pomodoroCount: number;
}
export interface TaskListResponse {
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface PomodoroSession {
    id: number;
    userId: number;
    taskId?: number;
    durationMinutes: number;
    completed: boolean;
    startedAt: string;
    completedAt?: string;
}
export interface CreatePomodoroSessionDto {
    taskId?: number;
    durationMinutes?: number;
}
export interface TaskWithPomodoro extends Task {
    pomodoroSessions: PomodoroSession[];
}
export interface TaskAnalytics {
    dailyStats: {
        date: string;
        completedTasks: number;
        createdTasks: number;
        pomodoroSessions: number;
    }[];
    categoryDistribution: Record<TaskCategory, number>;
    priorityDistribution: Record<TaskPriority, number>;
    completionRate: number;
    averageCompletionTime?: number;
    mostProductiveHour?: number;
    streakDays: number;
}
export interface TaskReminder {
    id: number;
    taskId: number;
    userId: number;
    reminderTime: string;
    type: 'due_date' | 'custom';
    message?: string;
    isActive: boolean;
    createdAt: string;
}
export interface TaskExportData {
    version: string;
    exportDate: string;
    userId: number;
    tasks: Task[];
    pomodoroSessions: PomodoroSession[];
    reminders: TaskReminder[];
}
export interface BatchOperationResult {
    success: boolean;
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{
        id: number;
        error: string;
    }>;
}
export interface TaskQueryParams extends TaskFilterOptions, TaskSortOptions {
    page?: number;
    limit?: number;
    includeCompleted?: boolean;
    includeOverdue?: boolean;
}
export type BatchTaskOperation = 'complete' | 'delete' | 'update_category' | 'update_priority' | 'update_due_date' | 'archive';
export interface BatchTaskOperationDto {
    operation: BatchTaskOperation;
    taskIds: number[];
    data?: {
        category?: TaskCategory;
        priority?: TaskPriority;
        dueDate?: string;
    };
}
export interface TaskStatsQuery {
    dateFrom?: string;
    dateTo?: string;
    category?: TaskCategory;
    priority?: TaskPriority;
    includeCompleted?: boolean;
}
export interface TaskRecommendation {
    taskId: number;
    title: string;
    reason: string;
    score: number;
    type: 'urgent' | 'important' | 'overdue' | 'streak' | 'productivity';
}
//# sourceMappingURL=task.types.d.ts.map