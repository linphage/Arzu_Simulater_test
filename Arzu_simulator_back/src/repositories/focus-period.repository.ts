import { getQuery, runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';

export interface FocusPeriod {
  period_id: number;
  session_id: number;
  start_time: string;
  end_time: string | null;
  duration_min: number | null;
  is_interrupted: boolean | null;
  created_at: string;
}

export interface CreateFocusPeriodDto {
  session_id: number;
  start_time?: string;
}

export interface EndFocusPeriodDto {
  end_time?: string;
  is_interrupted: boolean;
}

export class FocusPeriodRepository {
  /**
   * 创建新的细分时间段
   */
  async create(data: CreateFocusPeriodDto): Promise<number> {
    try {
      const { session_id, start_time } = data;
      const startTime = start_time || new Date().toISOString();

      // 从 pomodoro_sessions 获取 user_id 和 task_id
      const session = await getQuery<{ user_id: number; task_id: number | null }>(
        'SELECT user_id, task_id FROM pomodoro_sessions WHERE id = ?',
        [session_id]
      );

      if (!session) {
        throw new Error('番茄钟会话不存在');
      }

      const result = await runQuery(
        `INSERT INTO focus_periods (session_id, user_id, task_id, start_time, created_at) 
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [session_id, session.user_id, session.task_id, startTime]
      );

      logger.info('细分时间段创建成功', { 
        periodId: result.lastID, 
        sessionId: session_id,
        userId: session.user_id,
        taskId: session.task_id,
        startTime
      });

      return result.lastID!;
    } catch (error: any) {
      logger.error('细分时间段创建失败', { 
        data, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 结束细分时间段
   */
  async endPeriod(periodId: number, data: EndFocusPeriodDto): Promise<void> {
    try {
      const { end_time, is_interrupted } = data;
      const endTime = end_time || new Date().toISOString();

      // 先获取开始时间以计算duration_min
      const period = await this.findById(periodId);
      if (!period) {
        throw new Error('细分时间段不存在');
      }

      // 计算时长（分钟，保留一位小数）
      // SQLite datetime 存储的是 UTC 时间，但格式为 "YYYY-MM-DD HH:MM:SS"（无时区标识）
      // 需要手动添加 'Z' 后缀，让 JavaScript 正确解析为 UTC
      // PostgreSQL 返回的可能是 Date 对象或 ISO 字符串
      const startTimeStr = String(period.start_time);
      const startTimeUTC = startTimeStr.includes('T') 
        ? startTimeStr 
        : startTimeStr.replace(' ', 'T') + 'Z';
      
      const endTimeStr = String(endTime);
      const endTimeUTC = endTimeStr.includes('T') 
        ? endTimeStr 
        : endTimeStr.replace(' ', 'T') + 'Z';
      
      const startMs = new Date(startTimeUTC).getTime();
      const endMs = new Date(endTimeUTC).getTime();
      const diffMs = endMs - startMs;
      const durationMin = Math.round(diffMs / 60000 * 10) / 10;

      logger.debug('计算细分时间段时长', {
        periodId,
        startTime: startTimeStr,
        endTime: endTimeStr,
        startMs,
        endMs,
        diffMs,
        durationMin
      });

      await runQuery(
        `UPDATE focus_periods 
         SET end_time = ?, 
             duration_min = ?,
             is_interrupted = ?
         WHERE period_id = ?`,
        [endTime, durationMin, is_interrupted, periodId]
      );

      logger.info('细分时间段结束', { 
        periodId, 
        endTime,
        durationMin,
        isInterrupted: is_interrupted
      });
    } catch (error: any) {
      logger.error('细分时间段结束失败', { 
        periodId, 
        data, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 根据ID查找细分时间段
   */
  async findById(periodId: number): Promise<FocusPeriod | undefined> {
    const period = await getQuery<FocusPeriod>(
      'SELECT * FROM focus_periods WHERE period_id = ?',
      [periodId]
    );

    if (period) {
      logger.debug('细分时间段查找成功', { periodId });
    } else {
      logger.debug('细分时间段未找到', { periodId });
    }

    return period;
  }

  /**
   * 获取会话的所有细分时间段
   */
  async findBySessionId(sessionId: number): Promise<FocusPeriod[]> {
    try {
      const periods = await allQuery<FocusPeriod>(
        'SELECT * FROM focus_periods WHERE session_id = ? ORDER BY start_time ASC',
        [sessionId]
      );

      logger.debug('会话细分时间段查询成功', { 
        sessionId, 
        periodCount: periods.length 
      });

      return periods;
    } catch (error: any) {
      logger.error('会话细分时间段查询失败', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取当前活跃的细分时间段（未结束的）
   */
  async getActivePeriod(sessionId: number): Promise<FocusPeriod | undefined> {
    try {
      const period = await getQuery<FocusPeriod>(
        `SELECT * FROM focus_periods 
         WHERE session_id = ? AND end_time IS NULL 
         ORDER BY start_time DESC 
         LIMIT 1`,
        [sessionId]
      );

      logger.debug('活跃细分时间段查询', { 
        sessionId, 
        hasActivePeriod: !!period 
      });

      return period;
    } catch (error: any) {
      logger.error('活跃细分时间段查询失败', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取会话的细分时间段统计
   */
  async getSessionPeriodStats(sessionId: number): Promise<{
    totalPeriods: number;
    interruptedPeriods: number;
    totalFocusMinutes: number;
    averagePeriodMinutes: number;
  }> {
    try {
      const result = await getQuery<{
        totalPeriods: number;
        interruptedPeriods: number;
        totalFocusMinutes: number;
      }>(`
        SELECT 
          COUNT(*) as totalPeriods,
          SUM(CASE WHEN is_interrupted = true THEN 1 ELSE 0 END) as interruptedPeriods,
          SUM(COALESCE(duration_min, 0)) as totalFocusMinutes
        FROM focus_periods
        WHERE session_id = ?
      `, [sessionId]);

      const totalPeriods = result?.totalPeriods || 0;
      const interruptedPeriods = result?.interruptedPeriods || 0;
      const totalFocusMinutes = result?.totalFocusMinutes || 0;
      const averagePeriodMinutes = totalPeriods > 0 
        ? Math.round(totalFocusMinutes / totalPeriods) 
        : 0;

      const stats = {
        totalPeriods,
        interruptedPeriods,
        totalFocusMinutes,
        averagePeriodMinutes
      };

      logger.debug('会话细分时间段统计查询成功', { sessionId, stats });
      return stats;
    } catch (error: any) {
      logger.error('会话细分时间段统计查询失败', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 删除会话的所有细分时间段
   */
  async deleteBySessionId(sessionId: number): Promise<number> {
    try {
      const result = await runQuery(
        'DELETE FROM focus_periods WHERE session_id = ?',
        [sessionId]
      );

      logger.info('会话细分时间段删除成功', { 
        sessionId, 
        deletedCount: result.changes 
      });

      return result.changes;
    } catch (error: any) {
      logger.error('会话细分时间段删除失败', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }

  async getFocusStatsByDateRange(userId: number, startDate: string, endDate: string): Promise<FocusPeriod[]> {
    try {
      const periods = await allQuery<FocusPeriod>(
        `SELECT fp.* 
         FROM focus_periods fp
         INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
         WHERE ps.user_id = ?
           AND fp.created_at IS NOT NULL
         ORDER BY fp.created_at ASC`,
        [userId]
      );

      logger.debug('按日期范围查询专注时段成功', { 
        userId, 
        startDate, 
        endDate, 
        count: periods.length 
      });

      return periods;
    } catch (error: any) {
      logger.error('按日期范围查询专注时段失败', { 
        userId, 
        startDate, 
        endDate, 
        error: error.message 
      });
      throw error;
    }
  }
}

export default FocusPeriodRepository;
