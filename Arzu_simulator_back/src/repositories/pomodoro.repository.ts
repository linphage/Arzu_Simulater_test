import { getQuery, runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';
import { PomodoroSession, CreatePomodoroSessionDto } from '../types/task.types';

export class PomodoroRepository {
  /**
   * 创建番茄钟会话
   */
  async create(userId: number, sessionData: CreatePomodoroSessionDto): Promise<number> {
    try {
      const { taskId, durationMinutes = 25 } = sessionData;

      const result = await runQuery(
        'INSERT INTO pomodoro_sessions (user_id, task_id, duration_minutes) VALUES (?, ?, ?)',
        [userId, taskId || null, durationMinutes]
      );

      logger.info('番茄钟会话创建成功', { 
        sessionId: result.lastID, 
        userId, 
        taskId, 
        durationMinutes 
      });

      return result.lastID!;
    } catch (error: any) {
      logger.error('番茄钟会话创建失败', { 
        userId, 
        sessionData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 根据ID查找番茄钟会话
   */
  async findById(sessionId: number): Promise<PomodoroSession | undefined> {
    const session = await getQuery<PomodoroSession>(
      'SELECT * FROM pomodoro_sessions WHERE id = ?',
      [sessionId]
    );

    if (session) {
      logger.debug('番茄钟会话查找成功', { sessionId });
    } else {
      logger.debug('番茄钟会话未找到', { sessionId });
    }

    return session;
  }

  /**
   * 根据ID和用户ID查找番茄钟会话（确保数据隔离）
   */
  async findByIdAndUserId(sessionId: number, userId: number): Promise<PomodoroSession | undefined> {
    const session = await getQuery<PomodoroSession>(
      'SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (session) {
      logger.debug('番茄钟会话查找成功', { sessionId, userId });
    } else {
      logger.debug('番茄钟会话未找到或无权访问', { sessionId, userId });
    }

    return session;
  }

  /**
   * 获取用户的番茄钟会话列表
   */
  async findByUserId(
    userId: number, 
    options: {
      taskId?: number;
      completed?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ sessions: PomodoroSession[]; total: number }> {
    const { taskId, completed, limit = 50, offset = 0 } = options;

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (taskId) {
      whereClause += ' AND task_id = ?';
      params.push(taskId);
    }

    if (completed !== undefined) {
      whereClause += ' AND completed = ?';
      params.push(completed);
    }

    try {
      // 获取总数
      const countResult = await getQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM pomodoro_sessions ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // 获取会话列表
      const sessions = await allQuery<PomodoroSession>(
        `SELECT * FROM pomodoro_sessions ${whereClause} ORDER BY started_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      logger.debug('番茄钟会话列表查询成功', { 
        userId, 
        total, 
        count: sessions.length, 
        options 
      });

      return { sessions, total };
    } catch (error: any) {
      logger.error('番茄钟会话列表查询失败', { 
        userId, 
        options, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取任务相关的番茄钟会话
   */
  async findByTaskId(taskId: number): Promise<PomodoroSession[]> {
    try {
      const sessions = await allQuery<PomodoroSession>(
        'SELECT * FROM pomodoro_sessions WHERE task_id = ? ORDER BY started_at DESC',
        [taskId]
      );

      logger.debug('任务番茄钟会话查询成功', { taskId, sessionCount: sessions.length });
      return sessions;
    } catch (error: any) {
      logger.error('任务番茄钟会话查询失败', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * 更新番茄钟会话状态（完成）
   */
  async completeSession(sessionId: number): Promise<void> {
    try {
      await runQuery(
        'UPDATE pomodoro_sessions SET completed = 1, completed_at = datetime("now") WHERE id = ?',
        [sessionId]
      );
      logger.info('番茄钟会话完成', { sessionId });
    } catch (error: any) {
      logger.error('番茄钟会话完成失败', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * 结束番茄钟会话（支持不同的结束场景）
   * @param sessionId 会话ID
   * @param endData 结束数据
   *   - completed: 是否完成（true=完成任务，false=中断/离开）
   *   - completedAt: 结束时间（可选，默认当前时间）
   *   - updateDuration: 是否更新duration_minutes为实际累计时长（可选）
   *   - actualDuration: 实际累计时长（分钟，当updateDuration=true时使用）
   */
  async endSession(
    sessionId: number, 
    endData: { 
      completed: boolean; 
      completedAt?: string;
      updateDuration?: boolean;
      actualDuration?: number;
    }
  ): Promise<void> {
    try {
      const { completed, completedAt, updateDuration, actualDuration } = endData;
      const endTime = completedAt || new Date().toISOString();

      if (updateDuration && actualDuration !== undefined) {
        // 更新duration_minutes为实际累计时长
        await runQuery(
          `UPDATE pomodoro_sessions 
           SET completed = ?, 
               completed_at = datetime(?),
               duration_minutes = ?
           WHERE id = ?`,
          [completed ? 1 : 0, endTime, actualDuration, sessionId]
        );
        logger.info('番茄钟会话结束（更新时长）', { 
          sessionId, 
          completed, 
          actualDuration,
          completedAt: endTime 
        });
      } else {
        // 不更新duration_minutes
        await runQuery(
          `UPDATE pomodoro_sessions 
           SET completed = ?, 
               completed_at = datetime(?)
           WHERE id = ?`,
          [completed ? 1 : 0, endTime, sessionId]
        );
        logger.info('番茄钟会话结束', { 
          sessionId, 
          completed, 
          completedAt: endTime 
        });
      }
    } catch (error: any) {
      logger.error('番茄钟会话结束失败', { sessionId, endData, error: error.message });
      throw error;
    }
  }

  /**
   * 计算session的实际累计专注时长（从关联的focus_periods累加）
   * 返回整数分钟数（四舍五入）
   */
  async calculateSessionActualDuration(sessionId: number): Promise<number> {
    try {
      const result = await getQuery<{ total: number }>(`
        SELECT SUM(COALESCE(duration_min, 0)) as total
        FROM focus_periods
        WHERE session_id = ?
      `, [sessionId]);

      const totalMinutes = Math.round(result?.total || 0);
      logger.debug('计算会话实际时长', { sessionId, totalMinutes });
      return totalMinutes;
    } catch (error: any) {
      logger.error('计算会话实际时长失败', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取当前活跃的番茄钟会话（completed_at 为 NULL 表示会话未结束）
   */
  async getActiveSession(userId: number): Promise<PomodoroSession | undefined> {
    try {
      const session = await getQuery<PomodoroSession>(
        'SELECT * FROM pomodoro_sessions WHERE user_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1',
        [userId]
      );

      logger.debug('活跃番茄钟会话查询成功', { userId, hasActiveSession: !!session });
      return session;
    } catch (error: any) {
      logger.error('活跃番茄钟会话查询失败', { userId, error: error.message });
      throw error;
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
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const [
        totalResult,
        completedResult,
        minutesResult,
        dailyStats
      ] = await Promise.all([
        getQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND started_at >= datetime(?)',
          [userId, dateFrom.toISOString()]
        ),
        getQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND completed = 1 AND started_at >= datetime(?)',
          [userId, dateFrom.toISOString()]
        ),
        getQuery<{ total: number }>(
          'SELECT SUM(duration_minutes) as total FROM pomodoro_sessions WHERE user_id = ? AND started_at >= datetime(?)',
          [userId, dateFrom.toISOString()]
        ),
        allQuery<{
          date: string;
          sessions: number;
          completedSessions: number;
          totalMinutes: number;
        }>(`
          SELECT 
            DATE(started_at) as date,
            COUNT(*) as sessions,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedSessions,
            SUM(duration_minutes) as totalMinutes
          FROM pomodoro_sessions
          WHERE user_id = ? AND started_at >= datetime(?)
          GROUP BY DATE(started_at)
          ORDER BY date DESC
        `, [userId, dateFrom.toISOString()])
      ]);

      const totalSessions = totalResult?.count || 0;
      const completedSessions = completedResult?.count || 0;
      const totalMinutes = minutesResult?.total || 0;
      const averageDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

      const stats = {
        totalSessions,
        completedSessions,
        totalMinutes,
        averageDuration,
        dailyStats: dailyStats.map(stat => ({
          date: stat.date,
          sessions: stat.sessions,
          completedSessions: stat.completedSessions,
          totalMinutes: stat.totalMinutes
        }))
      };

      logger.debug('番茄钟统计查询成功', { userId, days, stats });
      return stats;
    } catch (error: any) {
      logger.error('番茄钟统计查询失败', { userId, days, error: error.message });
      throw error;
    }
  }

  /**
   * 获取番茄钟会话统计（按任务）
   */
  async getPomodoroStatsByTask(taskId: number): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    averageDuration: number;
  }> {
    try {
      const [
        totalResult,
        completedResult,
        minutesResult
      ] = await Promise.all([
        getQuery<{ count: number }>('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE task_id = ?', [taskId]),
        getQuery<{ count: number }>('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE task_id = ? AND completed = 1', [taskId]),
        getQuery<{ total: number }>('SELECT SUM(duration_minutes) as total FROM pomodoro_sessions WHERE task_id = ?', [taskId])
      ]);

      const totalSessions = totalResult?.count || 0;
      const completedSessions = completedResult?.count || 0;
      const totalMinutes = minutesResult?.total || 0;
      const averageDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

      const stats = {
        totalSessions,
        completedSessions,
        totalMinutes,
        averageDuration
      };

      logger.debug('任务番茄钟统计查询成功', { taskId, stats });
      return stats;
    } catch (error: any) {
      logger.error('任务番茄钟统计查询失败', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * 删除番茄钟会话
   */
  async delete(sessionId: number): Promise<void> {
    try {
      await runQuery('DELETE FROM pomodoro_sessions WHERE id = ?', [sessionId]);
      logger.info('番茄钟会话删除成功', { sessionId });
    } catch (error: any) {
      logger.error('番茄钟会话删除失败', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * 删除任务的番茄钟会话
   */
  async deleteByTaskId(taskId: number): Promise<number> {
    try {
      const result = await runQuery('DELETE FROM pomodoro_sessions WHERE task_id = ?', [taskId]);
      logger.info('任务番茄钟会话删除成功', { taskId, deletedCount: result.changes });
      return result.changes;
    } catch (error: any) {
      logger.error('任务番茄钟会话删除失败', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * 清理过期的番茄钟会话
   */
  async cleanupExpiredSessions(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await runQuery(
        'DELETE FROM pomodoro_sessions WHERE started_at < datetime(?)',
        [cutoffDate.toISOString()]
      );

      if (result.changes > 0) {
        logger.info('清理过期番茄钟会话', { deletedCount: result.changes, daysToKeep });
      }

      return result.changes;
    } catch (error: any) {
      logger.error('清理过期番茄钟会话失败', { daysToKeep, error: error.message });
      throw error;
    }
  }
}

export default PomodoroRepository;