import { Request, Response } from 'express';
import { FocusPeriodRepository } from '../repositories/focus-period.repository';
import { FocusAnalysisService } from '../services/focus-analysis.service';
import { logger } from '../config/logger';
import { getErrorMessage } from '../utils/error-handler';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    mail: string;
    email: string;
  };
}

export class FocusPeriodController {
  private focusPeriodRepository: FocusPeriodRepository;
  private focusAnalysisService: FocusAnalysisService;

  constructor() {
    this.focusPeriodRepository = new FocusPeriodRepository();
    this.focusAnalysisService = new FocusAnalysisService();
  }

  /**
   * 开始新的细分时间段
   * POST /api/tasks/pomodoro/:sessionId/periods/start
   */
  startPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { start_time } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: '用户未认证' });
        return;
      }

      // 🔧 防御性检查1：清理该用户的僵尸 focus_period（超过2小时未结束的）
      const cleanedCount = await this.focusPeriodRepository.cleanupZombiePeriods(userId, 120);
      if (cleanedCount > 0) {
        logger.warn('启动新时间段前清理了僵尸记录', { 
          userId, 
          sessionId, 
          cleanedCount 
        });
      }

      // 🔧 防御性检查2：检查当前会话是否已有活跃的细分时间段
      const activePeriod = await this.focusPeriodRepository.getActivePeriod(Number(sessionId));
      if (activePeriod) {
        logger.warn('当前会话已有活跃的细分时间段', {
          sessionId,
          activePeriodId: activePeriod.period_id,
          userId
        });
        
        res.status(400).json({
          success: false,
          message: '当前会话已有活跃的细分时间段，请先结束当前时间段',
          data: {
            active_period: activePeriod
          }
        });
        return;
      }

      const periodId = await this.focusPeriodRepository.create({
        session_id: Number(sessionId),
        start_time
      });

      logger.info('细分时间段开始', { 
        sessionId, 
        periodId,
        userId
      });

      res.status(201).json({
        success: true,
        message: '细分时间段已开始',
        data: {
          period_id: periodId,
          session_id: Number(sessionId),
          start_time: start_time || new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('开始细分时间段失败', { 
        sessionId: req.params.sessionId,
        error: getErrorMessage(error),
        stack: error.stack
      });
      res.status(500).json({ 
        success: false,
        message: '开始细分时间段失败', 
        error: getErrorMessage(error) 
      });
    }
  };

  /**
   * 结束细分时间段
   * POST /api/tasks/pomodoro/:sessionId/periods/:periodId/end
   */
  endPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { periodId } = req.params;
      const { end_time, is_interrupted } = req.body;

      if (typeof is_interrupted !== 'boolean') {
        res.status(400).json({ message: 'is_interrupted 字段必须是布尔值' });
        return;
      }

      await this.focusPeriodRepository.endPeriod(Number(periodId), {
        end_time,
        is_interrupted
      });

      logger.info('细分时间段结束', { 
        periodId,
        isInterrupted: is_interrupted,
        userId: (req as any).user?.userId 
      });

      res.json({
        message: '细分时间段已结束',
        data: {
          period_id: Number(periodId),
          end_time: end_time || new Date().toISOString(),
          is_interrupted
        }
      });
    } catch (error: any) {
      logger.error('结束细分时间段失败', { 
        periodId: req.params.periodId,
        error: getErrorMessage(error) 
      });
      res.status(500).json({ message: '结束细分时间段失败' });
    }
  };

  /**
   * 获取会话的所有细分时间段
   * GET /api/tasks/pomodoro/:sessionId/periods
   */
  getSessionPeriods = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const periods = await this.focusPeriodRepository.findBySessionId(Number(sessionId));

      logger.info('查询会话细分时间段', { 
        sessionId,
        periodCount: periods.length,
        userId: (req as any).user?.userId 
      });

      res.json({
        message: '查询成功',
        data: {
          session_id: Number(sessionId),
          periods,
          total: periods.length
        }
      });
    } catch (error: any) {
      logger.error('查询会话细分时间段失败', { 
        sessionId: req.params.sessionId,
        error: getErrorMessage(error) 
      });
      res.status(500).json({ message: '查询细分时间段失败' });
    }
  };

  /**
   * 获取当前活跃的细分时间段
   * GET /api/tasks/pomodoro/:sessionId/periods/active
   */
  getActivePeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const period = await this.focusPeriodRepository.getActivePeriod(Number(sessionId));

      logger.info('查询活跃细分时间段', { 
        sessionId,
        hasActivePeriod: !!period,
        userId: (req as any).user?.userId 
      });

      res.json({
        message: '查询成功',
        data: {
          session_id: Number(sessionId),
          active_period: period || null
        }
      });
    } catch (error: any) {
      logger.error('查询活跃细分时间段失败', { 
        sessionId: req.params.sessionId,
        error: getErrorMessage(error) 
      });
      res.status(500).json({ message: '查询活跃细分时间段失败' });
    }
  };

  /**
   * 获取会话的细分时间段统计
   * GET /api/tasks/pomodoro/:sessionId/periods/stats
   */
  getSessionPeriodStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const stats = await this.focusPeriodRepository.getSessionPeriodStats(Number(sessionId));

      logger.info('查询会话细分时间段统计', { 
        sessionId,
        stats,
        userId: (req as any).user?.userId 
      });

      res.json({
        message: '查询成功',
        data: {
          session_id: Number(sessionId),
          ...stats
        }
      });
    } catch (error: any) {
      logger.error('查询会话细分时间段统计失败', { 
        sessionId: req.params.sessionId,
        error: getErrorMessage(error) 
      });
      res.status(500).json({ message: '查询细分时间段统计失败' });
    }
  };

  /**
   * 获取专注度统计数据
   * GET /api/tasks/pomodoro/focus-stats
   */
  getFocusStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { timeframe = 'week' } = req.query;

      if (timeframe !== 'week' && timeframe !== 'month') {
        res.status(400).json({ 
          success: false,
          message: 'timeframe 参数必须是 week 或 month' 
        });
        return;
      }

      logger.info('获取专注度统计数据', { userId, timeframe });

      const stats = await this.focusAnalysisService.getFocusStats(userId, timeframe as 'week' | 'month');

      res.json({
        success: true,
        message: '获取专注度统计数据成功',
        data: stats
      });
    } catch (error: any) {
      logger.error('获取专注度统计数据失败', { 
        userId: (req as any).user?.id,
        error: getErrorMessage(error) 
      });
      res.status(500).json({ 
        success: false,
        message: '获取专注度统计数据失败',
        error: getErrorMessage(error) 
      });
    }
  };
}

export default FocusPeriodController;
