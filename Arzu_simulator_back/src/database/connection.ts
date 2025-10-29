import sqlite3 from 'sqlite3';
import { databaseConfig } from '../config';
import { logger } from '../config/logger';
import path from 'path';
import fs from 'fs';

// 确保日志目录存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 数据库连接实例
let db: sqlite3.Database | null = null;

// 创建数据库连接
export const createDatabaseConnection = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(databaseConfig.path, (err) => {
      if (err) {
        logger.error('数据库连接失败', { error: err.message });
        reject(err);
      } else {
        logger.info('数据库连接成功', { path: databaseConfig.path });
        
        // 配置数据库
        database.serialize(() => {
          // 设置繁忙超时（5秒）
          database.run('PRAGMA busy_timeout = 5000', (err) => {
            if (err) {
              logger.error('设置繁忙超时失败', { error: err.message });
            } else {
              logger.debug('繁忙超时已设置为 5000ms');
            }
          });

          // 启用 WAL 模式（提高并发性能）
          database.run('PRAGMA journal_mode = WAL', (err) => {
            if (err) {
              logger.error('启用 WAL 模式失败', { error: err.message });
            } else {
              logger.debug('WAL 模式已启用');
            }
          });
          
          // 启用外键约束
          database.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
              logger.error('启用外键约束失败', { error: err.message });
            } else {
              logger.info('外键约束已启用');
            }
          });
        });
        
        resolve(database);
      }
    });
  });
};

// 获取数据库连接
export const getDatabase = async (): Promise<sqlite3.Database> => {
  if (!db) {
    db = await createDatabaseConnection();
  }
  return db;
};

// 关闭数据库连接
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    db.close((err) => {
      if (err) {
        logger.error('关闭数据库连接失败', { error: err.message });
        reject(err);
      } else {
        logger.info('数据库连接已关闭');
        db = null;
        resolve();
      }
    });
  });
};

// 执行SQL查询的Promise包装器
export const runQuery = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDatabase();
      database.run(sql, params, function(err) {
        if (err) {
          logger.error('SQL执行失败', { sql, params, error: err.message });
          reject(err);
        } else {
          logger.debug('SQL执行成功', { sql, params, lastID: this.lastID, changes: this.changes });
          resolve(this);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// 执行SQL查询并获取单行结果
export const getQuery = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDatabase();
      database.get(sql, params, (err, row) => {
        if (err) {
          logger.error('SQL查询失败', { sql, params, error: err.message });
          reject(err);
        } else {
          logger.debug('SQL查询成功', { sql, params, rowCount: row ? 1 : 0 });
          resolve(row as T);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// 执行SQL查询并获取多行结果
export const allQuery = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDatabase();
      database.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('SQL查询失败', { sql, params, error: err.message });
          reject(err);
        } else {
          logger.debug('SQL查询成功', { sql, params, rowCount: rows.length });
          resolve(rows as T[]);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// 执行事务
export const executeTransaction = async (callback: (db: sqlite3.Database) => Promise<void>): Promise<void> => {
  const database = await getDatabase();
  
  return new Promise((resolve, reject) => {
    database.serialize(() => {
      database.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          logger.error('开始事务失败', { error: err.message });
          reject(err);
          return;
        }
        
        callback(database)
          .then(() => {
            database.run('COMMIT', (err) => {
              if (err) {
                logger.error('提交事务失败', { error: err.message });
                database.run('ROLLBACK');
                reject(err);
              } else {
                logger.info('事务提交成功');
                resolve();
              }
            });
          })
          .catch((error) => {
            logger.error('事务执行失败', { error: error.message });
            database.run('ROLLBACK', () => {
              reject(error);
            });
          });
      });
    });
  });
};