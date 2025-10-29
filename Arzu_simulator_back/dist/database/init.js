"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDb = exports.checkDbInitialized = exports.initDb = void 0;
const logger_1 = require("../config/logger");
const connection_1 = require("./connection");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const executeSqlFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sql = fs_1.default.readFileSync(filePath, 'utf8');
        const db = yield (0, connection_1.getDatabase)();
        yield new Promise((resolve, reject) => {
            db.exec(sql, function (err) {
                if (err) {
                    logger_1.logger.error('SQL文件执行失败', {
                        file: path_1.default.basename(filePath),
                        error: err.message
                    });
                    reject(err);
                }
                else {
                    logger_1.logger.info(`SQL文件执行成功: ${path_1.default.basename(filePath)}`);
                    resolve();
                }
            });
        });
    }
    catch (error) {
        logger_1.logger.error(`SQL文件执行失败: ${path_1.default.basename(filePath)}`, { error: error.message });
        throw error;
    }
});
const initDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.logger.info('开始初始化数据库...');
        const dbExists = yield (0, exports.checkDbInitialized)();
        if (dbExists) {
            logger_1.logger.info('数据库已正确初始化，跳过迁移');
            return;
        }
        logger_1.logger.warn('数据库未初始化！请手动运行迁移脚本：node scripts/run-migration.js');
        logger_1.logger.warn('或确保数据库文件已包含所有必需的表结构');
        logger_1.logger.info('数据库初始化检查完成');
    }
    catch (error) {
        logger_1.logger.error('数据库初始化检查失败', { error: error.message });
    }
});
exports.initDb = initDb;
const checkDbInitialized = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usersFieldsResult = yield (0, connection_1.getQuery)(`
      SELECT COUNT(*) as count FROM pragma_table_info('users') 
      WHERE name IN ('user_id', 'username', 'mail', 'password_hash')
    `);
        const usersFieldsCorrect = usersFieldsResult && usersFieldsResult.count === 4;
        const tasksTableResult = yield (0, connection_1.getQuery)(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='table' AND name='tasks'
    `);
        const tasksTableExists = tasksTableResult && tasksTableResult.count === 1;
        const initialized = usersFieldsCorrect && tasksTableExists;
        if (initialized) {
            logger_1.logger.info('数据库已正确初始化');
        }
        return initialized;
    }
    catch (error) {
        logger_1.logger.error('检查数据库状态时出错', { error: error.message });
        return false;
    }
});
exports.checkDbInitialized = checkDbInitialized;
const resetDb = () => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('不能在生产环境中重置数据库');
    }
    try {
        logger_1.logger.warn('开始重置数据库...');
        const tables = yield (0, connection_1.runQuery)(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
        for (const table of tables) {
            yield (0, connection_1.runQuery)(`DROP TABLE IF EXISTS ${table.name}`);
        }
        yield (0, exports.initDb)();
        logger_1.logger.info('数据库重置完成');
    }
    catch (error) {
        logger_1.logger.error('数据库重置失败', { error: error.message });
        throw error;
    }
});
exports.resetDb = resetDb;
//# sourceMappingURL=init.js.map