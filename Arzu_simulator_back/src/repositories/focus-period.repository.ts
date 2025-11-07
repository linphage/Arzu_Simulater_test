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

      // 检查是否已结束
      if (period.end_time) {
        logger.warn('细分时间段已结束，跳过重复操作', { 
          periodId, 
          existingEndTime: period.end_time 
        });
        return;
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
      let durationMin = Math.round(diffMs / 60000 * 10) / 10;

      // 🔧 防御性检查：验证 duration_min 是否合理
      const MAX_DURATION = 120; // 最大 120 分钟
      if (durationMin < 0) {
        logger.error('计算的时长为负数，数据异常', {
          periodId,
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMin
        });
        durationMin = 0;
      } else if (durationMin > MAX_DURATION) {
        logger.warn('计算的时长超过合理范围，自动限制', {
          periodId,
          originalDuration: durationMin,
          cappedDuration: MAX_DURATION,
          startTime: startTimeStr,
          endTime: endTimeStr
        });
        durationMin = MAX_DURATION;
      }

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

  /**
   * 获取用户所有未结束的细分时间段（跨会话）
   * 用于检测僵尸记录
   */
  async getUnfinishedPeriodsByUser(userId: number): Promise<FocusPeriod[]> {
    try {
      const periods = await allQuery<FocusPeriod>(
        `SELECT fp.* 
         FROM focus_periods fp
         INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
         WHERE ps.user_id = ? 
           AND fp.end_time IS NULL
         ORDER BY fp.start_time ASC`,
        [userId]
      );

      if (periods.length > 0) {
        logger.warn('发现用户有未结束的细分时间段', { 
          userId, 
          unfinishedCount: periods.length,
          periodIds: periods.map(p => p.period_id)
        });
      }

      return periods;
    } catch (error: any) {
      logger.error('查询用户未结束的细分时间段失败', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 自动清理僵尸细分时间段
   * 将超时的未结束 period 标记为中断并设置合理的结束时间
   * @param userId 用户ID
   * @param maxDurationMinutes 最大允许时长（分钟），默认120分钟
   * @returns 清理的记录数
   */
  async cleanupZombiePeriods(userId: number, maxDurationMinutes: number = 120): Promise<number> {
    try {
      const unfinishedPeriods = await this.getUnfinishedPeriodsByUser(userId);
      
      if (unfinishedPeriods.length === 0) {
        return 0;
      }

      const now = new Date();
      let cleanedCount = 0;

      for (const period of unfinishedPeriods) {
        const startTime = new Date(period.start_time);
        const elapsedMinutes = (now.getTime() - startTime.getTime()) / 60000;

        // 如果已经超过最大时长，自动结束
        if (elapsedMinutes > maxDurationMinutes) {
          // 设置结束时间为开始时间 + 最大时长（避免出现超长时段）
          const endTime = new Date(startTime.getTime() + maxDurationMinutes * 60000);
          
          await this.endPeriod(period.period_id, {
            end_time: endTime.toISOString(),
            is_interrupted: true
          });

          cleanedCount++;

          logger.warn('自动清理僵尸细分时间段', { 
            periodId: period.period_id,
            sessionId: period.session_id,
            userId,
            elapsedMinutes: Math.round(elapsedMinutes),
            cappedDuration: maxDurationMinutes
          });
        }
      }

      if (cleanedCount > 0) {
        logger.info('僵尸细分时间段清理完成', { 
          userId, 
          cleanedCount,
          totalUnfinished: unfinishedPeriods.length
        });
      }

      return cleanedCount;
    } catch (error: any) {
      logger.error('清理僵尸细分时间段失败', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 验证并修正异常的 duration_min 值
   * @param periodId 时间段ID
   * @param maxDurationMinutes 最大允许时长，默认120分钟
   */
  async validateAndFixDuration(periodId: number, maxDurationMinutes: number = 120): Promise<void> {
    try {
      const period = await this.findById(periodId);
      
      if (!period || !period.duration_min) {
        return;
      }

      // 如果 duration_min 超过合理范围
      if (period.duration_min > maxDurationMinutes) {
        logger.warn('发现异常的 duration_min 值，进行修正', { 
          periodId,
          originalDuration: period.duration_min,
          maxAllowed: maxDurationMinutes
        });

        // 将其限制为最大值
        await runQuery(
          `UPDATE focus_periods 
           SET duration_min = ? 
           WHERE period_id = ?`,
          [maxDurationMinutes, periodId]
        );

        logger.info('异常 duration_min 已修正', { 
          periodId,
          fixedDuration: maxDurationMinutes
        });
      }
    } catch (error: any) {
      logger.error('验证并修正 duration_min 失败', { 
        periodId, 
        error: error.message 
      });
      throw error;
    }
  }
}

export default FocusPeriodRepository;
