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
exports.TaskService = void 0;
const task_repository_1 = require("../repositories/task.repository");
const pomodoro_repository_1 = require("../repositories/pomodoro.repository");
const brieflog_repository_1 = require("../repositories/brieflog.repository");
const logger_1 = require("../config/logger");
const error_utils_1 = require("../utils/error.utils");
const connection_1 = require("../database/connection");
class TaskService {
    constructor() {
        this.taskRepository = new task_repository_1.TaskRepository();
        this.pomodoroRepository = new pomodoro_repository_1.PomodoroRepository();
        this.briefLogRepository = new brieflog_repository_1.BriefLogRepository();
    }
    createTask(userId, taskData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始创建任务', { userId, taskData });
                this.validateTaskData(taskData);
                const taskDataWithDefaults = Object.assign({ category: '勤政', priority: '铜' }, taskData);
                const taskId = yield this.taskRepository.create(userId, taskDataWithDefaults);
                const task = yield this.taskRepository.findById(taskId);
                if (!task) {
                    throw new Error('任务创建成功但无法获取');
                }
                logger_1.logger.info('任务创建成功', {
                    taskId,
                    userId,
                    title: task.title,
                    category: task.category,
                    priority: task.priority
                });
                return task;
            }
            catch (error) {
                logger_1.logger.error('任务创建失败', { userId, taskData, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('任务创建失败', 500);
            }
        });
    }
    createOfficeTask(userId, taskData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始创建办公室任务', { userId, taskData });
                const now = new Date();
                const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
                const dueDate = oneHourLater.toISOString();
                const fullTaskData = {
                    title: taskData.title,
                    description: taskData.description,
                    category: taskData.category || '勤政',
                    priority: taskData.priority || '铜',
                    dueDate: dueDate,
                    alarm: dueDate,
                    repeatDays: 0
                };
                this.validateTaskData(fullTaskData);
                const taskId = yield this.taskRepository.create(userId, fullTaskData);
                const task = yield this.taskRepository.findById(taskId);
                if (!task) {
                    throw new Error('办公室任务创建成功但无法获取');
                }
                logger_1.logger.info('办公室任务创建成功', {
                    taskId,
                    userId,
                    title: task.title,
                    category: task.category,
                    priority: task.priority,
                    dueDate: task.dueDate
                });
                return task;
            }
            catch (error) {
                logger_1.logger.error('办公室任务创建失败', { userId, taskData, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('办公室任务创建失败', 500);
            }
        });
    }
    getUserTasks(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            try {
                logger_1.logger.debug('开始获取用户任务列表', { userId, options });
                const queryOptions = Object.assign({ page: 1, limit: 10 }, options);
                const result = yield this.taskRepository.findByUserId(userId, queryOptions);
                logger_1.logger.debug('用户任务列表获取成功', {
                    userId,
                    total: result.total,
                    count: result.tasks.length,
                    page: queryOptions.page,
                    limit: queryOptions.limit
                });
                return result;
            }
            catch (error) {
                logger_1.logger.error('获取用户任务列表失败', { userId, options, error: error.message });
                throw new error_utils_1.ApiError('获取任务列表失败', 500);
            }
        });
    }
    getTaskById(userId, taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.debug('开始获取任务', { userId, taskId });
                const task = yield this.taskRepository.findByIdAndUserId(taskId, userId);
                if (!task) {
                    throw new error_utils_1.NotFoundError('任务不存在或无权限访问');
                }
                logger_1.logger.debug('任务获取成功', { taskId, userId, title: task.title });
                return task;
            }
            catch (error) {
                logger_1.logger.error('获取任务失败', { userId, taskId, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('获取任务失败', 500);
            }
        });
    }
    updateTask(userId, taskId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始更新任务', { userId, taskId, updateData });
                const existingTask = yield this.taskRepository.findByIdAndUserId(taskId, userId);
                if (!existingTask) {
                    throw new error_utils_1.NotFoundError('任务不存在或无权限访问');
                }
                this.validateUpdateData(updateData);
                const changeReason = updateData.changeReason;
                const taskUpdateData = Object.assign({}, updateData);
                delete taskUpdateData.changeReason;
                if (updateData.completed === true && !existingTask.completed) {
                    taskUpdateData.completedAt = new Date().toISOString();
                }
                const briefLogs = [];
                let latestSessionId = undefined;
                try {
                    const recentSessions = yield this.pomodoroRepository.findByTaskId(taskId);
                    if (recentSessions && recentSessions.length > 0) {
                        latestSessionId = recentSessions[0].id;
                    }
                }
                catch (error) {
                    logger_1.logger.debug('获取番茄钟会话失败，将不关联session_id', { taskId });
                }
                if (updateData.category && updateData.category !== existingTask.category) {
                    briefLogs.push({
                        session_id: latestSessionId,
                        task_id: taskId,
                        user_id: userId,
                        brief_type: brieflog_repository_1.BriefType.CATEGORY_CHANGE,
                        brief_content: changeReason || `任务类型从 ${existingTask.category} 改为 ${updateData.category}`
                    });
                    logger_1.logger.debug('检测到任务类型变更', {
                        from: existingTask.category,
                        to: updateData.category
                    });
                }
                if (updateData.priority && updateData.priority !== existingTask.priority) {
                    briefLogs.push({
                        session_id: latestSessionId,
                        task_id: taskId,
                        user_id: userId,
                        brief_type: brieflog_repository_1.BriefType.PRIORITY_CHANGE,
                        brief_content: changeReason || `优先级从 ${existingTask.priority} 改为 ${updateData.priority}`
                    });
                    logger_1.logger.debug('检测到优先级变更', {
                        from: existingTask.priority,
                        to: updateData.priority
                    });
                }
                const normalizeDateString = (dateStr) => {
                    if (!dateStr)
                        return null;
                    try {
                        return new Date(dateStr).toISOString();
                    }
                    catch (_a) {
                        return dateStr;
                    }
                };
                const existingDueDate = normalizeDateString(existingTask.dueDate);
                const newDueDate = updateData.dueDate ? normalizeDateString(updateData.dueDate) : null;
                if (newDueDate && existingDueDate !== newDueDate) {
                    if (existingTask.dueDate && existingTask.alarm) {
                        const oldDueTime = new Date(existingTask.dueDate).getTime();
                        const oldAlarmTime = new Date(existingTask.alarm).getTime();
                        const timeDifference = oldDueTime - oldAlarmTime;
                        const newDueTime = new Date(updateData.dueDate).getTime();
                        const newAlarmTime = newDueTime - timeDifference;
                        taskUpdateData.alarm = new Date(newAlarmTime).toISOString();
                        logger_1.logger.info('自动计算新的提醒时间', {
                            oldDueDate: existingTask.dueDate,
                            oldAlarm: existingTask.alarm,
                            newDueDate: updateData.dueDate,
                            newAlarm: taskUpdateData.alarm,
                            timeDifference: `${timeDifference / 60000} 分钟`
                        });
                    }
                    briefLogs.push({
                        session_id: latestSessionId,
                        task_id: taskId,
                        user_id: userId,
                        brief_type: brieflog_repository_1.BriefType.DUE_DATE_CHANGE,
                        brief_content: changeReason || `截止时间从 ${existingTask.dueDate} 改为 ${updateData.dueDate}`
                    });
                    logger_1.logger.debug('检测到截止时间变更', {
                        from: existingTask.dueDate,
                        to: updateData.dueDate
                    });
                }
                yield (0, connection_1.executeTransaction)((db) => __awaiter(this, void 0, void 0, function* () {
                    yield this.taskRepository.update(taskId, taskUpdateData);
                    if (briefLogs.length > 0) {
                        yield this.briefLogRepository.createBatch(briefLogs);
                        logger_1.logger.info('任务变更日志已记录', {
                            taskId,
                            userId,
                            logCount: briefLogs.length,
                            changeTypes: briefLogs.map(log => log.brief_type)
                        });
                    }
                }));
                const updatedTask = yield this.taskRepository.findById(taskId);
                if (!updatedTask) {
                    throw new Error('任务更新成功但无法获取');
                }
                logger_1.logger.info('任务更新成功', {
                    taskId,
                    userId,
                    title: updatedTask.title,
                    updatedFields: Object.keys(updateData)
                });
                return updatedTask;
            }
            catch (error) {
                logger_1.logger.error('更新任务失败', { userId, taskId, updateData, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('更新任务失败', 500);
            }
        });
    }
    deleteTask(userId, taskId, deleteReason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始删除任务', { userId, taskId, deleteReason });
                const existingTask = yield this.taskRepository.findByIdAndUserId(taskId, userId);
                if (!existingTask) {
                    throw new error_utils_1.NotFoundError('任务不存在或无权限访问');
                }
                let latestSessionId = undefined;
                try {
                    const recentSessions = yield this.pomodoroRepository.findByTaskId(taskId);
                    if (recentSessions && recentSessions.length > 0) {
                        latestSessionId = recentSessions[0].id;
                    }
                }
                catch (error) {
                    logger_1.logger.debug('获取番茄钟会话失败，将不关联session_id', { taskId });
                }
                yield (0, connection_1.executeTransaction)((db) => __awaiter(this, void 0, void 0, function* () {
                    if (deleteReason) {
                        yield this.briefLogRepository.create({
                            session_id: latestSessionId,
                            task_id: taskId,
                            user_id: userId,
                            brief_type: brieflog_repository_1.BriefType.DELETE_REASON,
                            brief_content: deleteReason
                        });
                        logger_1.logger.info('删除原因已记录', { taskId, userId, deleteReason });
                    }
                    yield this.pomodoroRepository.deleteByTaskId(taskId);
                    yield this.taskRepository.delete(taskId);
                }));
                logger_1.logger.info('任务删除成功', { taskId, userId, title: existingTask.title });
            }
            catch (error) {
                logger_1.logger.error('删除任务失败', { userId, taskId, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('删除任务失败', 500);
            }
        });
    }
    batchOperateTasks(userId, operationData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { operation, taskIds, data } = operationData;
                logger_1.logger.info('开始批量操作任务', { userId, operation, taskCount: taskIds.length });
                const tasks = yield Promise.all(taskIds.map(taskId => this.taskRepository.findByIdAndUserId(taskId, userId)));
                const nonExistentTasks = taskIds.filter((_, index) => !tasks[index]);
                if (nonExistentTasks.length > 0) {
                    throw new error_utils_1.ValidationError('部分任务不存在或无权限访问', {
                        nonExistentTasks
                    });
                }
                let succeeded = 0;
                let failed = 0;
                const errors = [];
                for (const taskId of taskIds) {
                    try {
                        switch (operation) {
                            case 'complete':
                                yield this.taskRepository.update(taskId, { completed: true });
                                break;
                            case 'delete':
                                yield this.deleteTask(userId, taskId);
                                break;
                            case 'update_category':
                                if (!(data === null || data === void 0 ? void 0 : data.category)) {
                                    throw new error_utils_1.ValidationError('需要提供新的分类');
                                }
                                yield this.taskRepository.update(taskId, { category: data.category });
                                break;
                            case 'update_priority':
                                if (!(data === null || data === void 0 ? void 0 : data.priority)) {
                                    throw new error_utils_1.ValidationError('需要提供新的优先级');
                                }
                                yield this.taskRepository.update(taskId, { priority: data.priority });
                                break;
                            case 'update_due_date':
                                if (!(data === null || data === void 0 ? void 0 : data.dueDate)) {
                                    throw new error_utils_1.ValidationError('需要提供新的截止日期');
                                }
                                yield this.taskRepository.update(taskId, { due_date: data.dueDate });
                                break;
                            default:
                                throw new error_utils_1.ValidationError(`不支持的操作类型: ${operation}`);
                        }
                        succeeded++;
                    }
                    catch (error) {
                        failed++;
                        errors.push({
                            id: taskId,
                            error: error.message || '操作失败'
                        });
                        logger_1.logger.error(`批量操作失败 - 任务 ${taskId}`, {
                            taskId,
                            operation,
                            error: error.message
                        });
                    }
                }
                const result = {
                    success: failed === 0,
                    processed: taskIds.length,
                    succeeded,
                    failed,
                    errors
                };
                logger_1.logger.info('批量操作任务完成', {
                    userId,
                    operation,
                    processed: taskIds.length,
                    succeeded,
                    failed
                });
                return result;
            }
            catch (error) {
                logger_1.logger.error('批量操作任务失败', { userId, operationData, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('批量操作失败', 500);
            }
        });
    }
    getTaskStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.debug('开始获取任务统计', { userId });
                const stats = yield this.taskRepository.getTaskStats(userId);
                logger_1.logger.debug('任务统计获取成功', { userId, stats });
                return stats;
            }
            catch (error) {
                logger_1.logger.error('获取任务统计失败', { userId, error: error.message });
                throw new error_utils_1.ApiError('获取任务统计失败', 500);
            }
        });
    }
    getTaskAnalytics(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, days = 30) {
            try {
                logger_1.logger.debug('开始获取任务分析数据', { userId, days });
                const analytics = yield this.taskRepository.getTaskAnalytics(userId, days);
                logger_1.logger.debug('任务分析数据获取成功', { userId, days });
                return analytics;
            }
            catch (error) {
                logger_1.logger.error('获取任务分析数据失败', { userId, days, error: error.message });
                throw new error_utils_1.ApiError('获取任务分析数据失败', 500);
            }
        });
    }
    searchTasks(userId_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (userId, query, limit = 10) {
            try {
                logger_1.logger.debug('开始搜索任务', { userId, query, limit });
                const tasks = yield this.taskRepository.searchTasks(userId, query, limit);
                logger_1.logger.debug('任务搜索成功', { userId, query, resultCount: tasks.length });
                return tasks;
            }
            catch (error) {
                logger_1.logger.error('搜索任务失败', { userId, query, limit, error: error.message });
                throw new error_utils_1.ApiError('搜索任务失败', 500);
            }
        });
    }
    getUpcomingTasks(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, daysAhead = 7) {
            try {
                logger_1.logger.debug('开始获取即将到期任务', { userId, daysAhead });
                const tasks = yield this.taskRepository.getUpcomingTasks(userId, daysAhead);
                logger_1.logger.debug('即将到期任务获取成功', { userId, daysAhead, taskCount: tasks.length });
                return tasks;
            }
            catch (error) {
                logger_1.logger.error('获取即将到期任务失败', { userId, daysAhead, error: error.message });
                throw new error_utils_1.ApiError('获取即将到期任务失败', 500);
            }
        });
    }
    getOverdueTasks(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.debug('开始获取逾期任务', { userId });
                const tasks = yield this.taskRepository.getOverdueTasks(userId);
                logger_1.logger.debug('逾期任务获取成功', { userId, taskCount: tasks.length });
                return tasks;
            }
            catch (error) {
                logger_1.logger.error('获取逾期任务失败', { userId, error: error.message });
                throw new error_utils_1.ApiError('获取逾期任务失败', 500);
            }
        });
    }
    archiveCompletedTasks(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, daysOld = 30) {
            try {
                logger_1.logger.info('开始归档已完成任务', { userId, daysOld });
                const archivedCount = yield this.taskRepository.archiveCompletedTasks(userId, daysOld);
                logger_1.logger.info('归档已完成任务完成', { userId, daysOld, archivedCount });
                return archivedCount;
            }
            catch (error) {
                logger_1.logger.error('归档已完成任务失败', { userId, daysOld, error: error.message });
                throw new error_utils_1.ApiError('归档已完成任务失败', 500);
            }
        });
    }
    createPomodoroSession(userId, sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始创建番茄钟会话', { userId, sessionData });
                if (sessionData.taskId) {
                    const task = yield this.taskRepository.findByIdAndUserId(sessionData.taskId, userId);
                    if (!task) {
                        throw new error_utils_1.ValidationError('任务不存在或无权限访问');
                    }
                }
                const activeSession = yield this.pomodoroRepository.getActiveSession(userId);
                if (activeSession) {
                    throw new error_utils_1.ValidationError(`已有活跃的番茄钟会话（会话ID: ${activeSession.id}，开始时间: ${activeSession.startedAt}）`);
                }
                const sessionId = yield this.pomodoroRepository.create(userId, sessionData);
                const session = yield this.pomodoroRepository.findById(sessionId);
                if (!session) {
                    throw new Error('番茄钟会话创建成功但无法获取');
                }
                logger_1.logger.info('番茄钟会话创建成功', {
                    sessionId,
                    userId,
                    taskId: sessionData.taskId,
                    durationMinutes: session.durationMinutes
                });
                return session;
            }
            catch (error) {
                logger_1.logger.error('创建番茄钟会话失败', { userId, sessionData, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('创建番茄钟会话失败', 500);
            }
        });
    }
    completePomodoroSession(userId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始完成番茄钟会话', { userId, sessionId });
                const session = yield this.pomodoroRepository.findByIdAndUserId(sessionId, userId);
                if (!session) {
                    throw new error_utils_1.NotFoundError('番茄钟会话不存在或无权限访问');
                }
                if (session.completed) {
                    throw new error_utils_1.ValidationError('番茄钟会话已完成');
                }
                yield (0, connection_1.executeTransaction)((db) => __awaiter(this, void 0, void 0, function* () {
                    yield this.pomodoroRepository.completeSession(sessionId);
                    if (session.taskId) {
                        yield this.taskRepository.incrementPomodoroCount(session.taskId);
                    }
                }));
                const updatedSession = yield this.pomodoroRepository.findById(sessionId);
                if (!updatedSession) {
                    throw new Error('番茄钟会话完成成功但无法获取');
                }
                logger_1.logger.info('番茄钟会话完成成功', {
                    sessionId,
                    userId,
                    taskId: session.taskId,
                    completedAt: updatedSession.completedAt
                });
                return updatedSession;
            }
            catch (error) {
                logger_1.logger.error('完成番茄钟会话失败', { userId, sessionId, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('完成番茄钟会话失败', 500);
            }
        });
    }
    endPomodoroSession(userId, sessionId, endData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始结束番茄钟会话', { userId, sessionId, endData });
                const session = yield this.pomodoroRepository.findByIdAndUserId(sessionId, userId);
                if (!session) {
                    throw new error_utils_1.NotFoundError('番茄钟会话不存在或无权限访问');
                }
                if (session.completedAt) {
                    throw new error_utils_1.ValidationError('番茄钟会话已结束');
                }
                let actualDuration;
                if (endData.updateDuration) {
                    actualDuration = yield this.pomodoroRepository.calculateSessionActualDuration(sessionId);
                    logger_1.logger.info('计算会话实际时长', { sessionId, actualDuration });
                }
                yield this.pomodoroRepository.endSession(sessionId, {
                    completed: endData.completed,
                    completedAt: endData.completedAt,
                    updateDuration: endData.updateDuration,
                    actualDuration
                });
                const updatedSession = yield this.pomodoroRepository.findById(sessionId);
                if (!updatedSession) {
                    throw new Error('番茄钟会话结束成功但无法获取');
                }
                logger_1.logger.info('番茄钟会话结束成功', {
                    sessionId,
                    userId,
                    completed: endData.completed,
                    actualDuration,
                    completedAt: updatedSession.completedAt
                });
                return updatedSession;
            }
            catch (error) {
                logger_1.logger.error('结束番茄钟会话失败', { userId, sessionId, endData, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('结束番茄钟会话失败', 500);
            }
        });
    }
    getPomodoroSessions(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            try {
                logger_1.logger.debug('开始获取番茄钟会话列表', { userId, options });
                const queryOptions = {
                    page: options.page || 1,
                    limit: options.limit || 50,
                    taskId: options.taskId,
                    completed: options.completed,
                    offset: ((options.page || 1) - 1) * (options.limit || 50)
                };
                const result = yield this.pomodoroRepository.findByUserId(userId, queryOptions);
                logger_1.logger.debug('番茄钟会话列表获取成功', {
                    userId,
                    total: result.total,
                    count: result.sessions.length
                });
                return result;
            }
            catch (error) {
                logger_1.logger.error('获取番茄钟会话列表失败', { userId, options, error: error.message });
                throw new error_utils_1.ApiError('获取番茄钟会话列表失败', 500);
            }
        });
    }
    getPomodoroStats(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, days = 30) {
            try {
                logger_1.logger.debug('开始获取番茄钟统计', { userId, days });
                const stats = yield this.pomodoroRepository.getPomodoroStats(userId, days);
                logger_1.logger.debug('番茄钟统计获取成功', { userId, days, stats });
                return stats;
            }
            catch (error) {
                logger_1.logger.error('获取番茄钟统计失败', { userId, days, error: error.message });
                throw new error_utils_1.ApiError('获取番茄钟统计失败', 500);
            }
        });
    }
    getActivePomodoroSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.debug('开始获取活跃番茄钟会话', { userId });
                const session = yield this.pomodoroRepository.getActiveSession(userId);
                logger_1.logger.debug('活跃番茄钟会话获取成功', { userId, hasActiveSession: !!session });
                return session || null;
            }
            catch (error) {
                logger_1.logger.error('获取活跃番茄钟会话失败', { userId, error: error.message });
                throw new error_utils_1.ApiError('获取活跃番茄钟会话失败', 500);
            }
        });
    }
    validateTaskData(taskData) {
        const { title, description, dueDate } = taskData;
        if (!title || title.trim().length === 0) {
            throw new error_utils_1.ValidationError('任务标题不能为空');
        }
        if (title.length > 255) {
            throw new error_utils_1.ValidationError('任务标题长度不能超过255个字符');
        }
        if (description && description.length > 1000) {
            throw new error_utils_1.ValidationError('任务描述长度不能超过1000个字符');
        }
        if (dueDate) {
            const dueDateObj = new Date(dueDate);
            if (isNaN(dueDateObj.getTime())) {
                throw new error_utils_1.ValidationError('无效的截止日期格式');
            }
            if (dueDateObj < new Date()) {
                throw new error_utils_1.ValidationError('任务截止日期不能早于当前时间');
            }
        }
    }
    validateUpdateData(updateData) {
        if (updateData.title !== undefined) {
            if (!updateData.title || updateData.title.trim().length === 0) {
                throw new error_utils_1.ValidationError('任务标题不能为空');
            }
            if (updateData.title.length > 255) {
                throw new error_utils_1.ValidationError('任务标题长度不能超过255个字符');
            }
        }
        if (updateData.description !== undefined && updateData.description.length > 1000) {
            throw new error_utils_1.ValidationError('任务描述长度不能超过1000个字符');
        }
        if (updateData.dueDate) {
            const dueDateObj = new Date(updateData.dueDate);
            if (isNaN(dueDateObj.getTime())) {
                throw new error_utils_1.ValidationError('无效的截止日期格式');
            }
            if (dueDateObj < new Date()) {
                throw new error_utils_1.ValidationError('任务截止日期不能早于当前时间');
            }
        }
    }
    updateTaskCompletionFromPomodoro(userId, taskId, sessionId, markAsCompleted, completedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始更新任务完成状态（番茄钟）', {
                    userId,
                    taskId,
                    sessionId,
                    markAsCompleted,
                    completedAt
                });
                const task = yield this.taskRepository.findByIdAndUserId(taskId, userId);
                if (!task) {
                    throw new error_utils_1.NotFoundError('任务不存在或无权限访问');
                }
                const session = yield this.pomodoroRepository.findByIdAndUserId(sessionId, userId);
                if (!session) {
                    throw new error_utils_1.NotFoundError('番茄钟会话不存在或无权限访问');
                }
                yield this.taskRepository.updateTaskCompletionFromPomodoro(taskId, sessionId, {
                    markAsCompleted,
                    completedAt
                });
                const updatedTask = yield this.taskRepository.findById(taskId);
                if (!updatedTask) {
                    throw new Error('任务更新成功但无法获取');
                }
                logger_1.logger.info('任务完成状态更新成功（番茄钟）', {
                    taskId,
                    userId,
                    sessionId,
                    markAsCompleted,
                    focusTime: updatedTask.focusTime,
                    pomodoroCount: updatedTask.pomodoroCount
                });
                return updatedTask;
            }
            catch (error) {
                logger_1.logger.error('更新任务完成状态失败（番茄钟）', {
                    userId,
                    taskId,
                    sessionId,
                    markAsCompleted,
                    error: error.message
                });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('更新任务完成状态失败', 500);
            }
        });
    }
    getCalendarCheckIns(userId, year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('获取用户打卡日历数据', { userId, year, month });
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0);
                const startDateStr = startDate.toISOString().split('T')[0];
                const endDateStr = endDate.toISOString().split('T')[0];
                const completedDates = yield this.taskRepository.getCompletedDates(userId, startDateStr, endDateStr);
                const checkIns = [];
                const daysInMonth = endDate.getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasCheckIn = completedDates.includes(dateStr);
                    checkIns.push({ date: dateStr, hasCheckIn });
                }
                logger_1.logger.info('打卡日历数据获取成功', { userId, year, month, totalDays: checkIns.length });
                return checkIns;
            }
            catch (error) {
                logger_1.logger.error('获取打卡日历数据失败', { userId, year, month, error: error.message });
                throw new error_utils_1.ApiError('获取打卡日历数据失败', 500);
            }
        });
    }
    createMakeUpCheckIn(userId, checkInDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始补打卡', { userId, checkInDate });
                const user = yield this.taskRepository.getUserRewardCount(userId);
                if (user.reward_count >= 2) {
                    throw new error_utils_1.ValidationError('本月补打卡次数已用完（2次/月）');
                }
                const date = new Date(checkInDate);
                date.setHours(12, 1, 0, 0);
                const completedAt = date.toISOString();
                date.setMinutes(2);
                const deletedAt = date.toISOString();
                const taskData = {
                    title: '补打卡',
                    description: '补打卡',
                    category: null,
                    priority: null,
                    dueDate: null,
                    alarm: null,
                    repeatDays: null
                };
                const taskId = yield this.taskRepository.createMakeUpCheckIn(userId, taskData, completedAt, deletedAt);
                yield this.taskRepository.incrementRewardCount(userId);
                const task = yield this.taskRepository.findById(taskId);
                if (!task) {
                    throw new error_utils_1.NotFoundError('补打卡记录创建失败');
                }
                logger_1.logger.info('补打卡成功', { userId, checkInDate, taskId });
                return task;
            }
            catch (error) {
                logger_1.logger.error('补打卡失败', { userId, checkInDate, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('补打卡失败', 500);
            }
        });
    }
    getRecentTaskStats(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, days = 7) {
            try {
                logger_1.logger.info('获取近期任务统计', { userId, days });
                const stats = yield this.taskRepository.getRecentTaskStats(userId, days);
                logger_1.logger.info('近期任务统计获取成功', { userId, days, recordCount: stats.length });
                return stats;
            }
            catch (error) {
                logger_1.logger.error('获取近期任务统计失败', { userId, days, error: error.message });
                throw new error_utils_1.ApiError('获取近期任务统计失败', 500);
            }
        });
    }
    getCompletionStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('获取完成度统计数据', { userId });
                const getWeekRange = (weeksAgo) => {
                    const now = new Date();
                    const currentDay = now.getDay();
                    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                    const monday = new Date(now);
                    monday.setDate(now.getDate() + daysToMonday - (weeksAgo * 7));
                    monday.setHours(0, 0, 0, 0);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);
                    return {
                        start: monday.toISOString(),
                        end: sunday.toISOString()
                    };
                };
                const calculateWeekStats = (weeksAgo) => __awaiter(this, void 0, void 0, function* () {
                    const { start, end } = getWeekRange(weeksAgo);
                    const allTasks = yield this.taskRepository.getTasksByDateRange(userId, start, end);
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const tasks = allTasks.filter(t => {
                        const dueDate = t.due_date || t.dueDate;
                        if (!dueDate)
                            return false;
                        const taskDueDate = new Date(dueDate);
                        return taskDueDate >= startDate && taskDueDate <= endDate;
                    });
                    logger_1.logger.info(`第${weeksAgo}周统计`, {
                        weekLabel: weeksAgo === 0 ? '本周' : `前${weeksAgo}周`,
                        start,
                        end,
                        allTasksCount: allTasks.length,
                        filteredTasksCount: tasks.length,
                        tasks: tasks.map(t => ({
                            id: t.id,
                            title: t.title,
                            due_date: t.due_date,
                            dueDate: t.dueDate,
                            category: t.category,
                            completed: t.completed
                        }))
                    });
                    const totalTasks = tasks.filter(t => t.category !== null).length;
                    const completedTasks = tasks.filter(t => t.category !== null && t.completed === 1).length;
                    const now = new Date();
                    const overdueTasks = tasks.filter(t => {
                        const dueDate = t.due_date || t.dueDate;
                        return t.category !== null &&
                            t.completed === 0 &&
                            dueDate &&
                            new Date(dueDate) < now;
                    }).length;
                    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                    const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
                    logger_1.logger.info(`第${weeksAgo}周结果`, {
                        weekLabel: weeksAgo === 0 ? '本周' : `前${weeksAgo}周`,
                        totalTasks,
                        completedTasks,
                        overdueTasks,
                        completionRate: completionRate.toFixed(1),
                        overdueRate: overdueRate.toFixed(1)
                    });
                    return { completionRate, overdueRate, totalTasks };
                });
                const [week0, week1, week2, week3] = yield Promise.all([
                    calculateWeekStats(0),
                    calculateWeekStats(1),
                    calculateWeekStats(2),
                    calculateWeekStats(3)
                ]);
                const result = {
                    weeklyStats: {
                        completionRate: Math.round(week0.completionRate * 10) / 10,
                        overdueRate: Math.round(week0.overdueRate * 10) / 10,
                        totalTasks: week0.totalTasks
                    },
                    trendData: [
                        {
                            week: '前3周',
                            completionRate: Math.round(week3.completionRate * 10) / 10,
                            overdueRate: Math.round(week3.overdueRate * 10) / 10
                        },
                        {
                            week: '前2周',
                            completionRate: Math.round(week2.completionRate * 10) / 10,
                            overdueRate: Math.round(week2.overdueRate * 10) / 10
                        },
                        {
                            week: '前1周',
                            completionRate: Math.round(week1.completionRate * 10) / 10,
                            overdueRate: Math.round(week1.overdueRate * 10) / 10
                        },
                        {
                            week: '本周',
                            completionRate: Math.round(week0.completionRate * 10) / 10,
                            overdueRate: Math.round(week0.overdueRate * 10) / 10
                        }
                    ]
                };
                logger_1.logger.info('完成度统计数据获取成功', { userId, weeklyStats: result.weeklyStats });
                return result;
            }
            catch (error) {
                logger_1.logger.error('获取完成度统计数据失败', { userId, error: error.message });
                throw new error_utils_1.ApiError('获取完成度统计数据失败', 500);
            }
        });
    }
}
exports.TaskService = TaskService;
exports.default = TaskService;
//# sourceMappingURL=task.service.js.map