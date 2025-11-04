import { logger } from '../config/logger';
import { runQuery, getDatabase, getQuery, DB_TYPE } from './connection';
import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { getErrorMessage } from '../utils/error-handler';

const executeSqlFile = async (filePath: string): Promise<void> => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const db = await getDatabase();
    
    if (DB_TYPE === 'postgres') {
      const pool = db as Pool;
      await pool.query(sql);
      logger.info(`PostgreSQL文件执行成功: ${path.basename(filePath)}`);
    } else {
      await new Promise<void>((resolve, reject) => {
        (db as sqlite3.Database).exec(sql, function(err) {
          if (err) {
            logger.error('SQLite文件执行失败', { 
              file: path.basename(filePath), 
              error: err.message 
            });
            reject(err);
          } else {
            logger.info(`SQLite文件执行成功: ${path.basename(filePath)}`);
            resolve();
          }
        });
      });
    }
  } catch (error) {
    logger.error(`SQL文件执行失败: ${path.basename(filePath)}`, { error: getErrorMessage(error) });
    throw error;
  }
};

export const initDb = async (): Promise<void> => {
  try {
    logger.info(`开始初始化${DB_TYPE}数据库...`);
    logger.info(`当前工作目录: ${process.cwd()}`);
    logger.info(`__dirname: ${__dirname}`);
    
    const dbExists = await checkDbInitialized();
    
    if (DB_TYPE === 'postgres') {
      if (!dbExists) {
        logger.info('执行PostgreSQL初始化脚本...');
        const sqlPath = path.join(__dirname, 'init-postgres.sql');
        await executeSqlFile(sqlPath);
        logger.info('PostgreSQL数据库初始化完成');
      } else {
        logger.info('PostgreSQL数据库已存在，运行迁移脚本...');
      }
      
      const migrationsDir = path.join(__dirname, 'migrations');
      logger.info(`迁移脚本目录: ${migrationsDir}`);
      logger.info(`检查目录是否存在...`);
      
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs.readdirSync(migrationsDir)
          .filter(file => file.endsWith('.sql'))
          .sort();
        
        logger.info(`找到 ${migrationFiles.length} 个迁移脚本: ${migrationFiles.join(', ')}`);
        
        for (const file of migrationFiles) {
          try {
            const migrationPath = path.join(migrationsDir, file);
            logger.info(`执行迁移脚本: ${file}`);
            await executeSqlFile(migrationPath);
            logger.info(`迁移脚本执行成功: ${file}`);
          } catch (error) {
            logger.error(`迁移脚本执行失败: ${file}`, { error: getErrorMessage(error) });
          }
        }
      } else {
        logger.warn(`迁移脚本目录不存在: ${migrationsDir}`);
        
        logger.info('尝试列出 __dirname 中的内容:');
        try {
          const files = fs.readdirSync(__dirname);
          logger.info(`__dirname 内容: ${files.join(', ')}`);
        } catch (e) {
          logger.error('无法读取 __dirname', { error: getErrorMessage(e) });
        }
      }
    } else {
      if (!dbExists) {
        logger.warn('SQLite数据库未初始化！请手动运行迁移脚本：node scripts/run-migration.js');
      }
    }
    
    logger.info('数据库初始化检查完成');
  } catch (error) {
    logger.error('数据库初始化失败', { error: getErrorMessage(error) });
  }
};

export const checkDbInitialized = async (): Promise<boolean> => {
  try {
    if (DB_TYPE === 'postgres') {
      const result = await getQuery<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists
      `);
      return result?.exists || false;
    } else {
      const usersFieldsResult = await getQuery<{ count: number }>(`
        SELECT COUNT(*) as count FROM pragma_table_info('users') 
        WHERE name IN ('user_id', 'username', 'mail', 'password_hash')
      `);
      
      const usersFieldsCorrect = usersFieldsResult?.count === 4;
      
      const tasksTableResult = await getQuery<{ count: number }>(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type='table' AND name='tasks'
      `);
      
      const tasksTableExists = tasksTableResult?.count === 1;
      const initialized = usersFieldsCorrect && tasksTableExists;
      
      if (initialized) {
        logger.info('SQLite数据库已正确初始化');
      }
      return initialized;
    }
  } catch (error) {
    logger.error('检查数据库状态时出错', { error: getErrorMessage(error) });
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
    for (const table of (tables as unknown as { name: string }[])) {
      await runQuery(`DROP TABLE IF EXISTS ${table.name}`);
    }
    
    // 重新初始化
    await initDb();
    
    logger.info('数据库重置完成');
  } catch (error) {
    logger.error('数据库重置失败', { error: getErrorMessage(error) });
    throw error;
  }
};