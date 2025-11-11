import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { FocusPeriodController } from '../controllers/focus-period.controller';
import { HabitAnalysisController } from '../controllers/habit-analysis.controller';
import { 
  createTaskValidation,
  updateTaskValidation,
  deleteTaskValidation,
  taskIdParamValidation,
  batchTaskValidation,
  taskQueryValidation,
  taskStatsValidation,
  createPomodoroSessionValidation,
  validateTaskRequest
} from '../utils/task-validators';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const taskController = new TaskController();
const focusPeriodController = new FocusPeriodController();
const habitAnalysisController = new HabitAnalysisController();

/**
 * 任务管理路由
 */

// 获取用户任务列表 - GET /api/tasks
router.get(
  '/',
  authenticateToken,
  rateLimiter('tasks', 100, 60 * 1000), // 1分钟内最多100次
  taskQueryValidation,
  taskController.getUserTasks
);

// 创建新任务 - POST /api/tasks
router.post(
  '/',
  authenticateToken,
  rateLimiter('create-task', 20, 60 * 1000), // 1分钟内最多20次
  createTaskValidation,
  validateTaskRequest,
  taskController.createTask
);

// 创建办公室任务 - POST /api/tasks/office
router.post(
  '/office',
  authenticateToken,
  rateLimiter('create-office-task', 20, 60 * 1000), // 1分钟内最多20次
  createTaskValidation,
  validateTaskRequest,
  taskController.createOfficeTask
);

// 获取任务统计信息 - GET /api/tasks/stats
router.get(
  '/stats',
  authenticateToken,
  rateLimiter('task-stats', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getTaskStats
);

// 获取任务分析数据 - GET /api/tasks/analytics
router.get(
  '/analytics',
  authenticateToken,
  rateLimiter('task-analytics', 30, 60 * 1000), // 1分钟内最多30次
  taskStatsValidation,
  validateTaskRequest,
  taskController.getTaskAnalytics
);

// 搜索任务 - GET /api/tasks/search
router.get(
  '/search',
  authenticateToken,
  rateLimiter('search-tasks', 50, 60 * 1000), // 1分钟内最多50次
  taskController.searchTasks
);

// 获取即将到期的任务 - GET /api/tasks/upcoming
router.get(
  '/upcoming',
  authenticateToken,
  rateLimiter('upcoming-tasks', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getUpcomingTasks
);

// 获取逾期任务 - GET /api/tasks/overdue
router.get(
  '/overdue',
  authenticateToken,
  rateLimiter('overdue-tasks', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getOverdueTasks
);

// 归档已完成任务 - POST /api/tasks/archive
router.post(
  '/archive',
  authenticateToken,
  rateLimiter('archive-tasks', 10, 60 * 1000), // 1分钟内最多10次
  taskController.archiveCompletedTasks
);

// 批量操作任务 - POST /api/tasks/batch
router.post(
  '/batch',
  authenticateToken,
  rateLimiter('batch-tasks', 10, 60 * 1000), // 1分钟内最多10次
  batchTaskValidation,
  validateTaskRequest,
  taskController.batchOperateTasks
);

/**
 * 番茄钟功能路由（必须放在动态路由之前）
 */

// 创建番茄钟会话 - POST /api/tasks/pomodoro
router.post(
  '/pomodoro',
  authenticateToken,
  rateLimiter('create-pomodoro', 10, 60 * 1000), // 1分钟内最多10次
  createPomodoroSessionValidation,
  validateTaskRequest,
  taskController.createPomodoroSession
);

// 完成番茄钟会话 - PATCH /api/tasks/pomodoro/:sessionId/complete
router.patch(
  '/pomodoro/:sessionId/complete',
  authenticateToken,
  rateLimiter('complete-pomodoro', 20, 60 * 1000), // 1分钟内最多20次
  taskController.completePomodoroSession
);

// 结束番茄钟会话（支持多种场景） - PATCH /api/tasks/pomodoro/:sessionId/end
router.patch(
  '/pomodoro/:sessionId/end',
  authenticateToken,
  rateLimiter('end-pomodoro', 30, 60 * 1000), // 1分钟内最多30次
  taskController.endPomodoroSession
);

// 获取番茄钟会话列表 - GET /api/tasks/pomodoro
router.get(
  '/pomodoro',
  authenticateToken,
  rateLimiter('get-pomodoro-sessions', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getPomodoroSessions
);

// 获取活跃番茄钟会话 - GET /api/tasks/pomodoro/active
router.get(
  '/pomodoro/active',
  authenticateToken,
  rateLimiter('get-active-pomodoro', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getActivePomodoroSession
);

// 获取番茄钟统计信息 - GET /api/tasks/pomodoro/stats
router.get(
  '/pomodoro/stats',
  authenticateToken,
  rateLimiter('pomodoro-stats', 30, 60 * 1000), // 1分钟内最多30次
  taskController.getPomodoroStats
);

/**
 * 日历打卡相关路由
 */

// 获取打卡日历数据 - GET /api/tasks/calendar/checkins
router.get(
  '/calendar/checkins',
  authenticateToken,
  rateLimiter('calendar-checkins', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getCalendarCheckIns
);

// 补打卡 - POST /api/tasks/calendar/makeup
router.post(
  '/calendar/makeup',
  authenticateToken,
  rateLimiter('makeup-checkin', 5, 60 * 1000), // 1分钟内最多5次
  taskController.createMakeUpCheckIn
);

// 获取近期任务统计 - GET /api/tasks/calendar/recent-stats
router.get(
  '/calendar/recent-stats',
  authenticateToken,
  rateLimiter('recent-stats', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getRecentTaskStats
);

// 获取完成度统计数据 - GET /api/tasks/completion/stats
router.get(
  '/completion/stats',
  authenticateToken,
  rateLimiter('completion-stats', 50, 60 * 1000), // 1分钟内最多50次
  taskController.getCompletionStats
);

/**
 * 细分时间段（Focus Periods）路由
 */

// 开始新的细分时间段 - POST /api/tasks/pomodoro/:sessionId/periods/start
router.post(
  '/pomodoro/:sessionId/periods/start',
  authenticateToken,
  rateLimiter('start-focus-period', 30, 60 * 1000), // 1分钟内最多30次
  focusPeriodController.startPeriod
);

// 结束细分时间段 - POST /api/tasks/pomodoro/:sessionId/periods/:periodId/end
router.post(
  '/pomodoro/:sessionId/periods/:periodId/end',
  authenticateToken,
  rateLimiter('end-focus-period', 30, 60 * 1000), // 1分钟内最多30次
  focusPeriodController.endPeriod
);

// 获取会话的所有细分时间段 - GET /api/tasks/pomodoro/:sessionId/periods
router.get(
  '/pomodoro/:sessionId/periods',
  authenticateToken,
  rateLimiter('get-focus-periods', 50, 60 * 1000), // 1分钟内最多50次
  focusPeriodController.getSessionPeriods
);

// 获取当前活跃的细分时间段 - GET /api/tasks/pomodoro/:sessionId/periods/active
router.get(
  '/pomodoro/:sessionId/periods/active',
  authenticateToken,
  rateLimiter('get-active-focus-period', 50, 60 * 1000), // 1分钟内最多50次
  focusPeriodController.getActivePeriod
);

// 获取会话的细分时间段统计 - GET /api/tasks/pomodoro/:sessionId/periods/stats
router.get(
  '/pomodoro/:sessionId/periods/stats',
  authenticateToken,
  rateLimiter('get-focus-period-stats', 30, 60 * 1000), // 1分钟内最多30次
  focusPeriodController.getSessionPeriodStats
);

// 获取专注度统计数据 - GET /api/tasks/pomodoro/focus-stats
router.get(
  '/pomodoro/focus-stats',
  authenticateToken,
  rateLimiter('focus-stats', 50, 60 * 1000), // 1分钟内最多50次
  focusPeriodController.getFocusStats
);

// 获取习惯分析统计数据 - GET /api/tasks/pomodoro/habit-stats
router.get(
  '/pomodoro/habit-stats',
  authenticateToken,
  rateLimiter('habit-stats', 50, 60 * 1000), // 1分钟内最多50次
  habitAnalysisController.getHabitStats
);

/**
 * 任务完成状态更新路由（番茄钟场景）
 */

// 更新任务完成状态（番茄钟场景） - POST /api/tasks/:taskId/pomodoro/:sessionId/complete
router.post(
  '/:taskId/pomodoro/:sessionId/complete',
  authenticateToken,
  rateLimiter('update-task-completion', 30, 60 * 1000), // 1分钟内最多30次
  taskController.updateTaskCompletionFromPomodoro
);

/**
 * 单个任务操作路由（动态路由必须放在固定路由之后）
 */

// 获取单个任务 - GET /api/tasks/:id
router.get(
  '/:id',
  authenticateToken,
  rateLimiter('get-task', 100, 60 * 1000), // 1分钟内最多100次
  taskIdParamValidation,
  validateTaskRequest,
  taskController.getTaskById
);

// 更新任务 - PATCH /api/tasks/:id
router.patch(
  '/:id',
  authenticateToken,
  rateLimiter('update-task', 30, 60 * 1000), // 1分钟内最多30次
  taskIdParamValidation,
  updateTaskValidation,
  validateTaskRequest,
  taskController.updateTask
);

// 删除任务 - DELETE /api/tasks/:id
router.delete(
  '/:id',
  authenticateToken,
  rateLimiter('delete-task', 20, 60 * 1000), // 1分钟内最多20次
  taskIdParamValidation,
  deleteTaskValidation,
  validateTaskRequest,
  taskController.deleteTask
);

// 完成任务（带总结） - PUT /api/tasks/:id/complete
router.put(
  '/:id/complete',
  authenticateToken,
  rateLimiter('complete-task', 20, 60 * 1000),
  taskIdParamValidation,
  validateTaskRequest,
  taskController.completeTask
);

export default router;