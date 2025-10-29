import BriefLogRepository, { CreateBriefLogDto, BriefLog } from '../repositories/brieflog.repository';
import { logger } from '../config/logger';

export class BriefLogService {
  private briefLogRepository: BriefLogRepository;

  constructor() {
    this.briefLogRepository = new BriefLogRepository();
  }

  async createBriefLog(data: CreateBriefLogDto): Promise<BriefLog> {
    try {
      logger.info('创建brieflog', { 
        task_id: data.task_id, 
        user_id: data.user_id, 
        brief_type: data.brief_type 
      });

      const briefLog = await this.briefLogRepository.create(data);

      logger.info('Brieflog创建成功', { 
        debrief_id: briefLog.debrief_id, 
        task_id: data.task_id 
      });

      return briefLog;
    } catch (error: any) {
      logger.error('创建brieflog失败', { data, error: error.message });
      throw error;
    }
  }

  async getBriefLogsByTaskId(taskId: number): Promise<BriefLog[]> {
    try {
      logger.info('获取任务brieflog', { taskId });
      const briefLogs = await this.briefLogRepository.findByTaskId(taskId);
      return briefLogs;
    } catch (error: any) {
      logger.error('获取任务brieflog失败', { taskId, error: error.message });
      throw error;
    }
  }

  async getBriefLogsByUserId(userId: number, limit: number = 50): Promise<BriefLog[]> {
    try {
      logger.info('获取用户brieflog', { userId, limit });
      const briefLogs = await this.briefLogRepository.findByUserId(userId, limit);
      return briefLogs;
    } catch (error: any) {
      logger.error('获取用户brieflog失败', { userId, error: error.message });
      throw error;
    }
  }
}
