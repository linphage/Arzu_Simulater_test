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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PomodoroRepository = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../config/logger");
class PomodoroRepository {
    create(userId, sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { taskId, durationMinutes = 25 } = sessionData;
                const result = yield (0, connection_1.runQuery)('INSERT INTO pomodoro_sessions (user_id, task_id, duration_minutes) VALUES (?, ?, ?)', [userId, taskId || null, durationMinutes]);
                logger_1.logger.info('番茄钟会话创建成功', {
                    sessionId: result.lastID,
                    userId,
                    taskId,
                    durationMinutes
                });
                return result.lastID;
            }
            catch (error) {
                logger_1.logger.error('番茄钟会话创建失败', {
                    userId,
                    sessionData,
                    error: error.message
                });
                throw error;
            }
        });
    }
    findById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield (0, connection_1.getQuery)('SELECT * FROM pomodoro_sessions WHERE id = ?', [sessionId]);
            if (session) {
                logger_1.logger.debug('番茄钟会话查找成功', { sessionId });
            }
            else {
                logger_1.logger.debug('番茄钟会话未找到', { sessionId });
            }
            return session;
        });
    }
    findByIdAndUserId(sessionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield (0, connection_1.getQuery)('SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
            if (session) {
                logger_1.logger.debug('番茄钟会话查找成功', { sessionId, userId });
            }
            else {
                logger_1.logger.debug('番茄钟会话未找到或无权访问', { sessionId, userId });
            }
            return session;
        });
    }
    findByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            const { taskId, completed, limit = 50, offset = 0 } = options;
            let whereClause = 'WHERE user_id = ?';
            const params = [userId];
            if (taskId) {
                whereClause += ' AND task_id = ?';
                params.push(taskId);
            }
            if (completed !== undefined) {
                whereClause += ' AND completed = ?';
                params.push(completed);
            }
            try {
                const countResult = yield (0, connection_1.getQuery)(`SELECT COUNT(*) as count FROM pomodoro_sessions ${whereClause}`, params);
                const total = (countResult === null || countResult === void 0 ? void 0 : countResult.count) || 0;
                const sessions = yield (0, connection_1.allQuery)(`SELECT * FROM pomodoro_sessions ${whereClause} ORDER BY started_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
                logger_1.logger.debug('番茄钟会话列表查询成功', {
                    userId,
                    total,
                    count: sessions.length,
                    options
                });
                return { sessions, total };
            }
            catch (error) {
                logger_1.logger.error('番茄钟会话列表查询失败', {
                    userId,
                    options,
                    error: error.message
                });
                throw error;
            }
        });
    }
    findByTaskId(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessions = yield (0, connection_1.allQuery)('SELECT * FROM pomodoro_sessions WHERE task_id = ? ORDER BY started_at DESC', [taskId]);
                logger_1.logger.debug('任务番茄钟会话查询成功', { taskId, sessionCount: sessions.length });
                return sessions;
            }
            catch (error) {
                logger_1.logger.error('任务番茄钟会话查询失败', { taskId, error: error.message });
                throw error;
            }
        });
    }
    completeSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, connection_1.runQuery)('UPDATE pomodoro_sessions SET completed = 1, completed_at = datetime("now") WHERE id = ?', [sessionId]);
                logger_1.logger.info('番茄钟会话完成', { sessionId });
            }
            catch (error) {
                logger_1.logger.error('番茄钟会话完成失败', { sessionId, error: error.message });
                throw error;
            }
        });
    }
    endSession(sessionId, endData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { completed, completedAt, updateDuration, actualDuration } = endData;
                const endTime = completedAt || new Date().toISOString();
                if (updateDuration && actualDuration !== undefined) {
                    yield (0, connection_1.runQuery)(`UPDATE pomodoro_sessions 
           SET completed = ?, 
               completed_at = datetime(?),
               duration_minutes = ?
           WHERE id = ?`, [completed ? 1 : 0, endTime, actualDuration, sessionId]);
                    logger_1.logger.info('番茄钟会话结束（更新时长）', {
                        sessionId,
                        completed,
                        actualDuration,
                        completedAt: endTime
                    });
                }
                else {
                    yield (0, connection_1.runQuery)(`UPDATE pomodoro_sessions 
           SET completed = ?, 
               completed_at = datetime(?)
           WHERE id = ?`, [completed ? 1 : 0, endTime, sessionId]);
                    logger_1.logger.info('番茄钟会话结束', {
                        sessionId,
                        completed,
                        completedAt: endTime
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('番茄钟会话结束失败', { sessionId, endData, error: error.message });
                throw error;
            }
        });
    }
    calculateSessionActualDuration(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, connection_1.getQuery)(`
        SELECT SUM(COALESCE(duration_min, 0)) as total
        FROM focus_periods
        WHERE session_id = ?
      `, [sessionId]);
                const totalMinutes = Math.round(((result === null || result === void 0 ? void 0 : result.total) || 0) * 10) / 10;
                logger_1.logger.debug('计算会话实际时长', { sessionId, totalMinutes });
                return totalMinutes;
            }
            catch (error) {
                logger_1.logger.error('计算会话实际时长失败', { sessionId, error: error.message });
                throw error;
            }
        });
    }
    getActiveSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = yield (0, connection_1.getQuery)('SELECT * FROM pomodoro_sessions WHERE user_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1', [userId]);
                logger_1.logger.debug('活跃番茄钟会话查询成功', { userId, hasActiveSession: !!session });
                return session;
            }
            catch (error) {
                logger_1.logger.error('活跃番茄钟会话查询失败', { userId, error: error.message });
                throw error;
            }
        });
    }
    getPomodoroStats(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, days = 30) {
            try {
                const dateFrom = new Date();
                dateFrom.setDate(dateFrom.getDate() - days);
                const [totalResult, completedResult, minutesResult, dailyStats] = yield Promise.all([
                    (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND started_at >= datetime(?)', [userId, dateFrom.toISOString()]),
                    (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND completed = 1 AND started_at >= datetime(?)', [userId, dateFrom.toISOString()]),
                    (0, connection_1.getQuery)('SELECT SUM(duration_minutes) as total FROM pomodoro_sessions WHERE user_id = ? AND started_at >= datetime(?)', [userId, dateFrom.toISOString()]),
                    (0, connection_1.allQuery)(`
          SELECT 
            DATE(started_at) as date,
            COUNT(*) as sessions,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedSessions,
            SUM(duration_minutes) as totalMinutes
          FROM pomodoro_sessions
          WHERE user_id = ? AND started_at >= datetime(?)
          GROUP BY DATE(started_at)
          ORDER BY date DESC
        `, [userId, dateFrom.toISOString()])
                ]);
                const totalSessions = (totalResult === null || totalResult === void 0 ? void 0 : totalResult.count) || 0;
                const completedSessions = (completedResult === null || completedResult === void 0 ? void 0 : completedResult.count) || 0;
                const totalMinutes = (minutesResult === null || minutesResult === void 0 ? void 0 : minutesResult.total) || 0;
                const averageDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
                const stats = {
                    totalSessions,
                    completedSessions,
                    totalMinutes,
                    averageDuration,
                    dailyStats: dailyStats.map(stat => ({
                        date: stat.date,
                        sessions: stat.sessions,
                        completedSessions: stat.completedSessions,
                        totalMinutes: stat.totalMinutes
                    }))
                };
                logger_1.logger.debug('番茄钟统计查询成功', { userId, days, stats });
                return stats;
            }
            catch (error) {
                logger_1.logger.error('番茄钟统计查询失败', { userId, days, error: error.message });
                throw error;
            }
        });
    }
    getPomodoroStatsByTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalResult, completedResult, minutesResult] = yield Promise.all([
                    (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE task_id = ?', [taskId]),
                    (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE task_id = ? AND completed = 1', [taskId]),
                    (0, connection_1.getQuery)('SELECT SUM(duration_minutes) as total FROM pomodoro_sessions WHERE task_id = ?', [taskId])
                ]);
                const totalSessions = (totalResult === null || totalResult === void 0 ? void 0 : totalResult.count) || 0;
                const completedSessions = (completedResult === null || completedResult === void 0 ? void 0 : completedResult.count) || 0;
                const totalMinutes = (minutesResult === null || minutesResult === void 0 ? void 0 : minutesResult.total) || 0;
                const averageDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
                const stats = {
                    totalSessions,
                    completedSessions,
                    totalMinutes,
                    averageDuration
                };
                logger_1.logger.debug('任务番茄钟统计查询成功', { taskId, stats });
                return stats;
            }
            catch (error) {
                logger_1.logger.error('任务番茄钟统计查询失败', { taskId, error: error.message });
                throw error;
            }
        });
    }
    delete(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, connection_1.runQuery)('DELETE FROM pomodoro_sessions WHERE id = ?', [sessionId]);
                logger_1.logger.info('番茄钟会话删除成功', { sessionId });
            }
            catch (error) {
                logger_1.logger.error('番茄钟会话删除失败', { sessionId, error: error.message });
                throw error;
            }
        });
    }
    deleteByTaskId(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, connection_1.runQuery)('DELETE FROM pomodoro_sessions WHERE task_id = ?', [taskId]);
                logger_1.logger.info('任务番茄钟会话删除成功', { taskId, deletedCount: result.changes });
                return result.changes;
            }
            catch (error) {
                logger_1.logger.error('任务番茄钟会话删除失败', { taskId, error: error.message });
                throw error;
            }
        });
    }
    cleanupExpiredSessions() {
        return __awaiter(this, arguments, void 0, function* (daysToKeep = 90) {
            try {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
                const result = yield (0, connection_1.runQuery)('DELETE FROM pomodoro_sessions WHERE started_at < datetime(?)', [cutoffDate.toISOString()]);
                if (result.changes > 0) {
                    logger_1.logger.info('清理过期番茄钟会话', { deletedCount: result.changes, daysToKeep });
                }
                return result.changes;
            }
            catch (error) {
                logger_1.logger.error('清理过期番茄钟会话失败', { daysToKeep, error: error.message });
                throw error;
            }
        });
    }
}
exports.PomodoroRepository = PomodoroRepository;
exports.default = PomodoroRepository;
//# sourceMappingURL=pomodoro.repository.js.map