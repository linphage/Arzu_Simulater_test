import { runQuery, allQuery, getQuery } from '../database/connection';
import { logger } from '../config/logger';

export class TaskGenerationService {
  /**
   * 将位掩码格式的 repeatDays 转换为数组格式
   * 例如: 124 (01111100) -> [2,3,4,5,6] (周二到周六)
   */
  private static convertBitmaskToArray(bitmask: number): number[] {
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
  private static normalizeRepeatDays(repeatDays: any): number[] | null {
    if (repeatDays === undefined || repeatDays === null || repeatDays === 0 || repeatDays === '0') {
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
        if (Array.isArray(parsed)) {
          return parsed.length > 0 ? parsed : null;
        }
        // 如果解析结果是数字，转换位掩码
        if (typeof parsed === 'number') {
          const converted = this.convertBitmaskToArray(parsed);
          return converted.length > 0 ? converted : null;
        }
      } catch {
        // 解析失败，可能是纯数字字符串
        const num = parseInt(repeatDays, 10);
        if (!isNaN(num) && num > 0) {
          const converted = this.convertBitmaskToArray(num);
          return converted.length > 0 ? converted : null;
        }
      }
    }

    // 如果是数字，转换位掩码
    if (typeof repeatDays === 'number') {
      const converted = this.convertBitmaskToArray(repeatDays);
      return converted.length > 0 ? converted : null;
    }

    return null;
  }

  /**
   * 生成周任务实例
   * @param templateTask 模板任务对象
   * @param period 生成周期：'this_week' 或 'next_week'
   */
  static async generateWeeklyTasks(
    templateTask: any, 
    period: 'this_week' | 'next_week' = 'this_week'
  ): Promise<void> {
    const { id, title, description, repeat_days, due_date, user_id } = templateTask;
    
    // 解析并标准化 repeat_days
    const repeatDaysArray = this.normalizeRepeatDays(repeat_days);
    
    if (!repeatDaysArray || repeatDaysArray.length === 0) {
      logger.warn('模板任务没有有效的重复规则', { taskId: id, repeat_days });
      return;
    }

    // 提取时间部分（HH:MM:SS）
    let dueTime = '00:00:00';
    if (due_date) {
      try {
        const dateObj = new Date(due_date);
        dueTime = dateObj.toISOString().split('T')[1].substring(0, 8);
      } catch (error) {
        logger.warn('无法解析due_date时间', { taskId: id, due_date });
      }
    }

    // 1. 确定要生成的日期范围（统一使用UTC时间）
    const nowUTC = new Date();
    let startDate: Date, endDate: Date;

    if (period === 'this_week') {
      // 从今天开始，到本周日结束
      startDate = new Date(nowUTC);
      const dayOfWeek = nowUTC.getUTCDay(); // 0=周日, 1=周一, ...
      endDate = new Date(nowUTC);
      // 修复：确保周日也能正确计算
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      endDate.setUTCDate(nowUTC.getUTCDate() + daysUntilSunday);
      endDate.setUTCHours(23, 59, 59, 999); // 到周日结束
    } else { // 'next_week'
      // 从下周一开始，到下周日结束
      const dayOfWeek = nowUTC.getUTCDay();
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      
      startDate = new Date(nowUTC);
      startDate.setUTCDate(nowUTC.getUTCDate() + daysUntilNextMonday);
      startDate.setUTCHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6); // 周一到周日
      endDate.setUTCHours(23, 59, 59, 999);
    }

    // 2. 遍历日期范围，生成任务实例
    const tasksToCreate: any[] = [];
    let currentDate = new Date(startDate);
    currentDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const currentDayOfWeek = currentDate.getUTCDay(); // 0=周日, 1=周一, ...

      // 3. 检查今天是否在重复规则内
      if (repeatDaysArray.includes(currentDayOfWeek)) {
        
        // 组合日期和时间（ISO格式）
        const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const newDueDate = `${dateStr}T${dueTime}`; // YYYY-MM-DDTHH:MM:SS

        // 防止重复创建：使用数据库唯一索引 + 检查
        const existing = await getQuery(
          'SELECT id FROM tasks WHERE parent_task_id = ? AND due_date = ?',
          [id, newDueDate]
        );

        if (!existing) {
          tasksToCreate.push({
            user_id,
            title,
            description: description || null,
            category: templateTask.category || '勤政',
            priority: templateTask.priority || '铜',
            due_date: newDueDate,
            completed: 0,
            repeat_days: null, // 实例任务没有重复规则
            parent_task_id: id // 关联到模板
          });
        }
      }
      
      // 移动到下一天
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 4. 批量插入数据库，提高效率
    if (tasksToCreate.length > 0) {
      let successCount = 0;
      for (const task of tasksToCreate) {
        try {
          await runQuery(
            `INSERT INTO tasks (user_id, title, description, category, priority, due_date, completed, repeat_days, parent_task_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              task.user_id, 
              task.title, 
              task.description, 
              task.category, 
              task.priority, 
              task.due_date, 
              task.completed, 
              task.repeat_days, 
              task.parent_task_id
            ]
          );
          successCount++;
        } catch (error: any) {
          // 如果唯一索引冲突，忽略（说明已存在）
          if (!error.message.includes('UNIQUE constraint')) {
            logger.error('创建任务实例失败', { 
              task, 
              error: error.message 
            });
          }
        }
      }
      
      if (successCount > 0) {
        logger.info(`为模板任务 #${id} 生成了 ${successCount} 个实例`, { 
          period, 
          totalAttempts: tasksToCreate.length,
          successCount 
        });
      }
    } else {
      logger.debug(`模板任务 #${id} 在指定周期内无需生成新任务`, { period });
    }
  }

  /**
   * 删除未来未完成的任务实例
   * @param parentTaskId 模板任务ID
   * @param userId 用户ID
   */
  static async deleteFutureInstances(parentTaskId: number, userId: number): Promise<number> {
    try {
      const result = await runQuery(
        `DELETE FROM tasks 
         WHERE parent_task_id = ? 
         AND user_id = ?
         AND completed = 0 
         AND due_date >= datetime('now')`,
        [parentTaskId, userId]
      );

      logger.info('删除未来未完成的任务实例', { 
        parentTaskId, 
        userId, 
        deletedCount: result.changes 
      });

      return result.changes;
    } catch (error: any) {
      logger.error('删除任务实例失败', { 
        parentTaskId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 删除模板任务及其实例
   * @param taskId 模板任务ID
   * @param userId 用户ID
   * @param deleteInstances 是否同时删除未来未完成的实例
   */
  static async deleteTemplate(
    taskId: number, 
    userId: number, 
    deleteInstances: boolean = false
  ): Promise<void> {
    try {
      // 软删除模板
      await runQuery(
        `UPDATE tasks SET deleted_at = datetime('now') 
         WHERE id = ? AND user_id = ? AND parent_task_id IS NULL`,
        [taskId, userId]
      );

      if (deleteInstances) {
        // 删除未来未完成的实例
        await runQuery(
          `UPDATE tasks SET deleted_at = datetime('now')
           WHERE parent_task_id = ? 
           AND completed = 0 
           AND due_date >= datetime('now')`,
          [taskId]
        );
      }

      logger.info('模板任务已删除', { taskId, userId, deleteInstances });
    } catch (error: any) {
      logger.error('删除模板任务失败', { 
        taskId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }
}

export default TaskGenerationService;
