"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTransaction = exports.allQuery = exports.getQuery = exports.runQuery = exports.closeDatabase = exports.getDatabase = exports.createDatabaseConnection = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const config_1 = require("../config");
const logger_1 = require("../config/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 确保日志目录存在
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// 数据库连接实例
let db = null;
// 创建数据库连接
const createDatabaseConnection = () => {
    return new Promise((resolve, reject) => {
        const database = new sqlite3_1.default.Database(config_1.databaseConfig.path, (err) => {
            if (err) {
                logger_1.logger.error('数据库连接失败', { error: err.message });
                reject(err);
            }
            else {
                logger_1.logger.info('数据库连接成功', { path: config_1.databaseConfig.path });
                // 配置数据库
                database.serialize(() => {
                    // 设置繁忙超时（5秒）
                    database.run('PRAGMA busy_timeout = 5000', (err) => {
                        if (err) {
                            logger_1.logger.error('设置繁忙超时失败', { error: err.message });
                        }
                        else {
                            logger_1.logger.debug('繁忙超时已设置为 5000ms');
                        }
                    });
                    // 启用 WAL 模式（提高并发性能）
                    database.run('PRAGMA journal_mode = WAL', (err) => {
                        if (err) {
                            logger_1.logger.error('启用 WAL 模式失败', { error: err.message });
                        }
                        else {
                            logger_1.logger.debug('WAL 模式已启用');
                        }
                    });
                    // 启用外键约束
                    database.run('PRAGMA foreign_keys = ON', (err) => {
                        if (err) {
                            logger_1.logger.error('启用外键约束失败', { error: err.message });
                        }
                        else {
                            logger_1.logger.info('外键约束已启用');
                        }
                    });
                });
                resolve(database);
            }
        });
    });
};
exports.createDatabaseConnection = createDatabaseConnection;
// 获取数据库连接
const getDatabase = async () => {
    if (!db) {
        db = await (0, exports.createDatabaseConnection)();
    }
    return db;
};
exports.getDatabase = getDatabase;
// 关闭数据库连接
const closeDatabase = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        db.close((err) => {
            if (err) {
                logger_1.logger.error('关闭数据库连接失败', { error: err.message });
                reject(err);
            }
            else {
                logger_1.logger.info('数据库连接已关闭');
                db = null;
                resolve();
            }
        });
    });
};
exports.closeDatabase = closeDatabase;
// 执行SQL查询的Promise包装器
const runQuery = (sql, params = []) => {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await (0, exports.getDatabase)();
            database.run(sql, params, function (err) {
                if (err) {
                    logger_1.logger.error('SQL执行失败', { sql, params, error: err.message });
                    reject(err);
                }
                else {
                    logger_1.logger.debug('SQL执行成功', { sql, params, lastID: this.lastID, changes: this.changes });
                    resolve(this);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.runQuery = runQuery;
// 执行SQL查询并获取单行结果
const getQuery = (sql, params = []) => {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await (0, exports.getDatabase)();
            database.get(sql, params, (err, row) => {
                if (err) {
                    logger_1.logger.error('SQL查询失败', { sql, params, error: err.message });
                    reject(err);
                }
                else {
                    logger_1.logger.debug('SQL查询成功', { sql, params, rowCount: row ? 1 : 0 });
                    resolve(row);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.getQuery = getQuery;
// 执行SQL查询并获取多行结果
const allQuery = (sql, params = []) => {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await (0, exports.getDatabase)();
            database.all(sql, params, (err, rows) => {
                if (err) {
                    logger_1.logger.error('SQL查询失败', { sql, params, error: err.message });
                    reject(err);
                }
                else {
                    logger_1.logger.debug('SQL查询成功', { sql, params, rowCount: rows.length });
                    resolve(rows);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.allQuery = allQuery;
// 执行事务
const executeTransaction = async (callback) => {
    const database = await (0, exports.getDatabase)();
    return new Promise((resolve, reject) => {
        database.serialize(() => {
            database.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    logger_1.logger.error('开始事务失败', { error: err.message });
                    reject(err);
                    return;
                }
                callback(database)
                    .then(() => {
                    database.run('COMMIT', (err) => {
                        if (err) {
                            logger_1.logger.error('提交事务失败', { error: err.message });
                            database.run('ROLLBACK');
                            reject(err);
                        }
                        else {
                            logger_1.logger.info('事务提交成功');
                            resolve();
                        }
                    });
                })
                    .catch((error) => {
                    logger_1.logger.error('事务执行失败', { error: error.message });
                    database.run('ROLLBACK', () => {
                        reject(error);
                    });
                });
            });
        });
    });
};
exports.executeTransaction = executeTransaction;
