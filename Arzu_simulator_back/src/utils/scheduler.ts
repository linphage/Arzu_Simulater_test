import cron from 'node-cron';
import { runQuery } from '../database/connection';
import { logger } from '../config/logger';

export function startScheduledTasks() {
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

  logger.info('定时任务已启动：每月1日凌晨0:00（东八区）重置补打卡次数');
}
