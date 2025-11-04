import { Pool, PoolClient, QueryResult } from 'pg';
import sqlite3 from 'sqlite3';
import { databaseConfig } from '../config';
import { logger } from '../config/logger';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const DB_TYPE = process.env.DATABASE_URL ? 'postgres' : 'sqlite';

let sqliteDb: sqlite3.Database | null = null;
let pgPool: Pool | null = null;

const createSqliteConnection = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(databaseConfig.path, (err) => {
      if (err) {
        logger.error('SQLite连接失败', { error: err.message });
        reject(err);
      } else {
        logger.info('SQLite连接成功', { path: databaseConfig.path });
        
        database.serialize(() => {
          database.run('PRAGMA busy_timeout = 5000');
          database.run('PRAGMA journal_mode = WAL');
          database.run('PRAGMA foreign_keys = ON');
        });
        
        resolve(database);
      }
    });
  });
};

const createPostgresPool = (): Pool => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('connect', () => {
    logger.info('PostgreSQL连接成功');
  });

  pool.on('error', (err: Error) => {
    logger.error('PostgreSQL连接错误', { error: err.message });
  });

  return pool;
};

export const getDatabase = async (): Promise<sqlite3.Database | Pool> => {
  if (DB_TYPE === 'postgres') {
    if (!pgPool) {
      pgPool = createPostgresPool();
    }
    return pgPool;
  } else {
    if (!sqliteDb) {
      sqliteDb = await createSqliteConnection();
    }
    return sqliteDb;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (DB_TYPE === 'postgres' && pgPool) {
    await pgPool.end();
    pgPool = null;
    logger.info('PostgreSQL连接池已关闭');
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.close((err) => {
        if (err) {
          logger.error('SQLite关闭失败', { error: err.message });
          reject(err);
        } else {
          logger.info('SQLite连接已关闭');
          sqliteDb = null;
          resolve();
        }
      });
    });
  }
};

const convertSqliteToPostgres = (sql: string): string => {
  let converted = sql;
  
  converted = converted.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  converted = converted.replace(/datetime\("now"\)/gi, 'CURRENT_TIMESTAMP');
  
  converted = converted.replace(/datetime\(\?\)/gi, 'CAST(? AS TIMESTAMP)');
  converted = converted.replace(/datetime\(\$\d+\)/gi, (match) => {
    return match.replace('datetime', 'CAST').replace(')', ' AS TIMESTAMP)');
  });
  
  converted = converted.replace(/datetime\('now',\s*'([^']+)'\)/gi, (match, modifier) => {
    return `(CURRENT_TIMESTAMP + INTERVAL '${modifier.replace(/^-/, '-').replace(/\s+/, ' ')}')`;
  });
  converted = converted.replace(/datetime\("now",\s*"([^"]+)"\)/gi, (match, modifier) => {
    return `(CURRENT_TIMESTAMP + INTERVAL '${modifier.replace(/^-/, '-').replace(/\s+/, ' ')}')`;
  });
  
  converted = converted.replace(/datetime\(\?,\s*'localtime'\)/gi, '?::TIMESTAMP');
  
  converted = converted.replace(/COALESCE\(is_active,\s*1\)/gi, 'COALESCE(is_active, true)');
  converted = converted.replace(/COALESCE\(is_active,\s*0\)/gi, 'COALESCE(is_active, false)');
  
  converted = converted.replace(/completed\s*=\s*1/gi, 'completed = true');
  converted = converted.replace(/completed\s*=\s*0/gi, 'completed = false');
  converted = converted.replace(/is_interrupted\s*=\s*1/gi, 'is_interrupted = true');
  converted = converted.replace(/is_interrupted\s*=\s*0/gi, 'is_interrupted = false');
  converted = converted.replace(/interrupted\s*=\s*1/gi, 'interrupted = true');
  converted = converted.replace(/interrupted\s*=\s*0/gi, 'interrupted = false');
  converted = converted.replace(/abandoned\s*=\s*1/gi, 'abandoned = true');
  converted = converted.replace(/abandoned\s*=\s*0/gi, 'abandoned = false');
  
  converted = converted.replace(/CAST\(([^)]+)\s+AS\s+TIME\)/gi, 'CAST($1 AS TIME)');
  
  if (/^\s*INSERT\s+INTO/i.test(converted) && !/RETURNING/i.test(converted)) {
    const trimmed = converted.trim();
    if (trimmed.endsWith(';')) {
      converted = trimmed.slice(0, -1) + ' RETURNING *;';
    } else {
      converted = trimmed + ' RETURNING *';
    }
  }
  
  if (converted.includes('datetime')) {
    logger.warn('SQL conversion may be incomplete', { 
      original: sql.substring(0, 200),
      converted: converted.substring(0, 200)
    });
  }
  
  return converted;
};

export const runQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const db = await getDatabase();
  
  if (DB_TYPE === 'postgres') {
    const pgSql = sql.replace(/\?/g, (_, i) => `$${params.indexOf(_) + 1}`);
    let paramIndex = 1;
    let convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    convertedSql = convertSqliteToPostgres(convertedSql);
    
    const result = await (db as Pool).query(convertedSql, params);
    const firstRow = result.rows[0];
    const lastID = firstRow?.id || firstRow?.user_id || firstRow?.task_id || firstRow?.gift_id || 
                   firstRow?.task_brieflog_id || firstRow?.pomodoro_session_id;
    
    return { lastID, changes: result.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      (db as sqlite3.Database).run(sql, params, function(err) {
        if (err) {
          logger.error('SQL执行失败', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

export const getQuery = async <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  const db = await getDatabase();
  
  if (DB_TYPE === 'postgres') {
    let paramIndex = 1;
    let convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    convertedSql = convertSqliteToPostgres(convertedSql);
    const result = await (db as Pool).query(convertedSql, params);
    return result.rows[0] as T;
  } else {
    return new Promise((resolve, reject) => {
      (db as sqlite3.Database).get(sql, params, (err, row) => {
        if (err) {
          logger.error('SQL查询失败', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }
};

export const allQuery = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  const db = await getDatabase();
  
  if (DB_TYPE === 'postgres') {
    let paramIndex = 1;
    let convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    convertedSql = convertSqliteToPostgres(convertedSql);
    const result = await (db as Pool).query(convertedSql, params);
    return result.rows as T[];
  } else {
    return new Promise((resolve, reject) => {
      (db as sqlite3.Database).all(sql, params, (err, rows) => {
        if (err) {
          logger.error('SQL查询失败', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }
};

export const executeTransaction = async (callback: (client: any) => Promise<void>): Promise<void> => {
  const db = await getDatabase();
  
  if (DB_TYPE === 'postgres') {
    const client = await (db as Pool).connect();
    try {
      await client.query('BEGIN');
      await callback(client);
      await client.query('COMMIT');
      logger.info('PostgreSQL事务提交成功');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('PostgreSQL事务回滚', { error });
      throw error;
    } finally {
      client.release();
    }
  } else {
    const database = db as sqlite3.Database;
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
  }
};

export { DB_TYPE };
