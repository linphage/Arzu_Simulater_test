import { Response, NextFunction } from 'express';
import { BriefLogService } from '../services/brieflog.service';
import { ValidationError } from '../utils/error.utils';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/error.utils';
import { AuthRequest } from './auth.controller';

export class BriefLogController {
  private briefLogService: BriefLogService;

  constructor() {
    this.briefLogService = new BriefLogService();
  }

  createBriefLog = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    
    logger.info('收到创建brieflog请求', { 
      userId, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });

    const { session_id, task_id, brief_type, brief_content } = req.body;

    if (!task_id || !brief_type || !brief_content) {
      throw new ValidationError('缺少必填字段: task_id, brief_type, brief_content');
    }

    if (brief_content.trim() === '') {
      throw new ValidationError('brief_content 不能为空');
    }

    if (![1, 2, 3, 4, 5, 6, 7, 8].includes(brief_type)) {
      throw new ValidationError('brief_type 必须是 1-8 之间的整数');
    }

    try {
      const briefLog = await this.briefLogService.createBriefLog({
        session_id,
        task_id,
        user_id: userId,
        brief_type,
        brief_content: brief_content.trim()
      });

      logger.info('Brieflog创建成功', { 
        debrief_id: briefLog.debrief_id, 
        userId, 
        task_id,
        brief_type
      });

      res.status(201).json({
        success: true,
        message: 'Brieflog创建成功',
        data: briefLog
      });

    } catch (error: any) {
      logger.error('Brieflog创建失败', { 
        userId, 
        task_id,
        brief_type,
        error: error.message 
      });
      
      throw error;
    }
  });

  getBriefLogsByTaskId = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      throw new ValidationError('无效的 taskId');
    }

    try {
      const briefLogs = await this.briefLogService.getBriefLogsByTaskId(taskId);

      res.status(200).json({
        success: true,
        message: '获取任务brieflog成功',
        data: briefLogs
      });

    } catch (error: any) {
      logger.error('获取任务brieflog失败', { 
        userId, 
        taskId,
        error: error.message 
      });
      
      throw error;
    }
  });

  getBriefLogsByUserId = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    try {
      const briefLogs = await this.briefLogService.getBriefLogsByUserId(userId, limit);

      res.status(200).json({
        success: true,
        message: '获取用户brieflog成功',
        data: briefLogs
      });

    } catch (error: any) {
      logger.error('获取用户brieflog失败', { 
        userId,
        error: error.message 
      });
      
      throw error;
    }
  });
}
