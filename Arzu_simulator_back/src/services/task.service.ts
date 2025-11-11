import { TaskRepository } from '../repositories/task.repository';
import { PomodoroRepository } from '../repositories/pomodoro.repository';
import { BriefLogRepository, CreateBriefLogDto, BriefType } from '../repositories/brieflog.repository';
import { TaskGenerationService } from './taskGeneration.service';
import { logger } from '../config/logger';
import { 
  Task, 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskQueryParams,
  TaskStats,
  TaskAnalytics,
  BatchOperationResult,
  BatchTaskOperationDto,
  TaskWithPomodoro,
  PomodoroSession,
  CreatePomodoroSessionDto
} from '../types/task.types';
import { ApiError, NotFoundError, ValidationError, isErrorWithName } from '../utils/error.utils';
import { executeTransaction } from '../database/connection';
import { getErrorMessage } from '../utils/error-handler';

export class TaskService {
  public taskRepository: TaskRepository;
  private pomodoroRepository: PomodoroRepository;
  private briefLogRepository: BriefLogRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.pomodoroRepository = new PomodoroRepository();
    this.briefLogRepository = new BriefLogRepository();
  }

  /**
   * 创建任务
   */
  /**
   * 将位掩码格式的 repeatDays 转换为数组格式
   * 例如: 124 (01111100) -> [2,3,4,5,6] (周二到周六)
   */
  private convertBitmaskToArray(bitmask: number): number[] {
    const days: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (bitmask & (1 << i)) {
        days.push(i);
      }
    }
    return days;
  }

  /**
   * 标准化 repeatDays 格式为数组
   */
  private normalizeRepeatDays(repeatDays: number | string | number[] | undefined): number[] | null {
    if (repeatDays === undefined || repeatDays === null || repeatDays === 0) {
      return null;
    }

    // 如果是数组，直接返回
    if (Array.isArray(repeatDays)) {
      return repeatDays.length > 0 ? repeatDays : null;
    }

    // 如果是字符串，尝试解析
    if (typeof repeatDays === 'string') {
      try {
        const parsed = JSON.parse(repeatDays);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch {
        return null;
      }
    }

    // 如果是数字，转换位掩码
    if (typeof repeatDays === 'number') {
      const converted = this.convertBitmaskToArray(repeatDays);
      return converted.length > 0 ? converted : null;
    }

    return null;
  }

  async createTask(userId: number, taskData: CreateTaskDto): Promise<Task> {
    try {
      logger.info('开始创建任务', { userId, taskData });

      // 验证任务数据
      this.validateTaskData(taskData);

      // 设置默认值
      const taskDataWithDefaults = {
        category: '勤政' as const,
        priority: '铜' as const,
        ...taskData
      };

      // 创建任务
      const taskId = await this.taskRepository.create(userId, taskDataWithDefaults);
      
      // 获取创建的任务
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new Error('任务创建成功但无法获取');
      }

      // 如果是重复任务，立即生成本周的实例
      if (taskData.repeatDays) {
        const repeatDaysArray = this.normalizeRepeatDays(taskData.repeatDays);
        
        if (repeatDaysArray && repeatDaysArray.length > 0) {
          logger.info('检测到重复任务，开始生成本周实例', { taskId, repeatDays: repeatDaysArray });
          
          try {
            await TaskGenerationService.generateWeeklyTasks(task, 'this_week');
            logger.info('本周任务实例生成成功', { taskId });
          } catch (genError) {
            logger.error('生成任务实例失败（但不影响模板创建）', { 
              taskId, 
              error: getErrorMessage(genError) 
            });
          }
        }
      }

      logger.info('任务创建成功', { 
        taskId, 
        userId, 
        title: task.title,
        category: task.category,
        priority: task.priority
      });

      return task;
    } catch (error) {
      logger.error('任务创建失败', { userId, taskData, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('任务创建失败', 500);
    }
  }

  /**
   * 创建办公室任务（自动设置DDL为1小时后）
   */
  async createOfficeTask(userId: number, taskData: { title: string; description?: string; category?: string; priority?: string }): Promise<Task> {
    try {
      logger.info('开始创建办公室任务', { userId, taskData });

      // 生成当前时间（东八区）+ 1小时
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const dueDate = oneHourLater.toISOString();

      // 构建完整的任务数据
      const fullTaskData: CreateTaskDto = {
        title: taskData.title,
        description: taskData.description,
        category: taskData.category as any || '勤政',
        priority: taskData.priority as any || '铜',
        dueDate: dueDate,
        alarm: dueDate, // alarm与dueDate一致
        repeatDays: 0    // 不重复
      };

      // 验证任务数据
      this.validateTaskData(fullTaskData);

      // 创建任务
      const taskId = await this.taskRepository.create(userId, fullTaskData);
      
      // 获取创建的任务
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new Error('办公室任务创建成功但无法获取');
      }

      logger.info('办公室任务创建成功', { 
        taskId, 
        userId, 
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate
      });

      return task;
    } catch (error) {
      logger.error('办公室任务创建失败', { userId, taskData, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('办公室任务创建失败', 500);
    }
  }

  /**
   * 获取用户任务列表
   */
  async getUserTasks(userId: number, options: TaskQueryParams = {}): Promise<{ tasks: Task[]; total: number }> {
    try {
      logger.debug('开始获取用户任务列表', { userId, options });

      // 设置默认分页参数
      const queryOptions = {
        page: 1,
        limit: 10,
        ...options
      };

      const result = await this.taskRepository.findByUserId(userId, queryOptions);

      logger.debug('用户任务列表获取成功', { 
        userId, 
        total: result.total, 
        count: result.tasks.length,
        page: queryOptions.page,
        limit: queryOptions.limit
      });

      return result;
    } catch (error) {
      logger.error('获取用户任务列表失败', { userId, options, error: getErrorMessage(error) });
      throw new ApiError('获取任务列表失败', 500);
    }
  }

  /**
   * 获取单个任务（带数据隔离验证）
   */
  async getTaskById(userId: number, taskId: number): Promise<Task> {
    try {
      logger.debug('开始获取任务', { userId, taskId });

      const task = await this.taskRepository.findByIdAndUserId(taskId, userId);
      
      if (!task) {
        throw new NotFoundError('任务不存在或无权限访问');
      }

      logger.debug('任务获取成功', { taskId, userId, title: task.title });
      return task;
    } catch (error) {
      logger.error('获取任务失败', { userId, taskId, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('获取任务失败', 500);
    }
  }

  /**
   * 更新任务（带数据隔离验证和变更日志记录）
   */
  async updateTask(userId: number, taskId: number, updateData: UpdateTaskDto): Promise<Task> {
    try {
      logger.info('开始更新任务', { userId, taskId, updateData });

      // 验证任务是否存在且属于当前用户
      const existingTask = await this.taskRepository.findByIdAndUserId(taskId, userId);
      if (!existingTask) {
        throw new NotFoundError('任务不存在或无权限访问');
      }

      // 验证更新数据
      this.validateUpdateData(updateData);

      // 提取changeReason并从updateData中移除（不存入tasks表）
      const changeReason = updateData.changeReason;
      const taskUpdateData = { ...updateData };
      delete taskUpdateData.changeReason;

      // 如果更新完成状态，记录完成时间
      if (updateData.completed === true && !existingTask.completed) {
        (taskUpdateData as any).completed_at = new Date().toISOString();
      }

      // 准备变更日志
      const briefLogs: CreateBriefLogDto[] = [];
      
      // 获取最近的番茄钟会话（如果有）
      let latestSessionId: number | undefined = undefined;
      try {
        const recentSessions = await this.pomodoroRepository.findByTaskId(taskId);
        if (recentSessions && recentSessions.length > 0) {
          latestSessionId = recentSessions[0].id;
        }
      } catch (error) {
        logger.debug('获取番茄钟会话失败，将不关联session_id', { taskId });
      }
      
      // 检测任务类型变更（category）
      if (updateData.category && updateData.category !== existingTask.category) {
        briefLogs.push({
          session_id: latestSessionId,
          task_id: taskId,
          user_id: userId,
          brief_type: BriefType.CATEGORY_CHANGE,
          brief_content: changeReason || `任务类型从 ${existingTask.category} 改为 ${updateData.category}`
        });
        logger.debug('检测到任务类型变更', { 
          from: existingTask.category, 
          to: updateData.category 
        });
      }

      // 检测优先级变更（priority）
      if (updateData.priority && updateData.priority !== existingTask.priority) {
        briefLogs.push({
          session_id: latestSessionId,
          task_id: taskId,
          user_id: userId,
          brief_type: BriefType.PRIORITY_CHANGE,
          brief_content: changeReason || `优先级从 ${existingTask.priority} 改为 ${updateData.priority}`
        });
        logger.debug('检测到优先级变更', { 
          from: existingTask.priority, 
          to: updateData.priority 
        });
      }

      // 检测截止时间变更（dueDate）
      // 规范化日期格式进行比较，避免格式差异导致的误判
      const normalizeDateString = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toISOString();
        } catch {
          return dateStr;
        }
      };

      const existingDueDate = normalizeDateString(existingTask.dueDate);
      const newDueDate = updateData.dueDate ? normalizeDateString(updateData.dueDate) : null;

      if (newDueDate && existingDueDate !== newDueDate) {
        // 计算原alarm与dueDate的差值
        if (existingTask.dueDate && (existingTask as any).alarm) {
          const oldDueTime = new Date(existingTask.dueDate).getTime();
          const oldAlarmTime = new Date((existingTask as any).alarm).getTime();
          const timeDifference = oldDueTime - oldAlarmTime; // 差值（毫秒）

          // 计算新的alarm时间
          const newDueTime = new Date(updateData.dueDate!).getTime();
          const newAlarmTime = newDueTime - timeDifference;
          (taskUpdateData as any).alarm = new Date(newAlarmTime).toISOString();
          
          logger.info('自动计算新的提醒时间', {
            oldDueDate: existingTask.dueDate,
            oldAlarm: (existingTask as any).alarm,
            newDueDate: updateData.dueDate,
            newAlarm: (taskUpdateData as any).alarm,
            timeDifference: `${timeDifference / 60000} 分钟`
          });
        }

        briefLogs.push({
          session_id: latestSessionId,
          task_id: taskId,
          user_id: userId,
          brief_type: BriefType.DUE_DATE_CHANGE,
          brief_content: changeReason || `截止时间从 ${existingTask.dueDate} 改为 ${updateData.dueDate}`
        });
        logger.debug('检测到截止时间变更', { 
          from: existingTask.dueDate, 
          to: updateData.dueDate 
        });
      }

      // 在事务中更新任务并记录日志
      await executeTransaction(async (db) => {
        // 更新任务
        await this.taskRepository.update(taskId, taskUpdateData);

        // 批量创建变更日志
        if (briefLogs.length > 0) {
          await this.briefLogRepository.createBatch(briefLogs);
          logger.info('任务变更日志已记录', { 
            taskId, 
            userId, 
            logCount: briefLogs.length,
            changeTypes: briefLogs.map(log => log.brief_type)
          });
        }
      });

      // 获取更新后的任务
      const updatedTask = await this.taskRepository.findById(taskId);
      if (!updatedTask) {
        throw new Error('任务更新成功但无法获取');
      }

      // 如果是模板任务且修改了重复相关字段，重新生成任务实例
      const isTemplate = !existingTask.parentTaskId; // 模板任务没有父任务
      const repeatFieldsChanged = updateData.repeatDays !== undefined || updateData.dueDate !== undefined;
      
      if (isTemplate && repeatFieldsChanged) {
        const repeatDays = updateData.repeatDays || existingTask.repeatDays;
        
        if (repeatDays) {
          const repeatDaysArray = typeof repeatDays === 'string'
            ? JSON.parse(repeatDays)
            : (typeof repeatDays === 'number' ? [repeatDays] : repeatDays);
          
          if (Array.isArray(repeatDaysArray) && repeatDaysArray.length > 0) {
            logger.info('模板任务更新，重新生成任务实例', { taskId, repeatDays: repeatDaysArray });
            
            try {
              // 先删除未来未完成的实例
              await TaskGenerationService.deleteFutureInstances(taskId, userId);
              
              // 重新生成本周任务
              await TaskGenerationService.generateWeeklyTasks(updatedTask, 'this_week');
              
              logger.info('任务实例重新生成成功', { taskId });
            } catch (genError) {
              logger.error('重新生成任务实例失败（但不影响模板更新）', { 
                taskId, 
                error: getErrorMessage(genError) 
              });
            }
          }
        }
      }

      logger.info('任务更新成功', { 
        taskId, 
        userId, 
        title: updatedTask.title,
        updatedFields: Object.keys(updateData)
      });

      return updatedTask;
    } catch (error) {
      logger.error('更新任务失败', { userId, taskId, updateData, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('更新任务失败', 500);
    }
  }

  /**
   * 删除任务（带数据隔离验证和删除日志记录）
   * @param deleteInstances 如果是模板任务，是否同时删除未来未完成的实例
   */
  async deleteTask(userId: number, taskId: number, deleteReason?: string, deleteInstances: boolean = false): Promise<void> {
    try {
      logger.info('开始删除任务', { userId, taskId, deleteReason, deleteInstances });

      // 验证任务是否存在且属于当前用户
      const existingTask = await this.taskRepository.findByIdAndUserId(taskId, userId);
      if (!existingTask) {
        throw new NotFoundError('任务不存在或无权限访问');
      }

      // 检查是否为模板任务
      const isTemplate = !existingTask.parentTaskId;

      // 获取最近的番茄钟会话（如果有）
      let latestSessionId: number | undefined = undefined;
      try {
        const recentSessions = await this.pomodoroRepository.findByTaskId(taskId);
        if (recentSessions && recentSessions.length > 0) {
          latestSessionId = recentSessions[0].id;
        }
      } catch (error) {
        logger.debug('获取番茄钟会话失败，将不关联session_id', { taskId });
      }

      // 在事务中删除任务及其相关数据并记录删除日志
      await executeTransaction(async (db) => {
        // 记录删除日志
        if (deleteReason) {
          await this.briefLogRepository.create({
            session_id: latestSessionId,
            task_id: taskId,
            user_id: userId,
            brief_type: BriefType.DELETE_REASON,
            brief_content: deleteReason
          });
          logger.info('删除原因已记录', { taskId, userId, deleteReason });
        }

        // 删除相关的番茄钟会话
        await this.pomodoroRepository.deleteByTaskId(taskId);
        
        // 软删除任务（设置 deleted_at）
        await this.taskRepository.delete(taskId);
      });

      // 如果是模板任务，且需要删除实例
      if (isTemplate && deleteInstances) {
        try {
          await TaskGenerationService.deleteTemplate(taskId, userId, true);
          logger.info('模板任务的未来实例已删除', { taskId });
        } catch (genError) {
          logger.error('删除模板任务实例失败', { 
            taskId, 
            error: getErrorMessage(genError) 
          });
        }
      }

      logger.info('任务删除成功', { taskId, userId, title: existingTask.title, isTemplate, deleteInstances });
    } catch (error) {
      logger.error('删除任务失败', { userId, taskId, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('删除任务失败', 500);
    }
  }

  /**
   * 批量操作任务
   */
  async batchOperateTasks(
    userId: number, 
    operationData: BatchTaskOperationDto
  ): Promise<BatchOperationResult> {
    try {
      const { operation, taskIds, data } = operationData;
      
      logger.info('开始批量操作任务', { userId, operation, taskCount: taskIds.length });

      // 验证所有任务都属于当前用户
      const tasks = await Promise.all(
        taskIds.map(taskId => this.taskRepository.findByIdAndUserId(taskId, userId))
      );

      const nonExistentTasks = taskIds.filter((_, index) => !tasks[index]);
      if (nonExistentTasks.length > 0) {
        throw new ValidationError('部分任务不存在或无权限访问', {
          nonExistentTasks
        });
      }

      let succeeded = 0;
      let failed = 0;
      const errors: Array<{ id: number; error: string }> = [];

      // 执行批量操作
      for (const taskId of taskIds) {
        try {
          switch (operation) {
            case 'complete':
              await this.taskRepository.update(taskId, { completed: true });
              break;
            
            case 'delete':
              await this.deleteTask(userId, taskId);
              break;
            
            case 'update_category':
              if (!data?.category) {
                throw new ValidationError('需要提供新的分类');
              }
              await this.taskRepository.update(taskId, { category: data.category });
              break;
            
            case 'update_priority':
              if (!data?.priority) {
                throw new ValidationError('需要提供新的优先级');
              }
              await this.taskRepository.update(taskId, { priority: data.priority });
              break;
            
            case 'update_due_date':
              if (!data?.dueDate) {
                throw new ValidationError('需要提供新的截止日期');
              }
              await this.taskRepository.update(taskId, { dueDate: data.dueDate });
              break;
            
            default:
              throw new ValidationError(`不支持的操作类型: ${operation}`);
          }
          
          succeeded++;
        } catch (error: any) {
          failed++;
          errors.push({
            id: taskId,
            error: getErrorMessage(error) || '操作失败'
          });
          
          logger.error(`批量操作失败 - 任务 ${taskId}`, { 
            taskId, 
            operation, 
            error: getErrorMessage(error) 
          });
        }
      }

      const result: BatchOperationResult = {
        success: failed === 0,
        processed: taskIds.length,
        succeeded,
        failed,
        errors
      };

      logger.info('批量操作任务完成', { 
        userId, 
        operation, 
        processed: taskIds.length,
        succeeded,
        failed 
      });

      return result;
    } catch (error) {
      logger.error('批量操作任务失败', { userId, operationData, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('批量操作失败', 500);
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(userId: number): Promise<TaskStats> {
    try {
      logger.debug('开始获取任务统计', { userId });

      const stats = await this.taskRepository.getTaskStats(userId);

      logger.debug('任务统计获取成功', { userId, stats });
      return stats;
    } catch (error) {
      logger.error('获取任务统计失败', { userId, error: getErrorMessage(error) });
      throw new ApiError('获取任务统计失败', 500);
    }
  }

  /**
   * 获取任务分析数据
   */
  async getTaskAnalytics(userId: number, days: number = 30): Promise<TaskAnalytics> {
    try {
      logger.debug('开始获取任务分析数据', { userId, days });

      const analytics = await this.taskRepository.getTaskAnalytics(userId, days);

      logger.debug('任务分析数据获取成功', { userId, days });
      return analytics;
    } catch (error) {
      logger.error('获取任务分析数据失败', { userId, days, error: getErrorMessage(error) });
      throw new ApiError('获取任务分析数据失败', 500);
    }
  }

  /**
   * 搜索任务
   */
  async searchTasks(userId: number, query: string, limit: number = 10): Promise<Task[]> {
    try {
      logger.debug('开始搜索任务', { userId, query, limit });

      const tasks = await this.taskRepository.searchTasks(userId, query, limit);

      logger.debug('任务搜索成功', { userId, query, resultCount: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('搜索任务失败', { userId, query, limit, error: getErrorMessage(error) });
      throw new ApiError('搜索任务失败', 500);
    }
  }

  /**
   * 获取即将到期的任务
   */
  async getUpcomingTasks(userId: number, daysAhead: number = 7): Promise<Task[]> {
    try {
      logger.debug('开始获取即将到期任务', { userId, daysAhead });

      const tasks = await this.taskRepository.getUpcomingTasks(userId, daysAhead);

      logger.debug('即将到期任务获取成功', { userId, daysAhead, taskCount: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('获取即将到期任务失败', { userId, daysAhead, error: getErrorMessage(error) });
      throw new ApiError('获取即将到期任务失败', 500);
    }
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(userId: number): Promise<Task[]> {
    try {
      logger.debug('开始获取逾期任务', { userId });

      const tasks = await this.taskRepository.getOverdueTasks(userId);

      logger.debug('逾期任务获取成功', { userId, taskCount: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('获取逾期任务失败', { userId, error: getErrorMessage(error) });
      throw new ApiError('获取逾期任务失败', 500);
    }
  }

  /**
   * 归档已完成任务
   */
  async archiveCompletedTasks(userId: number, daysOld: number = 30): Promise<number> {
    try {
      logger.info('开始归档已完成任务', { userId, daysOld });

      const archivedCount = await this.taskRepository.archiveCompletedTasks(userId, daysOld);

      logger.info('归档已完成任务完成', { userId, daysOld, archivedCount });
      return archivedCount;
    } catch (error) {
      logger.error('归档已完成任务失败', { userId, daysOld, error: getErrorMessage(error) });
      throw new ApiError('归档已完成任务失败', 500);
    }
  }

  /**
   * 创建番茄钟会话
   */
  async createPomodoroSession(userId: number, sessionData: CreatePomodoroSessionDto): Promise<PomodoroSession> {
    try {
      logger.info('开始创建番茄钟会话', { userId, sessionData });

      // 如果有任务ID，验证任务是否存在且属于当前用户
      if (sessionData.taskId) {
        const task = await this.taskRepository.findByIdAndUserId(sessionData.taskId, userId);
        if (!task) {
          throw new ValidationError('任务不存在或无权限访问');
        }
      }

      // 检查是否已有活跃的会话
      const activeSession = await this.pomodoroRepository.getActiveSession(userId);
      if (activeSession) {
        throw new ValidationError(`已有活跃的番茄钟会话（会话ID: ${activeSession.id}，开始时间: ${activeSession.startedAt}）`);
      }

      // 创建会话
      const sessionId = await this.pomodoroRepository.create(userId, sessionData);
      
      // 获取创建的会话
      const session = await this.pomodoroRepository.findById(sessionId);
      if (!session) {
        throw new Error('番茄钟会话创建成功但无法获取');
      }

      logger.info('番茄钟会话创建成功', { 
        sessionId, 
        userId, 
        taskId: sessionData.taskId,
        durationMinutes: session.durationMinutes
      });

      return session;
    } catch (error) {
      logger.error('创建番茄钟会话失败', { userId, sessionData, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('创建番茄钟会话失败', 500);
    }
  }

  /**
   * 完成番茄钟会话
   */
  async completePomodoroSession(userId: number, sessionId: number): Promise<PomodoroSession> {
    try {
      logger.info('开始完成番茄钟会话', { userId, sessionId });

      // 验证会话是否存在且属于当前用户
      const session = await this.pomodoroRepository.findByIdAndUserId(sessionId, userId);
      if (!session) {
        throw new NotFoundError('番茄钟会话不存在或无权限访问');
      }

      if (session.completed) {
        throw new ValidationError('番茄钟会话已完成');
      }

      // 在事务中完成会话并更新任务
      await executeTransaction(async (db) => {
        // 完成会话
        await this.pomodoroRepository.completeSession(sessionId);
        
        // 如果有关联任务，增加番茄钟计数
        if (session.taskId) {
          await this.taskRepository.incrementPomodoroCount(session.taskId);
        }
      });

      // 获取更新后的会话
      const updatedSession = await this.pomodoroRepository.findById(sessionId);
      if (!updatedSession) {
        throw new Error('番茄钟会话完成成功但无法获取');
      }

      logger.info('番茄钟会话完成成功', { 
        sessionId, 
        userId, 
        taskId: session.taskId,
        completedAt: updatedSession.completedAt
      });

      return updatedSession;
    } catch (error) {
      logger.error('完成番茄钟会话失败', { userId, sessionId, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('完成番茄钟会话失败', 500);
    }
  }

  /**
   * 结束番茄钟会话（支持多种场景）
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param endData 结束数据
   *   - completed: 是否完成任务
   *   - completedAt: 结束时间（可选）
   *   - updateDuration: 是否更新duration_minutes为实际累计时长
   */
  async endPomodoroSession(
    userId: number, 
    sessionId: number,
    endData: {
      completed: boolean;
      completedAt?: string;
      updateDuration?: boolean;
    }
  ): Promise<PomodoroSession> {
    try {
      logger.info('开始结束番茄钟会话', { userId, sessionId, endData });

      // 验证会话是否存在且属于当前用户
      const session = await this.pomodoroRepository.findByIdAndUserId(sessionId, userId);
      if (!session) {
        throw new NotFoundError('番茄钟会话不存在或无权限访问');
      }

      if (session.completedAt) {
        throw new ValidationError('番茄钟会话已结束');
      }

      // 🔧 自动结束该会话的所有未结束的 focus periods
      const focusPeriodRepo = new (require('../repositories/focus-period.repository').FocusPeriodRepository)();
      const activePeriod = await focusPeriodRepo.getActivePeriod(sessionId);
      if (activePeriod) {
        const endTime = endData.completedAt || new Date().toISOString();
        await focusPeriodRepo.endPeriod(activePeriod.period_id, {
          end_time: endTime,
          is_interrupted: !endData.completed // 如果会话未完成，标记为中断
        });
        logger.info('自动结束活跃的focus period', { 
          sessionId, 
          periodId: activePeriod.period_id,
          isInterrupted: !endData.completed
        });
      }

      // 如果需要更新duration_minutes，计算实际累计时长
      let actualDuration: number | undefined;
      if (endData.updateDuration) {
        actualDuration = await this.pomodoroRepository.calculateSessionActualDuration(sessionId);
        logger.info('计算会话实际时长', { sessionId, actualDuration });
      }

      // 结束会话
      await this.pomodoroRepository.endSession(sessionId, {
        completed: endData.completed,
        completedAt: endData.completedAt,
        updateDuration: endData.updateDuration,
        actualDuration
      });

      // 获取更新后的会话
      const updatedSession = await this.pomodoroRepository.findById(sessionId);
      if (!updatedSession) {
        throw new Error('番茄钟会话结束成功但无法获取');
      }

      logger.info('番茄钟会话结束成功', { 
        sessionId, 
        userId, 
        completed: endData.completed,
        actualDuration,
        completedAt: updatedSession.completedAt
      });

      return updatedSession;
    } catch (error) {
      logger.error('结束番茄钟会话失败', { userId, sessionId, endData, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('结束番茄钟会话失败', 500);
    }
  }

  /**
   * 获取番茄钟会话列表
   */
  async getPomodoroSessions(userId: number, options: {
    taskId?: number;
    completed?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ sessions: PomodoroSession[]; total: number }> {
    try {
      logger.debug('开始获取番茄钟会话列表', { userId, options });

      const queryOptions = {
        page: options.page || 1,
        limit: options.limit || 50,
        taskId: options.taskId,
        completed: options.completed,
        offset: ((options.page || 1) - 1) * (options.limit || 50)
      };

      const result = await this.pomodoroRepository.findByUserId(userId, queryOptions);

      logger.debug('番茄钟会话列表获取成功', { 
        userId, 
        total: result.total, 
        count: result.sessions.length 
      });

      return result;
    } catch (error) {
      logger.error('获取番茄钟会话列表失败', { userId, options, error: getErrorMessage(error) });
      throw new ApiError('获取番茄钟会话列表失败', 500);
    }
  }

  /**
   * 获取番茄钟统计信息
   */
  async getPomodoroStats(userId: number, days: number = 30): Promise<{
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
  }> {
    try {
      logger.debug('开始获取番茄钟统计', { userId, days });

      const stats = await this.pomodoroRepository.getPomodoroStats(userId, days);

      logger.debug('番茄钟统计获取成功', { userId, days, stats });
      return stats;
    } catch (error) {
      logger.error('获取番茄钟统计失败', { userId, days, error: getErrorMessage(error) });
      throw new ApiError('获取番茄钟统计失败', 500);
    }
  }

  /**
   * 获取活跃番茄钟会话
   */
  async getActivePomodoroSession(userId: number): Promise<PomodoroSession | null> {
    try {
      logger.debug('开始获取活跃番茄钟会话', { userId });

      const session = await this.pomodoroRepository.getActiveSession(userId);

      logger.debug('活跃番茄钟会话获取成功', { userId, hasActiveSession: !!session });
      return session || null;
    } catch (error) {
      logger.error('获取活跃番茄钟会话失败', { userId, error: getErrorMessage(error) });
      throw new ApiError('获取活跃番茄钟会话失败', 500);
    }
  }

  /**
   * 私有方法：验证任务数据
   */
  private validateTaskData(taskData: CreateTaskDto): void {
    const { title, description, dueDate } = taskData;

    if (!title || title.trim().length === 0) {
      throw new ValidationError('任务标题不能为空');
    }

    if (title.length > 255) {
      throw new ValidationError('任务标题长度不能超过255个字符');
    }

    if (description && description.length > 1000) {
      throw new ValidationError('任务描述长度不能超过1000个字符');
    }

    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        throw new ValidationError('无效的截止日期格式');
      }
      if (dueDateObj < new Date()) {
        throw new ValidationError('任务截止日期不能早于当前时间');
      }
    }
  }

  /**
   * 私有方法：验证更新数据
   */
  private validateUpdateData(updateData: UpdateTaskDto): void {
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        throw new ValidationError('任务标题不能为空');
      }
      if (updateData.title.length > 255) {
        throw new ValidationError('任务标题长度不能超过255个字符');
      }
    }

    if (updateData.description !== undefined && updateData.description.length > 1000) {
      throw new ValidationError('任务描述长度不能超过1000个字符');
    }

    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate);
      if (isNaN(dueDateObj.getTime())) {
        throw new ValidationError('无效的截止日期格式');
      }
      if (dueDateObj < new Date()) {
        throw new ValidationError('任务截止日期不能早于当前时间');
      }
    }
  }

  /**
   * 更新任务完成状态（用于番茄钟完成场景）
   * @param userId 用户ID
   * @param taskId 任务ID
   * @param sessionId 番茄钟会话ID
   * @param markAsCompleted 是否标记为已完成
   * @param completedAt 完成时间
   */
  async updateTaskCompletionFromPomodoro(
    userId: number,
    taskId: number,
    sessionId: number,
    markAsCompleted: boolean,
    completedAt?: string
  ): Promise<Task> {
    try {
      logger.info('开始更新任务完成状态（番茄钟）', {
        userId,
        taskId,
        sessionId,
        markAsCompleted,
        completedAt
      });

      // 验证任务是否存在且属于当前用户
      const task = await this.taskRepository.findByIdAndUserId(taskId, userId);
      if (!task) {
        throw new NotFoundError('任务不存在或无权限访问');
      }

      // 验证会话是否存在且属于当前用户
      const session = await this.pomodoroRepository.findByIdAndUserId(sessionId, userId);
      if (!session) {
        throw new NotFoundError('番茄钟会话不存在或无权限访问');
      }

      // 更新任务完成状态
      await this.taskRepository.updateTaskCompletionFromPomodoro(taskId, sessionId, {
        markAsCompleted,
        completedAt
      });

      // 获取更新后的任务
      const updatedTask = await this.taskRepository.findById(taskId);
      if (!updatedTask) {
        throw new Error('任务更新成功但无法获取');
      }

      logger.info('任务完成状态更新成功（番茄钟）', {
        taskId,
        userId,
        sessionId,
        markAsCompleted,
        focusTime: updatedTask.focusTime,
        pomodoroCount: updatedTask.pomodoroCount
      });

      return updatedTask;
    } catch (error) {
      logger.error('更新任务完成状态失败（番茄钟）', {
        userId,
        taskId,
        sessionId,
        markAsCompleted,
        error: getErrorMessage(error)
      });
      throw error instanceof ApiError ? error : new ApiError('更新任务完成状态失败', 500);
    }
  }

  async getCalendarCheckIns(userId: number, year: number, month: number): Promise<{ date: string; hasCheckIn: boolean }[]> {
    try {
      logger.info('获取用户打卡日历数据', { userId, year, month });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const completedDates = await this.taskRepository.getCompletedDates(userId, startDateStr, endDateStr);
      
      const checkIns: { date: string; hasCheckIn: boolean }[] = [];
      const daysInMonth = endDate.getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasCheckIn = completedDates.includes(dateStr);
        checkIns.push({ date: dateStr, hasCheckIn });
      }

      logger.info('打卡日历数据获取成功', { userId, year, month, totalDays: checkIns.length });
      return checkIns;
    } catch (error) {
      logger.error('获取打卡日历数据失败', { userId, year, month, error: getErrorMessage(error) });
      throw new ApiError('获取打卡日历数据失败', 500);
    }
  }

  async createMakeUpCheckIn(userId: number, checkInDate: string): Promise<Task> {
    try {
      logger.info('开始补打卡', { userId, checkInDate });

      const user = await this.taskRepository.getUserRewardCount(userId);
      
      if (user.reward_count >= 2) {
        throw new ValidationError('本月补打卡次数已用完（2次/月）');
      }

      const date = new Date(checkInDate);
      date.setHours(12, 1, 0, 0);
      const completedAt = date.toISOString();
      
      date.setMinutes(2);
      const deletedAt = date.toISOString();

      const taskData: CreateTaskDto = {
        title: '补打卡',
        description: '补打卡',
        category: null as any,
        priority: null as any,
        dueDate: null as any,
        alarm: null as any,
        repeatDays: null as any
      };

      const taskId = await this.taskRepository.createMakeUpCheckIn(
        userId,
        taskData,
        completedAt,
        deletedAt
      );

      await this.taskRepository.incrementRewardCount(userId);

      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new NotFoundError('补打卡记录创建失败');
      }

      logger.info('补打卡成功', { userId, checkInDate, taskId });
      return task;
    } catch (error) {
      logger.error('补打卡失败', { userId, checkInDate, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('补打卡失败', 500);
    }
  }

  async getRecentTaskStats(userId: number, days: number = 7): Promise<Array<{
    date: string;
    time: string;
    totalTasks: number;
    勤政Tasks: number;
    恕己Tasks: number;
    爱人Tasks: number;
  }>> {
    try {
      logger.info('获取近期任务统计', { userId, days });

      const stats = await this.taskRepository.getRecentTaskStats(userId, days);

      logger.info('近期任务统计获取成功', { userId, days, recordCount: stats.length });
      return stats;
    } catch (error) {
      logger.error('获取近期任务统计失败', { userId, days, error: getErrorMessage(error) });
      throw new ApiError('获取近期任务统计失败', 500);
    }
  }

  async getCompletionStats(userId: number): Promise<{
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
  }> {
    try {
      logger.info('获取完成度统计数据', { userId });

      const getWeekRange = (weeksAgo: number): { start: string; end: string } => {
        const now = new Date();
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        
        const monday = new Date(now);
        monday.setDate(now.getDate() + daysToMonday - (weeksAgo * 7));
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return {
          start: monday.toISOString(),
          end: sunday.toISOString()
        };
      };

      const calculateWeekStats = async (weeksAgo: number) => {
        const { start, end } = getWeekRange(weeksAgo);
        
        const allTasks = await this.taskRepository.getTasksByDateRange(userId, start, end);
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const tasks = allTasks.filter(t => {
          const dueDate = (t as any).due_date || t.dueDate;
          if (!dueDate) return false;
          const taskDueDate = new Date(dueDate);
          return taskDueDate >= startDate && taskDueDate <= endDate;
        });
        
        logger.info(`第${weeksAgo}周统计`, {
          weekLabel: weeksAgo === 0 ? '本周' : `前${weeksAgo}周`,
          start,
          end,
          allTasksCount: allTasks.length,
          filteredTasksCount: tasks.length,
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            due_date: (t as any).due_date,
            dueDate: t.dueDate,
            category: t.category,
            completed: t.completed
          }))
        });
        
        const totalTasks = tasks.filter(t => t.category !== null).length;
        const completedTasks = tasks.filter(t => t.category !== null && Boolean(t.completed)).length;
        
        const now = new Date();
        const overdueTasks = tasks.filter(t => {
          const dueDate = (t as any).due_date || t.dueDate;
          return t.category !== null && 
            !Boolean(t.completed) && 
            dueDate && 
            new Date(dueDate) < now;
        }).length;
        
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
        
        logger.info(`第${weeksAgo}周结果`, {
          weekLabel: weeksAgo === 0 ? '本周' : `前${weeksAgo}周`,
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate: completionRate.toFixed(1),
          overdueRate: overdueRate.toFixed(1)
        });
        
        return { completionRate, overdueRate, totalTasks };
      };

      const [week0, week1, week2, week3] = await Promise.all([
        calculateWeekStats(0),
        calculateWeekStats(1),
        calculateWeekStats(2),
        calculateWeekStats(3)
      ]);

      const result = {
        weeklyStats: {
          completionRate: Math.round(week0.completionRate * 10) / 10,
          overdueRate: Math.round(week0.overdueRate * 10) / 10,
          totalTasks: week0.totalTasks
        },
        trendData: [
          {
            week: '前3周',
            completionRate: Math.round(week3.completionRate * 10) / 10,
            overdueRate: Math.round(week3.overdueRate * 10) / 10
          },
          {
            week: '前2周',
            completionRate: Math.round(week2.completionRate * 10) / 10,
            overdueRate: Math.round(week2.overdueRate * 10) / 10
          },
          {
            week: '前1周',
            completionRate: Math.round(week1.completionRate * 10) / 10,
            overdueRate: Math.round(week1.overdueRate * 10) / 10
          },
          {
            week: '本周',
            completionRate: Math.round(week0.completionRate * 10) / 10,
            overdueRate: Math.round(week0.overdueRate * 10) / 10
          }
        ]
      };

      logger.info('完成度统计数据获取成功', { userId, weeklyStats: result.weeklyStats });
      return result;
    } catch (error) {
      logger.error('获取完成度统计数据失败', { userId, error: getErrorMessage(error) });
      throw new ApiError('获取完成度统计数据失败', 500);
    }
  }
}

export default TaskService;