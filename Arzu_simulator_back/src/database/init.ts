import { logger } from '../config/logger';
import { runQuery, getDatabase, getQuery } from './connection';
import fs from 'fs';
import path from 'path';

// 读取SQL文件并执行
const executeSqlFile = async (filePath: string): Promise<void> => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const db = await getDatabase();
    
    // 直接执行整个SQL文件
    await new Promise<void>((resolve, reject) => {
      db.exec(sql, function(err) {
        if (err) {
          logger.error('SQL文件执行失败', { 
            file: path.basename(filePath), 
            error: err.message 
          });
          reject(err);
        } else {
          logger.info(`SQL文件执行成功: ${path.basename(filePath)}`);
          resolve();
        }
      });
    });
    
  } catch (error) {
    logger.error(`SQL文件执行失败: ${path.basename(filePath)}`, { error: error.message });
    throw error;
  }
};

// 初始化数据库 - 适配loginplan.md规范
export const initDb = async (): Promise<void> => {
  try {
    logger.info('开始初始化数据库...');
    
    // 检查数据库是否已存在且结构正确
    const dbExists = await checkDbInitialized();
    if (dbExists) {
      logger.info('数据库已正确初始化，跳过迁移');
      return;
    }
    
    // 如果数据库未初始化，提示用户手动运行迁移
    logger.warn('数据库未初始化！请手动运行迁移脚本：node scripts/run-migration.js');
    logger.warn('或确保数据库文件已包含所有必需的表结构');
    
    logger.info('数据库初始化检查完成');
  } catch (error) {
    logger.error('数据库初始化检查失败', { error: error.message });
    // 不抛出错误，让应用继续运行
  }
};

// 检查数据库是否需要初始化 - 检查loginplan.md规范的表结构
export const checkDbInitialized = async (): Promise<boolean> => {
  try {
    // 检查是否存在users表且包含loginplan.md规范的字段
    const usersFieldsResult = await getQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM pragma_table_info('users') 
      WHERE name IN ('user_id', 'username', 'mail', 'password_hash')
    `);
    
    const usersFieldsCorrect = usersFieldsResult && usersFieldsResult.count === 4;
    
    // 检查tasks表是否存在
    const tasksTableResult = await getQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='table' AND name='tasks'
    `);
    
    const tasksTableExists = tasksTableResult && tasksTableResult.count === 1;
    
    // 数据库已初始化：users字段正确且tasks表存在
    const initialized = usersFieldsCorrect && tasksTableExists;
    
    if (initialized) {
      logger.info('数据库已正确初始化');
    }
    
    return initialized;
  } catch (error) {
    logger.error('检查数据库状态时出错', { error: error.message });
    return false;
  }
};

// 重置数据库（仅用于开发环境）
export const resetDb = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('不能在生产环境中重置数据库');
  }
  
  try {
    logger.warn('开始重置数据库...');
    
    // 获取所有表名
    const tables = await runQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    // 删除所有表
    for (const table of tables as any[]) {
      await runQuery(`DROP TABLE IF EXISTS ${table.name}`);
    }
    
    // 重新初始化
    await initDb();
    
    logger.info('数据库重置完成');
  } catch (error) {
    logger.error('数据库重置失败', { error: error.message });
    throw error;
  }
};