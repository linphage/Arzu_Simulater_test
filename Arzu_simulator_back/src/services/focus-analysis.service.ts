import { FocusPeriodRepository } from '../repositories/focus-period.repository';
import { PomodoroRepository } from '../repositories/pomodoro.repository';
import { logger } from '../config/logger';
import { ApiError } from '../utils/error.utils';
import { getErrorMessage } from '../utils/error-handler';

export class FocusAnalysisService {
  private focusPeriodRepository: FocusPeriodRepository;
  private pomodoroRepository: PomodoroRepository;

  constructor() {
    this.focusPeriodRepository = new FocusPeriodRepository();
    this.pomodoroRepository = new PomodoroRepository();
  }

  async getFocusStats(userId: number, timeframe: 'week' | 'month'): Promise<{
    keyMetrics: {
      avgFocusTime: number;
      avgInterruptions: number;
      focusIndex: number;
    };
    dailyData: Array<{
      date: string;
      sessionDuration: number;
      interruptions: number;
      focusIndex: number;
    }>;
  }> {
    try {
      logger.info('获取专注度统计数据', { userId, timeframe });

      const getWeekRange = (): { start: Date; end: Date } => {
        const now = new Date();
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        
        const monday = new Date(now);
        monday.setDate(now.getDate() + daysToMonday);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return { start: monday, end: sunday };
      };

      const getMonthRange = (): { start: Date; end: Date } => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
      };

      const { start, end } = timeframe === 'week' ? getWeekRange() : getMonthRange();
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      const allFocusPeriods = await this.focusPeriodRepository.getFocusStatsByDateRange(userId, startStr, endStr);
      const allPomodoroSessions = await this.pomodoroRepository.findByUserId(userId, { limit: 1000 });

      logger.info('📊 [专注度统计] 原始数据查询结果', {
        userId,
        timeframe,
        dateRange: { start: startStr, end: endStr },
        allFocusPeriodsCount: allFocusPeriods.length,
        allPomodoroSessionsCount: allPomodoroSessions.sessions.length,
        sampleFocusPeriod: allFocusPeriods[0] ? {
          period_id: (allFocusPeriods[0] as any).period_id,
          created_at: allFocusPeriods[0].created_at,
          duration_min: allFocusPeriods[0].duration_min,
          start_time: (allFocusPeriods[0] as any).start_time,
          end_time: (allFocusPeriods[0] as any).end_time
        } : null
      });

      const focusPeriods = allFocusPeriods.filter(fp => {
        if (!fp.created_at) {
          logger.debug('📊 [专注度统计] Focus period 过滤: created_at 为空', { period_id: (fp as any).period_id });
          return false;
        }
        if (!fp.duration_min || fp.duration_min > 300) {
          logger.debug('📊 [专注度统计] Focus period 过滤: duration_min 无效', { 
            period_id: (fp as any).period_id, 
            duration_min: fp.duration_min 
          });
          return false;
        }
        const createdAtStr = String(fp.created_at);
        const createdDateStr = createdAtStr.includes('T') 
          ? createdAtStr 
          : createdAtStr.replace(' ', 'T') + 'Z';
        const createdDate = new Date(createdDateStr);
        const inRange = createdDate >= start && createdDate <= end;
        
        logger.debug('📊 [专注度统计] Focus period 时间检查', {
          period_id: (fp as any).period_id,
          created_at: createdAtStr,
          createdDate: createdDate.toISOString(),
          rangeStart: start.toISOString(),
          rangeEnd: end.toISOString(),
          inRange
        });
        
        return inRange;
      });

      const pomodoroSessions = allPomodoroSessions.sessions.filter(ps => {
        const startedAt = (ps as any).started_at || ps.startedAt;
        if (!startedAt) return false;
        const startedAtStr = String(startedAt);
        const startedDateStr = startedAtStr.includes('T') 
          ? startedAtStr 
          : startedAtStr.replace(' ', 'T') + 'Z';
        const startedDate = new Date(startedDateStr);
        const inRange = startedDate >= start && startedDate <= end;
        
        logger.debug('📊 [专注度统计] 会话时间检查', {
          sessionId: (ps as any).id,
          startedAt: startedAtStr,
          startedDate: startedDate.toISOString(),
          rangeStart: start.toISOString(),
          rangeEnd: end.toISOString(),
          inRange
        });
        
        return inRange;
      });

      const totalFocusTime = focusPeriods.reduce((sum, fp) => sum + (fp.duration_min || 0), 0);
      const totalInterruptions = focusPeriods.filter(fp => Boolean(fp.is_interrupted)).length;
      const totalPlannedTime = pomodoroSessions.reduce((sum, ps) => sum + ((ps as any).duration_minutes || 0), 0);

      logger.info('📊 [专注度统计] 数据汇总', {
        userId,
        timeframe,
        focusPeriodsCount: focusPeriods.length,
        pomodoroSessionsCount: pomodoroSessions.length,
        totalFocusTime,
        totalPlannedTime,
        totalInterruptions
      });

      const now = new Date();
      const daysPassedInPeriod = timeframe === 'week'
        ? Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        : now.getDate();

      const avgFocusTime = daysPassedInPeriod > 0 
        ? Math.round(totalFocusTime / daysPassedInPeriod) 
        : 0;
      
      const avgInterruptions = daysPassedInPeriod > 0
        ? Math.round((totalInterruptions / daysPassedInPeriod) * 10) / 10
        : 0;

      const focusIndex = totalPlannedTime > 0
        ? Math.min(100, Math.round((totalFocusTime / totalPlannedTime) * 100))
        : 0;

      const numDays = timeframe === 'week' ? 7 : 30;
      const dailyData = [];

      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        currentDate.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);

        const dayFocusPeriods = focusPeriods.filter(fp => {
          if (!fp.created_at || !fp.duration_min || fp.duration_min > 300) return false;
          const createdAtStr = String(fp.created_at);
          const createdDateStr = createdAtStr.includes('T') 
            ? createdAtStr 
            : createdAtStr.replace(' ', 'T') + 'Z';
          const createdDate = new Date(createdDateStr);
          return createdDate >= currentDate && createdDate < nextDate;
        });

        const dayPomodoroSessions = pomodoroSessions.filter(ps => {
          const startedAt = (ps as any).started_at || ps.startedAt;
          if (!startedAt) return false;
          const startedAtStr = String(startedAt);
          const startedDateStr = startedAtStr.includes('T') 
            ? startedAtStr 
            : startedAtStr.replace(' ', 'T') + 'Z';
          const startedDate = new Date(startedDateStr);
          return startedDate >= currentDate && startedDate < nextDate;
        });

        const dayFocusTime = dayFocusPeriods.reduce((sum, fp) => sum + (fp.duration_min || 0), 0);
        const dayInterruptions = dayFocusPeriods.filter(fp => Boolean(fp.is_interrupted)).length;
        const dayPlannedTime = dayPomodoroSessions.reduce((sum, ps) => sum + ((ps as any).duration_minutes || 0), 0);
        const dayFocusIndex = dayPlannedTime > 0 
          ? Math.min(100, Math.round((dayFocusTime / dayPlannedTime) * 100))
          : 0;

        if (dayFocusPeriods.length > 0 || dayPomodoroSessions.length > 0) {
          logger.debug('📊 [专注度统计] 每日数据', {
            date: currentDate.toISOString().split('T')[0],
            focusPeriodsCount: dayFocusPeriods.length,
            pomodoroSessionsCount: dayPomodoroSessions.length,
            dayFocusTime,
            dayPlannedTime,
            dayFocusIndex
          });
        }

        const dateStr = timeframe === 'week'
          ? `${currentDate.getMonth() + 1}/${currentDate.getDate()}`
          : `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;

        dailyData.push({
          date: dateStr,
          sessionDuration: Math.round(dayFocusTime),
          interruptions: dayInterruptions,
          focusIndex: dayFocusIndex
        });
      }

      logger.info('📊 [专注度统计] 每日数据汇总', {
        userId,
        timeframe,
        totalDays: dailyData.length,
        daysWithData: dailyData.filter(d => d.sessionDuration > 0 || d.focusIndex > 0).length
      });

      const result = {
        keyMetrics: {
          avgFocusTime,
          avgInterruptions,
          focusIndex
        },
        dailyData
      };

      logger.info('专注度统计数据获取成功', { userId, timeframe, keyMetrics: result.keyMetrics });
      return result;
    } catch (error) {
      logger.error('获取专注度统计数据失败', { userId, timeframe, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('获取专注度统计数据失败', 500);
    }
  }
}

export default FocusAnalysisService;
