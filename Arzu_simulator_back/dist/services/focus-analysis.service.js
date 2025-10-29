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
exports.FocusAnalysisService = void 0;
const focus_period_repository_1 = require("../repositories/focus-period.repository");
const pomodoro_repository_1 = require("../repositories/pomodoro.repository");
const logger_1 = require("../config/logger");
const error_utils_1 = require("../utils/error.utils");
class FocusAnalysisService {
    constructor() {
        this.focusPeriodRepository = new focus_period_repository_1.FocusPeriodRepository();
        this.pomodoroRepository = new pomodoro_repository_1.PomodoroRepository();
    }
    getFocusStats(userId, timeframe) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('获取专注度统计数据', { userId, timeframe });
                const getWeekRange = () => {
                    const now = new Date();
                    const currentDay = now.getDay();
                    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                    const monday = new Date(now);
                    monday.setDate(now.getDate() + daysToMonday);
                    monday.setHours(0, 0, 0, 0);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);
                    return { start: monday, end: sunday };
                };
                const getMonthRange = () => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                    return { start, end };
                };
                const { start, end } = timeframe === 'week' ? getWeekRange() : getMonthRange();
                const startStr = start.toISOString();
                const endStr = end.toISOString();
                const allFocusPeriods = yield this.focusPeriodRepository.getFocusStatsByDateRange(userId, startStr, endStr);
                const allPomodoroSessions = yield this.pomodoroRepository.findByUserId(userId, { limit: 1000 });
                logger_1.logger.info('📊 [专注度统计] 原始数据查询结果', {
                    userId,
                    timeframe,
                    dateRange: { start: startStr, end: endStr },
                    allFocusPeriodsCount: allFocusPeriods.length,
                    allPomodoroSessionsCount: allPomodoroSessions.sessions.length
                });
                const focusPeriods = allFocusPeriods.filter(fp => {
                    if (!fp.created_at)
                        return false;
                    if (!fp.duration_min || fp.duration_min > 300)
                        return false;
                    const createdDateStr = fp.created_at.includes('T')
                        ? fp.created_at
                        : fp.created_at.replace(' ', 'T') + 'Z';
                    const createdDate = new Date(createdDateStr);
                    return createdDate >= start && createdDate <= end;
                });
                const pomodoroSessions = allPomodoroSessions.sessions.filter(ps => {
                    const startedAt = ps.started_at || ps.startedAt;
                    if (!startedAt)
                        return false;
                    const startedDateStr = startedAt.includes('T')
                        ? startedAt
                        : startedAt.replace(' ', 'T') + 'Z';
                    const startedDate = new Date(startedDateStr);
                    const inRange = startedDate >= start && startedDate <= end;
                    logger_1.logger.debug('📊 [专注度统计] 会话时间检查', {
                        sessionId: ps.id,
                        startedAt,
                        startedDate: startedDate.toISOString(),
                        rangeStart: start.toISOString(),
                        rangeEnd: end.toISOString(),
                        inRange
                    });
                    return inRange;
                });
                const totalFocusTime = focusPeriods.reduce((sum, fp) => sum + (fp.duration_min || 0), 0);
                const totalInterruptions = focusPeriods.filter(fp => fp.is_interrupted === true || fp.is_interrupted === 1).length;
                const totalPlannedTime = pomodoroSessions.reduce((sum, ps) => sum + (ps.duration_minutes || 0), 0);
                logger_1.logger.info('📊 [专注度统计] 数据汇总', {
                    userId,
                    timeframe,
                    focusPeriodsCount: focusPeriods.length,
                    pomodoroSessionsCount: pomodoroSessions.length,
                    totalFocusTime,
                    totalPlannedTime,
                    totalInterruptions
                });
                const now = new Date();
                const daysPassedInPeriod = timeframe === 'week'
                    ? Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                    : now.getDate();
                const avgFocusTime = daysPassedInPeriod > 0
                    ? Math.round(totalFocusTime / daysPassedInPeriod)
                    : 0;
                const avgInterruptions = daysPassedInPeriod > 0
                    ? Math.round((totalInterruptions / daysPassedInPeriod) * 10) / 10
                    : 0;
                const focusIndex = totalPlannedTime > 0
                    ? Math.min(100, Math.round((totalFocusTime / totalPlannedTime) * 100))
                    : 0;
                const numDays = timeframe === 'week' ? 7 : 30;
                const dailyData = [];
                for (let i = 0; i < numDays; i++) {
                    const currentDate = new Date(start);
                    currentDate.setDate(start.getDate() + i);
                    currentDate.setHours(0, 0, 0, 0);
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(currentDate.getDate() + 1);
                    const dayFocusPeriods = focusPeriods.filter(fp => {
                        if (!fp.created_at || !fp.duration_min || fp.duration_min > 300)
                            return false;
                        const createdDateStr = fp.created_at.includes('T')
                            ? fp.created_at
                            : fp.created_at.replace(' ', 'T') + 'Z';
                        const createdDate = new Date(createdDateStr);
                        return createdDate >= currentDate && createdDate < nextDate;
                    });
                    const dayPomodoroSessions = pomodoroSessions.filter(ps => {
                        const startedAt = ps.started_at || ps.startedAt;
                        if (!startedAt)
                            return false;
                        const startedDateStr = startedAt.includes('T')
                            ? startedAt
                            : startedAt.replace(' ', 'T') + 'Z';
                        const startedDate = new Date(startedDateStr);
                        return startedDate >= currentDate && startedDate < nextDate;
                    });
                    const dayFocusTime = dayFocusPeriods.reduce((sum, fp) => sum + (fp.duration_min || 0), 0);
                    const dayInterruptions = dayFocusPeriods.filter(fp => fp.is_interrupted === true || fp.is_interrupted === 1).length;
                    const dayPlannedTime = dayPomodoroSessions.reduce((sum, ps) => sum + (ps.duration_minutes || 0), 0);
                    const dayFocusIndex = dayPlannedTime > 0
                        ? Math.min(100, Math.round((dayFocusTime / dayPlannedTime) * 100))
                        : 0;
                    if (dayFocusPeriods.length > 0 || dayPomodoroSessions.length > 0) {
                        logger_1.logger.debug('📊 [专注度统计] 每日数据', {
                            date: currentDate.toISOString().split('T')[0],
                            focusPeriodsCount: dayFocusPeriods.length,
                            pomodoroSessionsCount: dayPomodoroSessions.length,
                            dayFocusTime,
                            dayPlannedTime,
                            dayFocusIndex
                        });
                    }
                    const dateStr = timeframe === 'week'
                        ? `${currentDate.getMonth() + 1}/${currentDate.getDate()}`
                        : `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
                    dailyData.push({
                        date: dateStr,
                        sessionDuration: Math.round(dayFocusTime),
                        interruptions: dayInterruptions,
                        focusIndex: dayFocusIndex
                    });
                }
                logger_1.logger.info('📊 [专注度统计] 每日数据汇总', {
                    userId,
                    timeframe,
                    totalDays: dailyData.length,
                    daysWithData: dailyData.filter(d => d.sessionDuration > 0 || d.focusIndex > 0).length
                });
                const result = {
                    keyMetrics: {
                        avgFocusTime,
                        avgInterruptions,
                        focusIndex
                    },
                    dailyData
                };
                logger_1.logger.info('专注度统计数据获取成功', { userId, timeframe, keyMetrics: result.keyMetrics });
                return result;
            }
            catch (error) {
                logger_1.logger.error('获取专注度统计数据失败', { userId, timeframe, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('获取专注度统计数据失败', 500);
            }
        });
    }
}
exports.FocusAnalysisService = FocusAnalysisService;
exports.default = FocusAnalysisService;
//# sourceMappingURL=focus-analysis.service.js.map