import { getQuery, runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';
import { 
  Task, 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskFilterOptions, 
  TaskSortOptions,
  TaskQueryParams,
  PomodoroSession,
  CreatePomodoroSessionDto,
  TaskStats,
  TaskAnalytics
} from '../types/task.types';

export class TaskRepository {
  /**
   * 创建任务
   */
  async create(userId: number, taskData: CreateTaskDto): Promise<number> {
    try {
      const {
        title,
        description = null,
        category = '勤政',
        priority = '铜',
        dueDate = null,
        alarm = null,
        repeatDays = 0
      } = taskData;

      const result = await runQuery(
        `INSERT INTO tasks (user_id, title, description, category, priority, due_date, alarm, repeat_days) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, description, category, priority, dueDate, alarm, repeatDays]
      );

      logger.info('任务创建成功', { 
        taskId: result.lastID, 
        userId, 
        title, 
        category, 
        priority,
        dueDate,
        alarm,
        repeatDays
      });

      return result.lastID!;
    } catch (error: any) {
      logger.error('任务创建失败', { 
        userId, 
        taskData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 根据ID查找任务
   */
  async findById(taskId: number): Promise<Task | undefined> {
    const task = await getQuery<Task>(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    if (task) {
      logger.debug('任务查找成功', { taskId });
    } else {
      logger.debug('任务未找到', { taskId });
    }

    return task;
  }

  /**
   * 根据ID和用户ID查找任务（确保数据隔离）
   */
  async findByIdAndUserId(taskId: number, userId: number): Promise<Task | undefined> {
    const task = await getQuery<Task>(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (task) {
      logger.debug('任务查找成功', { taskId, userId });
    } else {
      logger.debug('任务未找到或无权访问', { taskId, userId });
    }

    return task;
  }

  /**
   * 获取用户的任务列表（支持过滤、排序、分页）
   */
  async findByUserId(
    userId: number, 
    options: TaskQueryParams = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      completed,
      dueDateFrom,
      dueDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeCompleted = true,
      includeOverdue = true
    } = options;

    const offset = (page - 1) * limit;

    // 构建WHERE子句
    let whereClause = 'WHERE user_id = ? AND deleted_at IS NULL';  // 默认排除已删除任务
    const params: any[] = [userId];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (priority) {
      whereClause += ' AND priority = ?';
      params.push(priority);
    }

    if (completed !== undefined) {
      whereClause += ' AND completed = ?';
      params.push(completed);
    }

    if (dueDateFrom) {
      whereClause += ' AND due_date >= ?';
      params.push(dueDateFrom);
    }

    if (dueDateTo) {
      whereClause += ' AND due_date <= ?';
      params.push(dueDateTo);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (!includeCompleted) {
      whereClause += ' AND completed = 0';
    }

    if (!includeOverdue) {
      whereClause += ' AND (due_date IS NULL OR due_date > datetime("now"))';
    }

    // 构建排序子句
    const validSortFields = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'dueDate': 'due_date',
      'priority': 'priority',
      'category': 'category',
      'title': 'title',
      'pomodoroCount': 'pomodoro_count'
    };

    const sortField = validSortFields[sortBy] || 'created_at';
    const sortClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    try {
      // 获取总数
      const countResult = await getQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM tasks ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // 获取任务列表
      const tasks = await allQuery<Task>(
        `SELECT * FROM tasks ${whereClause} ${sortClause} LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      logger.debug('任务列表查询成功', { 
        userId, 
        total, 
        count: tasks.length, 
        page, 
        limit 
      });

      return { tasks, total };
    } catch (error: any) {
      logger.error('任务列表查询失败', { 
        userId, 
        options, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 更新任务
   */
  async update(taskId: number, updateData: UpdateTaskDto): Promise<void> {
    const fieldMapping: Record<string, string> = {
      'title': 'title',
      'description': 'description',
      'category': 'category',
      'priority': 'priority',
      'dueDate': 'due_date',
      'alarm': 'alarm',
      'repeatDays': 'repeat_days',
      'completed': 'completed',
      'pomodoroCount': 'pomodoro_count'
    };

    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return;
    }

    const dbFields = fields.map(field => fieldMapping[field] || field);
    const values = Object.values(updateData);
    const setClause = dbFields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE tasks SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;

    try {
      await runQuery(sql, [...values, taskId]);
      logger.info('任务更新成功', { taskId, updatedFields: fields });
    } catch (error: any) {
      logger.error('任务更新失败', { taskId, updateData, error: error.message });
      throw error;
    }
  }

  /**
   * 软删除任务
   */
  async delete(taskId: number): Promise<void> {
    try {
      const now = new Date().toISOString();
      await runQuery(
        'UPDATE tasks SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL',
        [now, taskId]
      );
      logger.info('任务软删除成功', { taskId, deletedAt: now });
    } catch (error: any) {
      logger.error('任务软删除失败', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * 批量删除任务
   */
  async deleteMany(taskIds: number[]): Promise<number> {
    try {
      const placeholders = taskIds.map(() => '?').join(',');
      const result = await runQuery(
        `DELETE FROM tasks WHERE id IN (${placeholders})`,
        taskIds
      );
      
      logger.info('批量删除任务成功', { taskIds, deletedCount: result.changes });
      return result.changes;
    } catch (error: any) {
      logger.error('批量删除任务失败', { taskIds, error: error.message });
      throw error;
    }
  }

  /**
   * 批量更新任务状态
   */
  async updateManyStatus(taskIds: number[], completed: boolean): Promise<number> {
    try {
      const placeholders = taskIds.map(() => '?').join(',');
      const result = await runQuery(
        `UPDATE tasks SET completed = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
        [completed, ...taskIds]
      );
      
      logger.info('批量更新任务状态成功', { taskIds, completed, updatedCount: result.changes });
      return result.changes;
    } catch (error: any) {
      logger.error('批量更新任务状态失败', { taskIds, completed, error: error.message });
      throw error;
    }
  }

  /**
   * 增加番茄钟计数
   */
  async incrementPomodoroCount(taskId: number): Promise<void> {
    try {
      await runQuery(
        'UPDATE tasks SET pomodoro_count = pomodoro_count + 1, updated_at = datetime("now") WHERE id = ?',
        [taskId]
      );
      logger.info('增加任务番茄钟计数', { taskId });
    } catch (error: any) {
      logger.error('增加任务番茄钟计数失败', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(userId: number): Promise<TaskStats> {
    try {
      const [
        totalResult,
        completedResult,
        pendingResult,
        overdueResult,
        categoryResults,
        priorityResults,
        pomodoroResult
      ] = await Promise.all([
        getQuery<{ count: number }>('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]),
        getQuery<{ count: number }>('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL AND completed = 1', [userId]),
        getQuery<{ count: number }>('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL AND completed = 0', [userId]),
        getQuery<{ count: number }>('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL AND completed = 0 AND due_date < datetime("now")', [userId]),
        allQuery<{ category: string; count: number }>(
          'SELECT category, COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL GROUP BY category',
          [userId]
        ),
        allQuery<{ priority: string; count: number }>(
          'SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL GROUP BY priority',
          [userId]
        ),
        getQuery<{ total: number }>('SELECT SUM(pomodoro_count) as total FROM tasks WHERE user_id = ?', [userId])
      ]);

      const stats: TaskStats = {
        totalTasks: totalResult?.count || 0,
        completedTasks: completedResult?.count || 0,
        pendingTasks: pendingResult?.count || 0,
        overdueTasks: overdueResult?.count || 0,
        tasksByCategory: {
          '勤政': 0,
          '恕己': 0,
          '爱人': 0
        },
        tasksByPriority: {
          '金': 0,
          '银': 0,
          '铜': 0,
          '石': 0
        },
        tasksByStatus: {
          pending: pendingResult?.count || 0,
          in_progress: 0, // 可以根据需要扩展
          completed: completedResult?.count || 0,
          overdue: overdueResult?.count || 0
        },
        pomodoroCount: pomodoroResult?.total || 0
      };

      // 填充分类统计
      categoryResults.forEach(result => {
        if (result.category in stats.tasksByCategory) {
          (stats.tasksByCategory as any)[result.category] = result.count;
        }
      });

      // 填充优先级统计
      priorityResults.forEach(result => {
        if (result.priority in stats.tasksByPriority) {
          (stats.tasksByPriority as any)[result.priority] = result.count;
        }
      });

      logger.debug('任务统计查询成功', { userId, stats });
      return stats;
    } catch (error: any) {
      logger.error('任务统计查询失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取任务分析数据
   */
  async getTaskAnalytics(userId: number, days: number = 30): Promise<TaskAnalytics> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      // 获取每日统计
      const dailyStats = await allQuery<{
        date: string;
        completedTasks: number;
        createdTasks: number;
        pomodoroSessions: number;
      }>(`
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedTasks,
          COUNT(*) as createdTasks,
          (SELECT COUNT(*) FROM pomodoro_sessions ps 
           WHERE DATE(ps.started_at) = DATE(t.created_at) AND ps.user_id = t.user_id) as pomodoroSessions
        FROM tasks t
        WHERE t.user_id = ? AND t.created_at >= datetime(?, 'localtime')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [userId, dateFrom.toISOString()]);

      // 获取分类分布
      const categoryDistribution = await allQuery<{ category: string; count: number }>(
        'SELECT category, COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL GROUP BY category',
        [userId]
      );

      // 获取优先级分布
      const priorityDistribution = await allQuery<{ priority: string; count: number }>(
        'SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? AND deleted_at IS NULL GROUP BY priority',
        [userId]
      );

      // 计算完成率
      const completionResult = await getQuery<{ completed: number; total: number }>(
        'SELECT SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed, COUNT(*) as total FROM tasks WHERE user_id = ?',
        [userId]
      );

      const completionRate = completionResult && completionResult.total > 0 
        ? Math.round((completionResult.completed / completionResult.total) * 100)
        : 0;

      // 获取最高效的小时（基于番茄钟会话）
      const productiveHourResult = await getQuery<{ hour: number; count: number }>(`
        SELECT strftime('%H', started_at) as hour, COUNT(*) as count
        FROM pomodoro_sessions
        WHERE user_id = ? AND deleted_at IS NULL AND completed = 1
        GROUP BY strftime('%H', started_at)
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);

      // 获取连续完成任务天数（简化版本）
      const streakResult = await getQuery<{ streakDays: number }>(`
        WITH daily_completions AS (
          SELECT DATE(updated_at) as date, COUNT(*) as completed
          FROM tasks
          WHERE user_id = ? AND deleted_at IS NULL AND completed = 1 AND updated_at IS NOT NULL
          GROUP BY DATE(updated_at)
        )
        SELECT COUNT(*) as streakDays
        FROM daily_completions
        WHERE date >= datetime('now', '-30 days')
      `, [userId]);

      const analytics: TaskAnalytics = {
        dailyStats: dailyStats.map(stat => ({
          date: stat.date,
          completedTasks: stat.completedTasks,
          createdTasks: stat.createdTasks,
          pomodoroSessions: stat.pomodoroSessions
        })),
        categoryDistribution: {
          '勤政': 0,
          '恕己': 0,
          '爱人': 0
        },
        priorityDistribution: {
          '金': 0,
          '银': 0,
          '铜': 0,
          '石': 0
        },
        completionRate,
        mostProductiveHour: productiveHourResult?.hour,
        streakDays: streakResult?.streakDays || 0
      };

      // 填充分类分布
      categoryDistribution.forEach(result => {
        if (result.category in analytics.categoryDistribution) {
          (analytics.categoryDistribution as any)[result.category] = result.count;
        }
      });

      // 填充优先级分布
      priorityDistribution.forEach(result => {
        if (result.priority in analytics.priorityDistribution) {
          (analytics.priorityDistribution as any)[result.priority] = result.count;
        }
      });

      logger.debug('任务分析数据查询成功', { userId, days, analytics });
      return analytics;
    } catch (error: any) {
      logger.error('任务分析数据查询失败', { userId, days, error: error.message });
      throw error;
    }
  }

  /**
   * 搜索任务
   */
  async searchTasks(userId: number, query: string, limit: number = 10): Promise<Task[]> {
    try {
      const searchPattern = `%${query}%`;
      const tasks = await allQuery<Task>(
        `SELECT * FROM tasks 
         WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
         ORDER BY 
           CASE 
             WHEN title LIKE ? THEN 1
             WHEN description LIKE ? THEN 2
             ELSE 3
           END,
           created_at DESC
         LIMIT ?`,
        [userId, searchPattern, searchPattern, searchPattern, searchPattern, limit]
      );

      logger.debug('任务搜索成功', { userId, query, resultCount: tasks.length });
      return tasks;
    } catch (error: any) {
      logger.error('任务搜索失败', { userId, query, error: error.message });
      throw error;
    }
  }

  /**
   * 获取即将到期的任务
   */
  async getUpcomingTasks(userId: number, daysAhead: number = 7): Promise<Task[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const tasks = await allQuery<Task>(
        `SELECT * FROM tasks 
         WHERE user_id = ? AND deleted_at IS NULL AND completed = 0 
         AND due_date IS NOT NULL 
         AND due_date <= datetime(?)
         ORDER BY due_date ASC`,
        [userId, futureDate.toISOString()]
      );

      logger.debug('获取即将到期任务成功', { userId, daysAhead, taskCount: tasks.length });
      return tasks;
    } catch (error: any) {
      logger.error('获取即将到期任务失败', { userId, daysAhead, error: error.message });
      throw error;
    }
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(userId: number): Promise<Task[]> {
    try {
      const tasks = await allQuery<Task>(
        `SELECT * FROM tasks 
         WHERE user_id = ? AND deleted_at IS NULL AND completed = 0 
         AND due_date IS NOT NULL 
         AND due_date < datetime('now')
         ORDER BY due_date ASC`,
        [userId]
      );

      logger.debug('获取逾期任务成功', { userId, taskCount: tasks.length });
      return tasks;
    } catch (error: any) {
      logger.error('获取逾期任务失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 归档已完成任务
   */
  async archiveCompletedTasks(userId: number, daysOld: number = 30): Promise<number> {
    try {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - daysOld);

      const result = await runQuery(
        `DELETE FROM tasks 
         WHERE user_id = ? AND deleted_at IS NULL AND completed = 1 
         AND updated_at < datetime(?)`,
        [userId, archiveDate.toISOString()]
      );

      logger.info('归档已完成任务成功', { 
        userId, 
        daysOld, 
        archivedCount: result.changes 
      });
      return result.changes;
    } catch (error: any) {
      logger.error('归档已完成任务失败', { userId, daysOld, error: error.message });
      throw error;
    }
  }

  /**
   * 软删除任务
   */
  async softDelete(taskId: number, userId: number): Promise<boolean> {
    try {
      const result = await runQuery(
        `UPDATE tasks 
         SET deleted_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
        [taskId, userId]
      );

      if (result.changes > 0) {
        logger.info('任务已软删除', { taskId, userId });
        return true;
      }
      
      logger.warn('软删除任务失败 - 任务不存在或已删除', { taskId, userId });
      return false;
    } catch (error: any) {
      logger.error('软删除任务失败', { taskId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 恢复已删除任务
   */
  async restore(taskId: number, userId: number): Promise<boolean> {
    try {
      const result = await runQuery(
        `UPDATE tasks 
         SET deleted_at = NULL 
         WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`,
        [taskId, userId]
      );

      if (result.changes > 0) {
        logger.info('任务已恢复', { taskId, userId });
        return true;
      }
      
      logger.warn('恢复任务失败 - 任务不存在或未被删除', { taskId, userId });
      return false;
    } catch (error: any) {
      logger.error('恢复任务失败', { taskId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取已删除任务列表（回收站）
   */
  async findDeleted(userId: number, options: TaskQueryParams = {}): Promise<{ tasks: Task[]; total: number }> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
      const offset = (page - 1) * limit;

      // 获取总数
      const countResult = await getQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM tasks 
         WHERE user_id = ? AND deleted_at IS NOT NULL`,
        [userId]
      );
      const total = countResult?.count || 0;

      // 获取已删除任务列表
      const tasks = await allQuery<Task>(
        `SELECT * FROM tasks 
         WHERE user_id = ? AND deleted_at IS NOT NULL 
         ORDER BY ${sortBy || 'deleted_at'} ${sortOrder || 'DESC'}
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      logger.debug('查询已删除任务成功', { userId, total, page, limit });
      return { tasks, total };
    } catch (error: any) {
      logger.error('查询已删除任务失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 永久删除任务
   */
  async permanentDelete(taskId: number, userId: number): Promise<boolean> {
    try {
      const result = await runQuery(
        `DELETE FROM tasks 
         WHERE id = ? AND user_id = ?`,
        [taskId, userId]
      );

      if (result.changes > 0) {
        logger.info('任务已永久删除', { taskId, userId });
        return true;
      }
      
      logger.warn('永久删除任务失败 - 任务不存在', { taskId, userId });
      return false;
    } catch (error: any) {
      logger.error('永久删除任务失败', { taskId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 更新任务完成状态（专门用于番茄钟完成场景）
   * @param taskId 任务ID
   * @param sessionId 番茄钟会话ID
   * @param data 更新数据
   *   - markAsCompleted: 是否将任务标记为已完成
   *   - completedAt: 完成时间（如果markAsCompleted为true）
   */
  async updateTaskCompletionFromPomodoro(
    taskId: number,
    sessionId: number,
    data: {
      markAsCompleted: boolean;
      completedAt?: string;
    }
  ): Promise<void> {
    try {
      const { markAsCompleted, completedAt } = data;

      // 1. 获取当前任务的focus_time
      const task = await this.findById(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      // 2. 计算本次session的所有focus_periods的总时长
      const focusTimeResult = await getQuery<{ total: number }>(`
        SELECT COALESCE(SUM(duration_min), 0) as total
        FROM focus_periods
        WHERE session_id = ?
      `, [sessionId]);

      const sessionFocusTime = Math.round((focusTimeResult?.total || 0) * 10) / 10;

      // 3. 计算新的focus_time（当前focus_time + 本次session的focus_time）
      const currentFocusTime = task.focusTime || 0;
      const newFocusTime = Math.round((currentFocusTime + sessionFocusTime) * 10) / 10;

      // 4. 更新任务
      if (markAsCompleted) {
        // 场景2和场景4：标记为已完成
        const completionTime = completedAt || new Date().toISOString();
        await runQuery(
          `UPDATE tasks 
           SET completed = 1,
               completed_at = datetime(?),
               focus_time = ?,
               pomodoro_count = pomodoro_count + 1,
               updated_at = datetime('now')
           WHERE id = ?`,
          [completionTime, newFocusTime, taskId]
        );
        logger.info('任务标记为已完成（番茄钟）', {
          taskId,
          sessionId,
          completedAt: completionTime,
          sessionFocusTime,
          newFocusTime,
          pomodoroCount: task.pomodoroCount + 1
        });
      } else {
        // 场景1、场景3、场景5：不标记为已完成
        await runQuery(
          `UPDATE tasks 
           SET focus_time = ?,
               pomodoro_count = pomodoro_count + 1,
               updated_at = datetime('now')
           WHERE id = ?`,
          [newFocusTime, taskId]
        );
        logger.info('任务更新（番茄钟，未完成）', {
          taskId,
          sessionId,
          sessionFocusTime,
          newFocusTime,
          pomodoroCount: task.pomodoroCount + 1
        });
      }
    } catch (error: any) {
      logger.error('更新任务完成状态失败（番茄钟）', {
        taskId,
        sessionId,
        data,
        error: error.message
      });
      throw error;
    }
  }

  async getCompletedDates(userId: number, startDate: string, endDate: string): Promise<string[]> {
    try {
      const rows = await allQuery<{ completed_date: string }>(
        `SELECT DISTINCT DATE(completed_at) as completed_date
         FROM tasks
         WHERE user_id = ? 
           AND completed = 1
           AND category IS NOT NULL
           AND completed_at IS NOT NULL
           AND DATE(completed_at) BETWEEN ? AND ?
           AND deleted_at IS NULL
         ORDER BY completed_date`,
        [userId, startDate, endDate]
      );

      return rows.map(row => row.completed_date);
    } catch (error: any) {
      logger.error('获取完成日期失败', { userId, startDate, endDate, error: error.message });
      throw error;
    }
  }

  async getUserRewardCount(userId: number): Promise<{ user_id: number; reward_count: number }> {
    try {
      const result = await getQuery<{ user_id: number; reward_count: number }>(
        'SELECT user_id, reward_count FROM users WHERE user_id = ?',
        [userId]
      );

      if (!result) {
        throw new Error('用户不存在');
      }

      return result;
    } catch (error: any) {
      logger.error('获取用户补打卡次数失败', { userId, error: error.message });
      throw error;
    }
  }

  async incrementRewardCount(userId: number): Promise<void> {
    try {
      await runQuery(
        'UPDATE users SET reward_count = reward_count + 1 WHERE user_id = ?',
        [userId]
      );

      logger.info('补打卡次数已增加', { userId });
    } catch (error: any) {
      logger.error('增加补打卡次数失败', { userId, error: error.message });
      throw error;
    }
  }

  async createMakeUpCheckIn(
    userId: number,
    taskData: CreateTaskDto,
    completedAt: string,
    deletedAt: string
  ): Promise<number> {
    try {
      const result = await runQuery(
        `INSERT INTO tasks (
          user_id, title, description, category, priority, 
          completed, completed_at, focus_time, pomodoro_count,
          due_date, alarm, repeat_days, deleted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, NULL, NULL, NULL, NULL, NULL, ?, datetime('now'))`,
        [
          userId,
          taskData.title,
          taskData.description,
          null,
          null,
          completedAt,
          deletedAt
        ]
      );

      logger.info('补打卡记录创建成功', { userId, taskId: result.lastID });
      return result.lastID;
    } catch (error: any) {
      logger.error('创建补打卡记录失败', { userId, error: error.message });
      throw error;
    }
  }

  async getRecentTaskStats(userId: number, days: number): Promise<Array<{
    date: string;
    time: string;
    totalTasks: number;
    勤政Tasks: number;
    恕己Tasks: number;
    爱人Tasks: number;
  }>> {
    try {
      const stats: Array<{
        date: string;
        time: string;
        totalTasks: number;
        勤政Tasks: number;
        恕己Tasks: number;
        爱人Tasks: number;
      }> = [];

      for (let i = 0; i < days; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateStr = targetDate.toISOString().split('T')[0];

        const counts = await getQuery<{
          total: number;
          勤政: number;
          恕己: number;
          爱人: number;
          latest_time: string;
        }>(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN category = '勤政' THEN 1 ELSE 0 END) as 勤政,
            SUM(CASE WHEN category = '恕己' THEN 1 ELSE 0 END) as 恕己,
            SUM(CASE WHEN category = '爱人' THEN 1 ELSE 0 END) as 爱人,
            MAX(TIME(completed_at)) as latest_time
           FROM tasks
           WHERE user_id = ?
             AND completed = 1
             AND category IS NOT NULL
             AND DATE(completed_at) = ?
             AND deleted_at IS NULL`,
          [userId, dateStr]
        );

        if (counts && counts.total > 0) {
          const month = String(targetDate.getMonth() + 1).padStart(2, '0');
          const day = String(targetDate.getDate()).padStart(2, '0');
          
          stats.push({
            date: `${month}月${day}日`,
            time: counts.latest_time ? counts.latest_time.substring(0, 5) : '00:00',
            totalTasks: counts.total,
            勤政Tasks: counts.勤政 || 0,
            恕己Tasks: counts.恕己 || 0,
            爱人Tasks: counts.爱人 || 0
          });
        }
      }

      return stats;
    } catch (error: any) {
      logger.error('获取近期任务统计失败', { userId, days, error: error.message });
      throw error;
    }
  }

  async getTasksByDateRange(userId: number, startDate: string, endDate: string): Promise<Task[]> {
    try {
      const tasks = await allQuery<Task>(
        `SELECT * FROM tasks
         WHERE user_id = ?
           AND due_date IS NOT NULL
           AND deleted_at IS NULL
         ORDER BY due_date ASC`,
        [userId]
      );

      logger.debug('按日期范围查询任务成功', { 
        userId, 
        startDate, 
        endDate, 
        count: tasks.length 
      });

      return tasks;
    } catch (error: any) {
      logger.error('按日期范围查询任务失败', { 
        userId, 
        startDate, 
        endDate, 
        error: error.message 
      });
      throw error;
    }
  }
}

export default TaskRepository;