"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefLogRepository = exports.BriefType = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../config/logger");
var BriefType;
(function (BriefType) {
    BriefType[BriefType["DELETE_REASON"] = 1] = "DELETE_REASON";
    BriefType[BriefType["CATEGORY_CHANGE"] = 2] = "CATEGORY_CHANGE";
    BriefType[BriefType["PRIORITY_CHANGE"] = 3] = "PRIORITY_CHANGE";
    BriefType[BriefType["DUE_DATE_CHANGE"] = 4] = "DUE_DATE_CHANGE";
    BriefType[BriefType["CONTINUE_WORK_REMARK"] = 5] = "CONTINUE_WORK_REMARK";
    BriefType[BriefType["LEAVE_REMARK"] = 6] = "LEAVE_REMARK";
    BriefType[BriefType["TASK_COMPLETE_REMARK"] = 7] = "TASK_COMPLETE_REMARK";
    BriefType[BriefType["REFLECTION_REMARK"] = 8] = "REFLECTION_REMARK";
})(BriefType || (exports.BriefType = BriefType = {}));
class BriefLogRepository {
    async create(data) {
        try {
            const { session_id, task_id, user_id, brief_type, brief_content } = data;
            const result = await (0, connection_1.runQuery)(`INSERT INTO task_brieflogs (session_id, task_id, user_id, brief_type, brief_content, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [session_id || null, task_id, user_id, brief_type, brief_content]);
            const briefLog = await this.findById(result.lastID);
            if (!briefLog) {
                throw new Error('日志创建成功但无法获取');
            }
            logger_1.logger.info('任务变更日志创建成功', {
                debrief_id: briefLog.debrief_id,
                task_id,
                user_id,
                brief_type
            });
            return briefLog;
        }
        catch (error) {
            logger_1.logger.error('创建任务变更日志失败', { data, error: error.message });
            throw error;
        }
    }
    async createBatch(logs) {
        try {
            const createdLogs = [];
            for (const logData of logs) {
                const log = await this.create(logData);
                createdLogs.push(log);
            }
            logger_1.logger.info('批量创建任务变更日志成功', { count: createdLogs.length });
            return createdLogs;
        }
        catch (error) {
            logger_1.logger.error('批量创建任务变更日志失败', { count: logs.length, error: error.message });
            throw error;
        }
    }
    async findById(debrief_id) {
        try {
            const result = await (0, connection_1.getQuery)('SELECT * FROM task_brieflogs WHERE debrief_id = ?', [debrief_id]);
            return result || null;
        }
        catch (error) {
            logger_1.logger.error('查询任务变更日志失败', { debrief_id, error: error.message });
            throw error;
        }
    }
    async findByTaskId(task_id) {
        try {
            const result = await (0, connection_1.allQuery)('SELECT * FROM task_brieflogs WHERE task_id = ? ORDER BY created_at DESC', [task_id]);
            return result;
        }
        catch (error) {
            logger_1.logger.error('查询任务变更日志失败', { task_id, error: error.message });
            throw error;
        }
    }
    async findByUserId(user_id, limit = 50) {
        try {
            const result = await (0, connection_1.allQuery)('SELECT * FROM task_brieflogs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [user_id, limit]);
            return result;
        }
        catch (error) {
            logger_1.logger.error('查询用户任务变更日志失败', { user_id, error: error.message });
            throw error;
        }
    }
    async getHabitStatsByDateRange(user_id, startDate, endDate) {
        try {
            const result = await (0, connection_1.allQuery)(`SELECT * FROM task_brieflogs 
         WHERE user_id = ? 
         AND brief_type IN (1, 2, 3, 4)
         AND created_at >= ? 
         AND created_at <= ?
         ORDER BY created_at ASC`, [user_id, startDate, endDate]);
            return result;
        }
        catch (error) {
            logger_1.logger.error('查询习惯统计数据失败', { user_id, startDate, endDate, error: error.message });
            throw error;
        }
    }
}
exports.BriefLogRepository = BriefLogRepository;
exports.default = BriefLogRepository;
