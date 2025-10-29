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
exports.FocusPeriodRepository = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../config/logger");
class FocusPeriodRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { session_id, start_time } = data;
                const startTime = start_time || new Date().toISOString();
                const result = yield (0, connection_1.runQuery)(`INSERT INTO focus_periods (session_id, start_time, created_at) 
         VALUES (?, datetime(?), datetime('now'))`, [session_id, startTime]);
                logger_1.logger.info('细分时间段创建成功', {
                    periodId: result.lastID,
                    sessionId: session_id,
                    startTime
                });
                return result.lastID;
            }
            catch (error) {
                logger_1.logger.error('细分时间段创建失败', {
                    data,
                    error: error.message
                });
                throw error;
            }
        });
    }
    endPeriod(periodId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { end_time, is_interrupted } = data;
                const endTime = end_time || new Date().toISOString();
                const period = yield this.findById(periodId);
                if (!period) {
                    throw new Error('细分时间段不存在');
                }
                const startTimeUTC = period.start_time.includes('T')
                    ? period.start_time
                    : period.start_time.replace(' ', 'T') + 'Z';
                const endTimeUTC = endTime.includes('T')
                    ? endTime
                    : endTime.replace(' ', 'T') + 'Z';
                const startMs = new Date(startTimeUTC).getTime();
                const endMs = new Date(endTimeUTC).getTime();
                const diffMs = endMs - startMs;
                const durationMin = Math.round(diffMs / 60000 * 10) / 10;
                yield (0, connection_1.runQuery)(`UPDATE focus_periods 
         SET end_time = datetime(?), 
             duration_min = ?,
             is_interrupted = ?
         WHERE period_id = ?`, [endTime, durationMin, is_interrupted ? 1 : 0, periodId]);
                logger_1.logger.info('细分时间段结束', {
                    periodId,
                    endTime,
                    durationMin,
                    isInterrupted: is_interrupted
                });
            }
            catch (error) {
                logger_1.logger.error('细分时间段结束失败', {
                    periodId,
                    data,
                    error: error.message
                });
                throw error;
            }
        });
    }
    findById(periodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const period = yield (0, connection_1.getQuery)('SELECT * FROM focus_periods WHERE period_id = ?', [periodId]);
            if (period) {
                logger_1.logger.debug('细分时间段查找成功', { periodId });
            }
            else {
                logger_1.logger.debug('细分时间段未找到', { periodId });
            }
            return period;
        });
    }
    findBySessionId(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const periods = yield (0, connection_1.allQuery)('SELECT * FROM focus_periods WHERE session_id = ? ORDER BY start_time ASC', [sessionId]);
                logger_1.logger.debug('会话细分时间段查询成功', {
                    sessionId,
                    periodCount: periods.length
                });
                return periods;
            }
            catch (error) {
                logger_1.logger.error('会话细分时间段查询失败', {
                    sessionId,
                    error: error.message
                });
                throw error;
            }
        });
    }
    getActivePeriod(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const period = yield (0, connection_1.getQuery)(`SELECT * FROM focus_periods 
         WHERE session_id = ? AND end_time IS NULL 
         ORDER BY start_time DESC 
         LIMIT 1`, [sessionId]);
                logger_1.logger.debug('活跃细分时间段查询', {
                    sessionId,
                    hasActivePeriod: !!period
                });
                return period;
            }
            catch (error) {
                logger_1.logger.error('活跃细分时间段查询失败', {
                    sessionId,
                    error: error.message
                });
                throw error;
            }
        });
    }
    getSessionPeriodStats(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, connection_1.getQuery)(`
        SELECT 
          COUNT(*) as totalPeriods,
          SUM(CASE WHEN is_interrupted = 1 THEN 1 ELSE 0 END) as interruptedPeriods,
          SUM(COALESCE(duration_min, 0)) as totalFocusMinutes
        FROM focus_periods
        WHERE session_id = ?
      `, [sessionId]);
                const totalPeriods = (result === null || result === void 0 ? void 0 : result.totalPeriods) || 0;
                const interruptedPeriods = (result === null || result === void 0 ? void 0 : result.interruptedPeriods) || 0;
                const totalFocusMinutes = (result === null || result === void 0 ? void 0 : result.totalFocusMinutes) || 0;
                const averagePeriodMinutes = totalPeriods > 0
                    ? Math.round(totalFocusMinutes / totalPeriods)
                    : 0;
                const stats = {
                    totalPeriods,
                    interruptedPeriods,
                    totalFocusMinutes,
                    averagePeriodMinutes
                };
                logger_1.logger.debug('会话细分时间段统计查询成功', { sessionId, stats });
                return stats;
            }
            catch (error) {
                logger_1.logger.error('会话细分时间段统计查询失败', {
                    sessionId,
                    error: error.message
                });
                throw error;
            }
        });
    }
    deleteBySessionId(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, connection_1.runQuery)('DELETE FROM focus_periods WHERE session_id = ?', [sessionId]);
                logger_1.logger.info('会话细分时间段删除成功', {
                    sessionId,
                    deletedCount: result.changes
                });
                return result.changes;
            }
            catch (error) {
                logger_1.logger.error('会话细分时间段删除失败', {
                    sessionId,
                    error: error.message
                });
                throw error;
            }
        });
    }
    getFocusStatsByDateRange(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const periods = yield (0, connection_1.allQuery)(`SELECT fp.* 
         FROM focus_periods fp
         INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
         WHERE ps.user_id = ?
           AND fp.created_at IS NOT NULL
         ORDER BY fp.created_at ASC`, [userId]);
                logger_1.logger.debug('按日期范围查询专注时段成功', {
                    userId,
                    startDate,
                    endDate,
                    count: periods.length
                });
                return periods;
            }
            catch (error) {
                logger_1.logger.error('按日期范围查询专注时段失败', {
                    userId,
                    startDate,
                    endDate,
                    error: error.message
                });
                throw error;
            }
        });
    }
}
exports.FocusPeriodRepository = FocusPeriodRepository;
exports.default = FocusPeriodRepository;
//# sourceMappingURL=focus-period.repository.js.map