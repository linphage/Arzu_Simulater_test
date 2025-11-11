import cron from 'node-cron';
import { runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';
import { TaskGenerationService } from '../services/taskGeneration.service';

export function startScheduledTasks() {
  // 原有任务：每月1日凌晨0:00重置补打卡次数
  cron.schedule('0 0 1 * *', async () => {
    try {
      logger.info('开始执行每月重置补打卡次数任务');
      
      await runQuery('UPDATE users SET reward_count = 0', []);
      
      logger.info('每月补打卡次数重置成功');
    } catch (error: any) {
      logger.error('每月补打卡次数重置失败', { error: error.message });
    }
  }, {
    timezone: 'Asia/Shanghai'
  });

  // 新增任务：每周一 00:00 (东八区) 生成下一周重复任务
  cron.schedule('0 0 * * 1', async () => {
    try {
      logger.info('开始执行每周重复任务生成...');

      // 1. 查找所有"模板"任务（parent_task_id 为 NULL 且 repeat_days 不为空）
      const templateTasks = await allQuery(
        `SELECT * FROM tasks 
         WHERE parent_task_id IS NULL 
         AND repeat_days IS NOT NULL 
         AND repeat_days != '[]' 
         AND repeat_days != '0'
         AND repeat_days != 'null'
         AND deleted_at IS NULL`,
        []
      );

      logger.info(`找到 ${templateTasks.length} 个模板任务`);

      // 2. 为每个模板生成下一周的任务
      let successCount = 0;
      let failCount = 0;

      for (const template of templateTasks) {
        try {
          await TaskGenerationService.generateWeeklyTasks(template, 'next_week');
          successCount++;
        } catch (error: any) {
          failCount++;
          logger.error('生成任务实例失败', { 
            templateId: template.id, 
            title: template.title,
            error: error.message 
          });
        }
      }

      logger.info('每周任务生成完毕', { 
        totalTemplates: templateTasks.length,
        successCount,
        failCount
      });
    } catch (error: any) {
      logger.error('每周重复任务生成失败', { error: error.message });
    }
  }, {
    timezone: 'Asia/Shanghai'  // 使用东八区时间
  });

  logger.info('定时任务已启动：');
  logger.info('  - 每月1日凌晨0:00（东八区）：重置补打卡次数');
  logger.info('  - 每周一凌晨0:00（东八区）：生成下一周重复任务');
}
