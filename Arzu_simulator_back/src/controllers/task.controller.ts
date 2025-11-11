import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { TaskService } from '../services/task.service';
import { ApiError, ValidationError, NotFoundError, AuthorizationError } from '../utils/error.utils';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/error.utils';
import { AuthRequest } from './auth.controller';
import { CreateTaskDto, UpdateTaskDto, TaskQueryParams, BatchTaskOperationDto } from '../types/task.types';
import { getErrorMessage } from '../utils/error-handler';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * 创建任务
   */
  createTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.info('收到创建任务请求', { 
      userId, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const taskData: CreateTaskDto = req.body;

    try {
      // 调用服务层创建任务
      const task = await this.taskService.createTask(userId, taskData);

      // 记录成功日志
      logger.info('任务创建成功', { 
        taskId: task.id, 
        userId, 
        title: task.title,
        category: task.category,
        priority: task.priority
      });

      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '任务创建成功',
        data: task
      });

    } catch (error) {
      // 记录失败日志
      logger.error('任务创建失败', { 
        userId, 
        taskData, 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 创建办公室任务（自动设置DDL为1小时后）
   */
  createOfficeTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.info('收到创建办公室任务请求', { 
      userId, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const { title, description, category, priority } = req.body;

    try {
      // 调用服务层创建办公室任务
      const task = await this.taskService.createOfficeTask(userId, {
        title,
        description,
        category,
        priority
      });

      // 记录成功日志
      logger.info('办公室任务创建成功', { 
        taskId: task.id, 
        userId, 
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate
      });

      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '办公室任务创建成功',
        data: task
      });

    } catch (error) {
      // 记录失败日志
      logger.error('办公室任务创建失败', { 
        userId, 
        taskData: { title, description, category, priority }, 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 获取用户任务列表
   */
  getUserTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.debug('收到获取用户任务列表请求', { 
      userId, 
      query: req.query,
      ip: req.ip 
    });

    try {
      // 构建查询参数
      const queryParams: TaskQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        category: req.query.category as any,
        priority: req.query.priority as any,
        completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
        search: req.query.search as string,
        dueDateFrom: req.query.dueDateFrom as string,
        dueDateTo: req.query.dueDateTo as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        includeCompleted: req.query.includeCompleted !== 'false',
        includeOverdue: req.query.includeOverdue !== 'false'
      };

      // 调用服务层获取任务列表
      const result = await this.taskService.getUserTasks(userId, queryParams);

      // 计算总页数
      const totalPages = Math.ceil(result.total / queryParams.limit!);

      logger.debug('用户任务列表获取成功', { 
        userId, 
        total: result.total, 
        count: result.tasks.length,
        page: queryParams.page,
        limit: queryParams.limit
      });

      // 返回成功响应
      res.json({
        success: true,
        data: {
          tasks: result.tasks,
          pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total: result.total,
            totalPages,
            hasNext: queryParams.page! < totalPages,
            hasPrev: queryParams.page! > 1
          }
        }
      });

    } catch (error) {
      logger.error('获取用户任务列表失败', { 
        userId, 
        query: req.query,
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 获取单个任务
   */
  getTaskById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);
    
    logger.debug('收到获取任务请求', { userId, taskId, ip: req.ip });

    try {
      // 调用服务层获取任务
      const task = await this.taskService.getTaskById(userId, taskId);

      logger.debug('任务获取成功', { taskId, userId, title: task.title });

      // 返回成功响应
      res.json({
        success: true,
        data: task
      });

    } catch (error) {
      logger.error('获取任务失败', { userId, taskId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 更新任务
   */
  updateTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);
    
    logger.info('收到更新任务请求', { userId, taskId, ip: req.ip });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const updateData: UpdateTaskDto = req.body;

    try {
      // 调用服务层更新任务
      const updatedTask = await this.taskService.updateTask(userId, taskId, updateData);

      logger.info('任务更新成功', { 
        taskId, 
        userId, 
        title: updatedTask.title,
        updatedFields: Object.keys(updateData)
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '任务更新成功',
        data: updatedTask
      });

    } catch (error) {
      logger.error('更新任务失败', { userId, taskId, updateData, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 删除任务
   */
  deleteTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);
    const { deleteReason } = req.body;
    
    logger.info('收到删除任务请求', { userId, taskId, deleteReason, ip: req.ip });

    try {
      // 调用服务层删除任务
      await this.taskService.deleteTask(userId, taskId, deleteReason);

      logger.info('任务删除成功', { taskId, userId });

      // 返回成功响应
      res.json({
        success: true,
        message: '任务删除成功'
      });

    } catch (error) {
      logger.error('删除任务失败', { userId, taskId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 批量操作任务
   */
  batchOperateTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.info('收到批量操作任务请求', { userId, ip: req.ip });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const operationData: BatchTaskOperationDto = req.body;

    try {
      // 调用服务层执行批量操作
      const result = await this.taskService.batchOperateTasks(userId, operationData);

      logger.info('批量操作任务完成', { 
        userId, 
        operation: operationData.operation,
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '批量操作完成',
        data: result
      });

    } catch (error) {
      logger.error('批量操作任务失败', { 
        userId, 
        operationData, 
        ip: req.ip,
        error: getErrorMessage(error) 
      });
      
      throw error;
    }
  });

  /**
   * 获取任务统计信息
   */
  getTaskStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.debug('收到获取任务统计请求', { userId, ip: req.ip });

    try {
      // 调用服务层获取任务统计
      const stats = await this.taskService.getTaskStats(userId);

      logger.debug('任务统计获取成功', { userId, stats });

      // 返回成功响应
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取任务统计失败', { userId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 获取任务分析数据
   */
  getTaskAnalytics = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    
    logger.debug('收到获取任务分析数据请求', { userId, days, ip: req.ip });

    try {
      // 验证天数参数
      if (days < 1 || days > 365) {
        throw new ValidationError('天数必须在1-365之间');
      }

      // 调用服务层获取任务分析数据
      const analytics = await this.taskService.getTaskAnalytics(userId, days);

      logger.debug('任务分析数据获取成功', { userId, days });

      // 返回成功响应
      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('获取任务分析数据失败', { userId, days, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 搜索任务
   */
  searchTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.debug('收到搜索任务请求', { userId, query, limit, ip: req.ip });

    try {
      // 验证查询参数
      if (!query || query.trim().length === 0) {
        throw new ValidationError('搜索关键词不能为空');
      }

      if (query.length > 100) {
        throw new ValidationError('搜索关键词长度不能超过100个字符');
      }

      if (limit < 1 || limit > 50) {
        throw new ValidationError('结果数量必须在1-50之间');
      }

      // 调用服务层搜索任务
      const tasks = await this.taskService.searchTasks(userId, query, limit);

      logger.debug('任务搜索成功', { userId, query, resultCount: tasks.length });

      // 返回成功响应
      res.json({
        success: true,
        data: {
          tasks,
          query,
          resultCount: tasks.length
        }
      });

    } catch (error) {
      logger.error('搜索任务失败', { userId, query, limit, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 获取即将到期的任务
   */
  getUpcomingTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const daysAhead = parseInt(req.query.days as string) || 7;
    
    logger.debug('收到获取即将到期任务请求', { userId, daysAhead, ip: req.ip });

    try {
      // 验证天数参数
      if (daysAhead < 1 || daysAhead > 365) {
        throw new ValidationError('天数必须在1-365之间');
      }

      // 调用服务层获取即将到期任务
      const tasks = await this.taskService.getUpcomingTasks(userId, daysAhead);

      logger.debug('即将到期任务获取成功', { userId, daysAhead, taskCount: tasks.length });

      // 返回成功响应
      res.json({
        success: true,
        data: {
          tasks,
          daysAhead,
          taskCount: tasks.length
        }
      });

    } catch (error) {
      logger.error('获取即将到期任务失败', { userId, daysAhead, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 获取逾期任务
   */
  getOverdueTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.debug('收到获取逾期任务请求', { userId, ip: req.ip });

    try {
      // 调用服务层获取逾期任务
      const tasks = await this.taskService.getOverdueTasks(userId);

      logger.debug('逾期任务获取成功', { userId, taskCount: tasks.length });

      // 返回成功响应
      res.json({
        success: true,
        data: {
          tasks,
          taskCount: tasks.length
        }
      });

    } catch (error) {
      logger.error('获取逾期任务失败', { userId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 归档已完成任务
   */
  archiveCompletedTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const daysOld = parseInt(req.query.days as string) || 30;
    
    logger.info('收到归档已完成任务请求', { userId, daysOld, ip: req.ip });

    try {
      // 验证天数参数
      if (daysOld < 1 || daysOld > 365) {
        throw new ValidationError('天数必须在1-365之间');
      }

      // 调用服务层归档已完成任务
      const archivedCount = await this.taskService.archiveCompletedTasks(userId, daysOld);

      logger.info('归档已完成任务完成', { userId, daysOld, archivedCount });

      // 返回成功响应
      res.json({
        success: true,
        message: `成功归档 ${archivedCount} 个任务`,
        data: {
          archivedCount,
          daysOld
        }
      });

    } catch (error) {
      logger.error('归档已完成任务失败', { userId, daysOld, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 创建番茄钟会话
   */
  createPomodoroSession = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.info('收到创建番茄钟会话请求', { userId, ip: req.ip });

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('输入验证失败', errors.array());
    }

    const sessionData = req.body;

    try {
      // 调用服务层创建番茄钟会话
      const session = await this.taskService.createPomodoroSession(userId, sessionData);

      logger.info('番茄钟会话创建成功', { 
        sessionId: session.id, 
        userId, 
        taskId: session.taskId,
        durationMinutes: session.durationMinutes
      });

      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '番茄钟会话创建成功',
        data: session
      });

    } catch (error) {
      logger.error('创建番茄钟会话失败', { userId, sessionData, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 完成番茄钟会话
   */
  completePomodoroSession = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.sessionId);
    
    logger.info('收到完成番茄钟会话请求', { userId, sessionId, ip: req.ip });

    try {
      // 调用服务层完成番茄钟会话
      const session = await this.taskService.completePomodoroSession(userId, sessionId);

      logger.info('番茄钟会话完成成功', { 
        sessionId, 
        userId, 
        taskId: session.taskId,
        completedAt: session.completedAt
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '番茄钟会话完成成功',
        data: session
      });

    } catch (error) {
      logger.error('完成番茄钟会话失败', { userId, sessionId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 结束番茄钟会话（支持多种场景）
   * Body: { completed: boolean, completedAt?: string, updateDuration?: boolean }
   */
  endPomodoroSession = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.sessionId);
    const { completed, completedAt, updateDuration } = req.body;
    
    logger.info('收到结束番茄钟会话请求', { 
      userId, 
      sessionId, 
      completed, 
      updateDuration,
      ip: req.ip 
    });

    try {
      // 调用服务层结束番茄钟会话
      const session = await this.taskService.endPomodoroSession(userId, sessionId, {
        completed,
        completedAt,
        updateDuration
      });

      logger.info('番茄钟会话结束成功', { 
        sessionId, 
        userId, 
        completed,
        completedAt: session.completedAt
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '番茄钟会话已结束',
        data: session
      });

    } catch (error) {
      logger.error('结束番茄钟会话失败', { 
        userId, 
        sessionId, 
        ip: req.ip, 
        error: getErrorMessage(error) 
      });
      throw error;
    }
  });

  /**
   * 获取番茄钟会话列表
   */
  getPomodoroSessions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const options = {
      taskId: req.query.taskId ? parseInt(req.query.taskId as string) : undefined,
      completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };
    
    logger.debug('收到获取番茄钟会话列表请求', { userId, options, ip: req.ip });

    try {
      // 调用服务层获取番茄钟会话列表
      const result = await this.taskService.getPomodoroSessions(userId, options);

      logger.debug('番茄钟会话列表获取成功', { 
        userId, 
        total: result.total, 
        count: result.sessions.length 
      });

      // 返回成功响应
      res.json({
        success: true,
        data: {
          sessions: result.sessions,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / options.limit),
            hasNext: options.page < Math.ceil(result.total / options.limit),
            hasPrev: options.page > 1
          }
        }
      });

    } catch (error) {
      logger.error('获取番茄钟会话列表失败', { userId, options, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 获取番茄钟统计信息
   */
  getPomodoroStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    
    logger.debug('收到获取番茄钟统计请求', { userId, days, ip: req.ip });

    try {
      // 验证天数参数
      if (days < 1 || days > 365) {
        throw new ValidationError('天数必须在1-365之间');
      }

      // 调用服务层获取番茄钟统计
      const stats = await this.taskService.getPomodoroStats(userId, days);

      logger.debug('番茄钟统计获取成功', { userId, days, stats });

      // 返回成功响应
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取番茄钟统计失败', { userId, days, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 获取活跃番茄钟会话
   */
  getActivePomodoroSession = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.debug('收到获取活跃番茄钟会话请求', { userId, ip: req.ip });

    try {
      // 调用服务层获取活跃番茄钟会话
      const session = await this.taskService.getActivePomodoroSession(userId);

      logger.debug('活跃番茄钟会话获取成功', { userId, hasActiveSession: !!session });

      // 返回成功响应
      res.json({
        success: true,
        data: {
          session,
          hasActiveSession: !!session
        }
      });

    } catch (error) {
      logger.error('获取活跃番茄钟会话失败', { userId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 更新任务完成状态（番茄钟场景）
   * POST /api/tasks/:taskId/pomodoro/:sessionId/complete
   * Body: { markAsCompleted: boolean, completedAt?: string }
   */
  updateTaskCompletionFromPomodoro = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.taskId);
    const sessionId = parseInt(req.params.sessionId);
    const { markAsCompleted, completedAt } = req.body;

    logger.info('收到更新任务完成状态请求（番茄钟）', {
      userId,
      taskId,
      sessionId,
      markAsCompleted,
      ip: req.ip
    });

    try {
      // 验证输入
      if (typeof markAsCompleted !== 'boolean') {
        throw new ValidationError('markAsCompleted 必须为布尔值');
      }

      // 调用服务层更新任务完成状态
      const updatedTask = await this.taskService.updateTaskCompletionFromPomodoro(
        userId,
        taskId,
        sessionId,
        markAsCompleted,
        completedAt
      );

      logger.info('任务完成状态更新成功（番茄钟）', {
        taskId,
        sessionId,
        userId,
        markAsCompleted,
        focusTime: updatedTask.focusTime,
        pomodoroCount: updatedTask.pomodoroCount
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '任务完成状态更新成功',
        data: updatedTask
      });
    } catch (error) {
      logger.error('更新任务完成状态失败（番茄钟）', {
        userId,
        taskId,
        sessionId,
        ip: req.ip,
        error: getErrorMessage(error)
      });
      throw error;
    }
  });

  getCalendarCheckIns = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    logger.info('获取打卡日历数据', { userId, year, month, ip: req.ip });

    try {
      if (month < 1 || month > 12) {
        throw new ValidationError('月份必须在1-12之间');
      }

      const checkIns = await this.taskService.getCalendarCheckIns(userId, year, month);
      const user = await this.taskService.taskRepository.getUserRewardCount(userId);

      res.json({
        success: true,
        message: '获取打卡日历数据成功',
        data: {
          checkIns,
          remainingMakeUps: 2 - user.reward_count
        }
      });
    } catch (error) {
      logger.error('获取打卡日历数据失败', { userId, year, month, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  createMakeUpCheckIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const { checkInDate } = req.body;

    logger.info('收到补打卡请求', { userId, checkInDate, ip: req.ip });

    try {
      if (!checkInDate) {
        throw new ValidationError('补打卡日期不能为空');
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(checkInDate)) {
        throw new ValidationError('日期格式错误，应为YYYY-MM-DD');
      }

      const task = await this.taskService.createMakeUpCheckIn(userId, checkInDate);

      logger.info('补打卡成功', { userId, checkInDate, taskId: task.id });

      res.status(201).json({
        success: true,
        message: '补打卡成功',
        data: task
      });
    } catch (error) {
      logger.error('补打卡失败', { userId, checkInDate, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  getRecentTaskStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 7;

    logger.info('获取近期任务统计', { userId, days, ip: req.ip });

    try {
      if (days < 1 || days > 30) {
        throw new ValidationError('天数必须在1-30之间');
      }

      const stats = await this.taskService.getRecentTaskStats(userId, days);

      res.json({
        success: true,
        message: '获取近期任务统计成功',
        data: stats
      });
    } catch (error) {
      logger.error('获取近期任务统计失败', { userId, days, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  getCompletionStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;

    logger.info('获取完成度统计数据', { userId, ip: req.ip });

    try {
      const stats = await this.taskService.getCompletionStats(userId);

      res.json({
        success: true,
        message: '获取完成度统计数据成功',
        data: stats
      });
    } catch (error) {
      logger.error('获取完成度统计数据失败', { userId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });

  /**
   * 完成任务（简化版，仅标记为已完成）
   * PUT /api/tasks/:id/complete
   */
  completeTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id);

    logger.info('收到任务完成请求', { userId, taskId, ip: req.ip });

    try {
      // 调用任务服务更新任务为已完成
      const task = await this.taskService.taskRepository.findById(taskId);
      
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      if (task.userId !== userId) {
        throw new AuthorizationError('无权操作此任务');
      }

      if (task.completed) {
        throw new ValidationError('任务已经完成');
      }

      // 更新任务状态
      const completedAt = new Date().toISOString();
      await this.taskService.taskRepository.update(taskId, {
        completed: true,
        completedAt: completedAt
      });

      logger.info('任务已标记为完成', { userId, taskId });

      res.json({
        success: true,
        message: '任务已完成',
        data: {
          taskId,
          completed: true,
          completedAt
        }
      });
    } catch (error) {
      logger.error('完成任务失败', { userId, taskId, ip: req.ip, error: getErrorMessage(error) });
      throw error;
    }
  });
}

export default TaskController;