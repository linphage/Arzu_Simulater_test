"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitAnalysisService = void 0;
const brieflog_repository_1 = require("../repositories/brieflog.repository");
const task_repository_1 = require("../repositories/task.repository");
const logger_1 = require("../config/logger");
const error_utils_1 = require("../utils/error.utils");
const connection_1 = require("../database/connection");
class HabitAnalysisService {
    constructor() {
        this.briefLogRepository = new brieflog_repository_1.BriefLogRepository();
        this.taskRepository = new task_repository_1.TaskRepository();
    }
    async getHabitStats(userId, timeframe) {
        try {
            logger_1.logger.info('获取习惯分析统计数据', { userId, timeframe });
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
            const formatLocalTime = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };
            const startStr = formatLocalTime(start);
            const endStr = formatLocalTime(end);
            const briefLogs = await this.briefLogRepository.getHabitStatsByDateRange(userId, startStr, endStr);
            const uniqueTaskIds = new Set(briefLogs.map(log => log.task_id));
            const totalProblematicEvents = uniqueTaskIds.size;
            const allTasks = await (0, connection_1.allQuery)('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            logger_1.logger.info('查询到的所有任务（包含已删除）', {
                userId,
                totalTaskCount: allTasks.length,
                tasksSample: allTasks.slice(0, 5).map(t => ({
                    id: t.id,
                    title: t.title,
                    category: t.category,
                    categoryType: typeof t.category,
                    createdAt: t.created_at || t.createdAt,
                    deletedAt: t.deleted_at || t.deletedAt
                }))
            });
            const tasksInRange = allTasks.filter(task => {
                const taskCreatedAt = task.created_at || task.createdAt;
                if (!taskCreatedAt) {
                    logger_1.logger.debug('任务被过滤（无created_at/createdAt）', { taskId: task.id });
                    return false;
                }
                const category = task.category;
                if (!category || category === '' || category === 'null' || category === '0' || category === 0 || category === null) {
                    logger_1.logger.debug('任务被过滤（无效category）', { taskId: task.id, category, categoryType: typeof category });
                    return false;
                }
                const validCategories = ['勤政', '恕己', '爱人'];
                if (!validCategories.includes(category)) {
                    logger_1.logger.debug('任务被过滤（category不在有效列表中）', { taskId: task.id, category });
                    return false;
                }
                const createdAtStr = taskCreatedAt.includes('Z') ? taskCreatedAt : taskCreatedAt + 'Z';
                const createdDate = new Date(createdAtStr);
                const inRange = createdDate >= start && createdDate <= end;
                if (!inRange) {
                    logger_1.logger.debug('任务被过滤（不在时间范围内）', {
                        taskId: task.id,
                        createdDate: createdDate.toISOString(),
                        start: start.toISOString(),
                        end: end.toISOString()
                    });
                }
                return inRange;
            });
            const totalTasksCreated = tasksInRange.length;
            logger_1.logger.info('本周任务筛选结果', {
                userId,
                timeframe,
                allTasksCount: allTasks.length,
                tasksInRange: totalTasksCreated,
                startDate: startStr,
                endDate: endStr,
                tasksInRangeSample: tasksInRange.slice(0, 3).map(t => ({
                    id: t.id,
                    title: t.title,
                    category: t.category,
                    createdAt: t.created_at || t.createdAt,
                    deletedAt: t.deleted_at || t.deletedAt
                }))
            });
            const problematicEventRatio = totalTasksCreated > 0
                ? Math.round((totalProblematicEvents / totalTasksCreated) * 100)
                : 0;
            const numDays = timeframe === 'week' ? 7 : 30;
            const dailyData = [];
            for (let i = 0; i < numDays; i++) {
                const currentDate = new Date(start);
                currentDate.setDate(start.getDate() + i);
                currentDate.setHours(0, 0, 0, 0);
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                const dayLogs = briefLogs.filter(log => {
                    if (!log.created_at)
                        return false;
                    const createdDate = new Date(log.created_at);
                    return createdDate >= currentDate && createdDate < nextDate;
                });
                const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
                dailyData.push({
                    date: dateStr,
                    taskDeletion: dayLogs.filter(log => log.brief_type === 1).length,
                    categoryChange: dayLogs.filter(log => log.brief_type === 2).length,
                    priorityChange: dayLogs.filter(log => log.brief_type === 3).length,
                    dueDateChange: dayLogs.filter(log => log.brief_type === 4).length
                });
            }
            const taskTypeStats = ['勤政', '恕己', '爱人'].map(taskType => {
                const tasksOfType = tasksInRange.filter(task => task.category === taskType);
                const totalCount = tasksOfType.length;
                const affectedTaskIds = new Set(briefLogs
                    .filter(log => {
                    const task = tasksOfType.find(t => t.id === log.task_id);
                    return task !== undefined;
                })
                    .map(log => log.task_id));
                const affectedCount = affectedTaskIds.size;
                const percentage = totalCount > 0 ? Math.round((affectedCount / totalCount) * 100) : 0;
                return { taskType, affectedCount, totalCount, percentage };
            });
            const timeSlotMap = new Map();
            const timeSlots = [
                '0:00-2:00', '2:00-4:00', '4:00-6:00', '6:00-8:00',
                '8:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00',
                '16:00-18:00', '18:00-20:00', '20:00-22:00', '22:00-24:00'
            ];
            timeSlots.forEach(slot => timeSlotMap.set(slot, 0));
            briefLogs.forEach(log => {
                if (!log.created_at)
                    return;
                const timeStr = log.created_at.includes('Z') ? log.created_at : log.created_at + 'Z';
                const createdDate = new Date(timeStr);
                const utcHour = createdDate.getUTCHours();
                const cst8Hour = (utcHour + 8) % 24;
                const slotIndex = Math.floor(cst8Hour / 2);
                const timeSlot = timeSlots[slotIndex];
                timeSlotMap.set(timeSlot, (timeSlotMap.get(timeSlot) || 0) + 1);
            });
            const highFrequencyTimeSlots = Array.from(timeSlotMap.entries())
                .map(([timeSlot, count]) => ({ timeSlot, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
            const result = {
                keyMetrics: {
                    totalProblematicEvents,
                    problematicEventRatio,
                    totalTasksCreated
                },
                dailyData,
                taskTypeStats,
                highFrequencyTimeSlots
            };
            logger_1.logger.info('习惯分析统计数据获取成功', { userId, timeframe, keyMetrics: result.keyMetrics });
            return result;
        }
        catch (error) {
            logger_1.logger.error('获取习惯分析统计数据失败', { userId, timeframe, error: error.message });
            throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('获取习惯分析统计数据失败', 500);
        }
    }
}
exports.HabitAnalysisService = HabitAnalysisService;
exports.default = HabitAnalysisService;
