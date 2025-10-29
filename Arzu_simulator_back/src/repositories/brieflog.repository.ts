import { runQuery, getQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';

export enum BriefType {
  DELETE_REASON = 1,
  CATEGORY_CHANGE = 2,
  PRIORITY_CHANGE = 3,
  DUE_DATE_CHANGE = 4,
  CONTINUE_WORK_REMARK = 5,
  LEAVE_REMARK = 6,
  TASK_COMPLETE_REMARK = 7,
  REFLECTION_REMARK = 8
}

export interface BriefLog {
  debrief_id: number;
  session_id: number | null;
  task_id: number;
  user_id: number;
  brief_type: BriefType;
  brief_content: string;
  created_at: string;
}

export interface CreateBriefLogDto {
  session_id?: number;
  task_id: number;
  user_id: number;
  brief_type: BriefType;
  brief_content: string;
}

export class BriefLogRepository {
  async create(data: CreateBriefLogDto): Promise<BriefLog> {
    try {
      const { session_id, task_id, user_id, brief_type, brief_content } = data;
      
      const result = await runQuery(
        `INSERT INTO task_brieflogs (session_id, task_id, user_id, brief_type, brief_content, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [session_id || null, task_id, user_id, brief_type, brief_content]
      );

      const briefLog = await this.findById(result.lastID);
      if (!briefLog) {
        throw new Error('日志创建成功但无法获取');
      }

      logger.info('任务变更日志创建成功', { 
        debrief_id: briefLog.debrief_id, 
        task_id, 
        user_id, 
        brief_type 
      });

      return briefLog;
    } catch (error: any) {
      logger.error('创建任务变更日志失败', { data, error: error.message });
      throw error;
    }
  }

  async createBatch(logs: CreateBriefLogDto[]): Promise<BriefLog[]> {
    try {
      const createdLogs: BriefLog[] = [];
      
      for (const logData of logs) {
        const log = await this.create(logData);
        createdLogs.push(log);
      }

      logger.info('批量创建任务变更日志成功', { count: createdLogs.length });
      return createdLogs;
    } catch (error: any) {
      logger.error('批量创建任务变更日志失败', { count: logs.length, error: error.message });
      throw error;
    }
  }

  async findById(debrief_id: number): Promise<BriefLog | null> {
    try {
      const result = await getQuery<BriefLog>(
        'SELECT * FROM task_brieflogs WHERE debrief_id = ?',
        [debrief_id]
      );
      return result || null;
    } catch (error: any) {
      logger.error('查询任务变更日志失败', { debrief_id, error: error.message });
      throw error;
    }
  }

  async findByTaskId(task_id: number): Promise<BriefLog[]> {
    try {
      const result = await allQuery<BriefLog>(
        'SELECT * FROM task_brieflogs WHERE task_id = ? ORDER BY created_at DESC',
        [task_id]
      );
      return result;
    } catch (error: any) {
      logger.error('查询任务变更日志失败', { task_id, error: error.message });
      throw error;
    }
  }

  async findByUserId(user_id: number, limit: number = 50): Promise<BriefLog[]> {
    try {
      const result = await allQuery<BriefLog>(
        'SELECT * FROM task_brieflogs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [user_id, limit]
      );
      return result;
    } catch (error: any) {
      logger.error('查询用户任务变更日志失败', { user_id, error: error.message });
      throw error;
    }
  }

  async getHabitStatsByDateRange(user_id: number, startDate: string, endDate: string): Promise<BriefLog[]> {
    try {
      const result = await allQuery<BriefLog>(
        `SELECT * FROM task_brieflogs 
         WHERE user_id = ? 
         AND brief_type IN (1, 2, 3, 4)
         AND created_at >= ? 
         AND created_at <= ?
         ORDER BY created_at ASC`,
        [user_id, startDate, endDate]
      );
      return result;
    } catch (error: any) {
      logger.error('查询习惯统计数据失败', { user_id, startDate, endDate, error: error.message });
      throw error;
    }
  }
}

export default BriefLogRepository;
