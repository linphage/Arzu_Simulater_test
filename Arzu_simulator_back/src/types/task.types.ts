// 任务分类（三维分类：勤政、恕己、爱人）
export type TaskCategory = '勤政' | '恕己' | '爱人';

// 任务优先级（四级优先级：金、银、铜、石）
export type TaskPriority = '金' | '银' | '铜' | '石';

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// 基础任务接口
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
  dueDate?: string; // ISO 8601格式
  repeatDays?: string | number; // JSON数组字符串 或 数字（兼容旧数据）
  parentTaskId?: number | null; // 父任务ID（模板任务为null，实例任务指向模板）
  createdAt: string;
  updatedAt: string;
}

// 创建任务DTO
export interface CreateTaskDto {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string; // ISO 8601格式
  alarm?: string; // ISO 8601格式 - 提醒时间
  repeatDays?: number | string | number[]; // 支持多种格式：数字、JSON字符串、数组
}

// 更新任务DTO
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  completed?: boolean;
  completedAt?: string; // ISO 8601格式 - 完成时间
  dueDate?: string; // ISO 8601格式
  alarm?: string; // ISO 8601格式 - 提醒时间
  repeatDays?: number | string | number[]; // 支持多种格式
  changeReason?: string; // 修改原因（用于记录到brieflogs）
}

// 任务过滤选项
export interface TaskFilterOptions {
  category?: TaskCategory;
  priority?: TaskPriority;
  completed?: boolean;
  dueDateFrom?: string; // ISO 8601格式
  dueDateTo?: string; // ISO 8601格式
  search?: string; // 搜索关键词
}

// 任务排序选项
export interface TaskSortOptions {
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'category' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// 任务统计信息
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

// 任务列表响应
export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 番茄钟会话接口
export interface PomodoroSession {
  id: number;
  userId: number;
  taskId?: number;
  durationMinutes: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

// 创建番茄钟会话DTO
export interface CreatePomodoroSessionDto {
  taskId?: number;
  durationMinutes?: number;
}

// 任务与番茄钟关联数据
export interface TaskWithPomodoro extends Task {
  pomodoroSessions: PomodoroSession[];
}

// 任务分析数据
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
  averageCompletionTime?: number; // 平均完成时间（小时）
  mostProductiveHour?: number; // 最高效的小时（0-23）
  streakDays: number; // 连续完成任务天数
}

// 任务提醒配置
export interface TaskReminder {
  id: number;
  taskId: number;
  userId: number;
  reminderTime: string; // ISO 8601格式
  type: 'due_date' | 'custom';
  message?: string;
  isActive: boolean;
  createdAt: string;
}

// 任务导入/导出格式
export interface TaskExportData {
  version: string;
  exportDate: string;
  userId: number;
  tasks: Task[];
  pomodoroSessions: PomodoroSession[];
  reminders: TaskReminder[];
}

// 批量操作结果
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

// 任务查询参数
export interface TaskQueryParams extends TaskFilterOptions, TaskSortOptions {
  page?: number;
  limit?: number;
  includeCompleted?: boolean;
  includeOverdue?: boolean;
}

// 任务批量操作类型
export type BatchTaskOperation = 
  | 'complete'
  | 'delete' 
  | 'update_category'
  | 'update_priority'
  | 'update_due_date'
  | 'archive';

// 任务批量操作DTO
export interface BatchTaskOperationDto {
  operation: BatchTaskOperation;
  taskIds: number[];
  data?: {
    category?: TaskCategory;
    priority?: TaskPriority;
    dueDate?: string;
  };
}

// 任务统计查询参数
export interface TaskStatsQuery {
  dateFrom?: string;
  dateTo?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  includeCompleted?: boolean;
}

// 任务推荐配置
export interface TaskRecommendation {
  taskId: number;
  title: string;
  reason: string;
  score: number; // 0-100
  type: 'urgent' | 'important' | 'overdue' | 'streak' | 'productivity';
}