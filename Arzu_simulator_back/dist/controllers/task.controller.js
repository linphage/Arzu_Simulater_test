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
exports.TaskController = void 0;
const express_validator_1 = require("express-validator");
const task_service_1 = require("../services/task.service");
const error_utils_1 = require("../utils/error.utils");
const logger_1 = require("../config/logger");
const error_utils_2 = require("../utils/error.utils");
class TaskController {
    constructor() {
        this.createTask = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('收到创建任务请求', {
                userId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const taskData = req.body;
            try {
                const task = yield this.taskService.createTask(userId, taskData);
                logger_1.logger.info('任务创建成功', {
                    taskId: task.id,
                    userId,
                    title: task.title,
                    category: task.category,
                    priority: task.priority
                });
                res.status(201).json({
                    success: true,
                    message: '任务创建成功',
                    data: task
                });
            }
            catch (error) {
                logger_1.logger.error('任务创建失败', {
                    userId,
                    taskData,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.createOfficeTask = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('收到创建办公室任务请求', {
                userId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const { title, description, category, priority } = req.body;
            try {
                const task = yield this.taskService.createOfficeTask(userId, {
                    title,
                    description,
                    category,
                    priority
                });
                logger_1.logger.info('办公室任务创建成功', {
                    taskId: task.id,
                    userId,
                    title: task.title,
                    category: task.category,
                    priority: task.priority,
                    dueDate: task.dueDate
                });
                res.status(201).json({
                    success: true,
                    message: '办公室任务创建成功',
                    data: task
                });
            }
            catch (error) {
                logger_1.logger.error('办公室任务创建失败', {
                    userId,
                    taskData: { title, description, category, priority },
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getUserTasks = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.debug('收到获取用户任务列表请求', {
                userId,
                query: req.query,
                ip: req.ip
            });
            try {
                const queryParams = {
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 10,
                    category: req.query.category,
                    priority: req.query.priority,
                    completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
                    search: req.query.search,
                    dueDateFrom: req.query.dueDateFrom,
                    dueDateTo: req.query.dueDateTo,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                    includeCompleted: req.query.includeCompleted !== 'false',
                    includeOverdue: req.query.includeOverdue !== 'false'
                };
                const result = yield this.taskService.getUserTasks(userId, queryParams);
                const totalPages = Math.ceil(result.total / queryParams.limit);
                logger_1.logger.debug('用户任务列表获取成功', {
                    userId,
                    total: result.total,
                    count: result.tasks.length,
                    page: queryParams.page,
                    limit: queryParams.limit
                });
                res.json({
                    success: true,
                    data: {
                        tasks: result.tasks,
                        pagination: {
                            page: queryParams.page,
                            limit: queryParams.limit,
                            total: result.total,
                            totalPages,
                            hasNext: queryParams.page < totalPages,
                            hasPrev: queryParams.page > 1
                        }
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('获取用户任务列表失败', {
                    userId,
                    query: req.query,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getTaskById = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const taskId = parseInt(req.params.id);
            logger_1.logger.debug('收到获取任务请求', { userId, taskId, ip: req.ip });
            try {
                const task = yield this.taskService.getTaskById(userId, taskId);
                logger_1.logger.debug('任务获取成功', { taskId, userId, title: task.title });
                res.json({
                    success: true,
                    data: task
                });
            }
            catch (error) {
                logger_1.logger.error('获取任务失败', { userId, taskId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.updateTask = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const taskId = parseInt(req.params.id);
            logger_1.logger.info('收到更新任务请求', { userId, taskId, ip: req.ip });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const updateData = req.body;
            try {
                const updatedTask = yield this.taskService.updateTask(userId, taskId, updateData);
                logger_1.logger.info('任务更新成功', {
                    taskId,
                    userId,
                    title: updatedTask.title,
                    updatedFields: Object.keys(updateData)
                });
                res.json({
                    success: true,
                    message: '任务更新成功',
                    data: updatedTask
                });
            }
            catch (error) {
                logger_1.logger.error('更新任务失败', { userId, taskId, updateData, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.deleteTask = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const taskId = parseInt(req.params.id);
            const { deleteReason } = req.body;
            logger_1.logger.info('收到删除任务请求', { userId, taskId, deleteReason, ip: req.ip });
            try {
                yield this.taskService.deleteTask(userId, taskId, deleteReason);
                logger_1.logger.info('任务删除成功', { taskId, userId });
                res.json({
                    success: true,
                    message: '任务删除成功'
                });
            }
            catch (error) {
                logger_1.logger.error('删除任务失败', { userId, taskId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.batchOperateTasks = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('收到批量操作任务请求', { userId, ip: req.ip });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const operationData = req.body;
            try {
                const result = yield this.taskService.batchOperateTasks(userId, operationData);
                logger_1.logger.info('批量操作任务完成', {
                    userId,
                    operation: operationData.operation,
                    processed: result.processed,
                    succeeded: result.succeeded,
                    failed: result.failed
                });
                res.json({
                    success: true,
                    message: '批量操作完成',
                    data: result
                });
            }
            catch (error) {
                logger_1.logger.error('批量操作任务失败', {
                    userId,
                    operationData,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getTaskStats = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.debug('收到获取任务统计请求', { userId, ip: req.ip });
            try {
                const stats = yield this.taskService.getTaskStats(userId);
                logger_1.logger.debug('任务统计获取成功', { userId, stats });
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取任务统计失败', { userId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getTaskAnalytics = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const days = parseInt(req.query.days) || 30;
            logger_1.logger.debug('收到获取任务分析数据请求', { userId, days, ip: req.ip });
            try {
                if (days < 1 || days > 365) {
                    throw new error_utils_1.ValidationError('天数必须在1-365之间');
                }
                const analytics = yield this.taskService.getTaskAnalytics(userId, days);
                logger_1.logger.debug('任务分析数据获取成功', { userId, days });
                res.json({
                    success: true,
                    data: analytics
                });
            }
            catch (error) {
                logger_1.logger.error('获取任务分析数据失败', { userId, days, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.searchTasks = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const query = req.query.q;
            const limit = parseInt(req.query.limit) || 10;
            logger_1.logger.debug('收到搜索任务请求', { userId, query, limit, ip: req.ip });
            try {
                if (!query || query.trim().length === 0) {
                    throw new error_utils_1.ValidationError('搜索关键词不能为空');
                }
                if (query.length > 100) {
                    throw new error_utils_1.ValidationError('搜索关键词长度不能超过100个字符');
                }
                if (limit < 1 || limit > 50) {
                    throw new error_utils_1.ValidationError('结果数量必须在1-50之间');
                }
                const tasks = yield this.taskService.searchTasks(userId, query, limit);
                logger_1.logger.debug('任务搜索成功', { userId, query, resultCount: tasks.length });
                res.json({
                    success: true,
                    data: {
                        tasks,
                        query,
                        resultCount: tasks.length
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('搜索任务失败', { userId, query, limit, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getUpcomingTasks = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const daysAhead = parseInt(req.query.days) || 7;
            logger_1.logger.debug('收到获取即将到期任务请求', { userId, daysAhead, ip: req.ip });
            try {
                if (daysAhead < 1 || daysAhead > 365) {
                    throw new error_utils_1.ValidationError('天数必须在1-365之间');
                }
                const tasks = yield this.taskService.getUpcomingTasks(userId, daysAhead);
                logger_1.logger.debug('即将到期任务获取成功', { userId, daysAhead, taskCount: tasks.length });
                res.json({
                    success: true,
                    data: {
                        tasks,
                        daysAhead,
                        taskCount: tasks.length
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('获取即将到期任务失败', { userId, daysAhead, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getOverdueTasks = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.debug('收到获取逾期任务请求', { userId, ip: req.ip });
            try {
                const tasks = yield this.taskService.getOverdueTasks(userId);
                logger_1.logger.debug('逾期任务获取成功', { userId, taskCount: tasks.length });
                res.json({
                    success: true,
                    data: {
                        tasks,
                        taskCount: tasks.length
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('获取逾期任务失败', { userId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.archiveCompletedTasks = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const daysOld = parseInt(req.query.days) || 30;
            logger_1.logger.info('收到归档已完成任务请求', { userId, daysOld, ip: req.ip });
            try {
                if (daysOld < 1 || daysOld > 365) {
                    throw new error_utils_1.ValidationError('天数必须在1-365之间');
                }
                const archivedCount = yield this.taskService.archiveCompletedTasks(userId, daysOld);
                logger_1.logger.info('归档已完成任务完成', { userId, daysOld, archivedCount });
                res.json({
                    success: true,
                    message: `成功归档 ${archivedCount} 个任务`,
                    data: {
                        archivedCount,
                        daysOld
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('归档已完成任务失败', { userId, daysOld, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.createPomodoroSession = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('收到创建番茄钟会话请求', { userId, ip: req.ip });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const sessionData = req.body;
            try {
                const session = yield this.taskService.createPomodoroSession(userId, sessionData);
                logger_1.logger.info('番茄钟会话创建成功', {
                    sessionId: session.id,
                    userId,
                    taskId: session.taskId,
                    durationMinutes: session.durationMinutes
                });
                res.status(201).json({
                    success: true,
                    message: '番茄钟会话创建成功',
                    data: session
                });
            }
            catch (error) {
                logger_1.logger.error('创建番茄钟会话失败', { userId, sessionData, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.completePomodoroSession = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const sessionId = parseInt(req.params.sessionId);
            logger_1.logger.info('收到完成番茄钟会话请求', { userId, sessionId, ip: req.ip });
            try {
                const session = yield this.taskService.completePomodoroSession(userId, sessionId);
                logger_1.logger.info('番茄钟会话完成成功', {
                    sessionId,
                    userId,
                    taskId: session.taskId,
                    completedAt: session.completedAt
                });
                res.json({
                    success: true,
                    message: '番茄钟会话完成成功',
                    data: session
                });
            }
            catch (error) {
                logger_1.logger.error('完成番茄钟会话失败', { userId, sessionId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.endPomodoroSession = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const sessionId = parseInt(req.params.sessionId);
            const { completed, completedAt, updateDuration } = req.body;
            logger_1.logger.info('收到结束番茄钟会话请求', {
                userId,
                sessionId,
                completed,
                updateDuration,
                ip: req.ip
            });
            try {
                const session = yield this.taskService.endPomodoroSession(userId, sessionId, {
                    completed,
                    completedAt,
                    updateDuration
                });
                logger_1.logger.info('番茄钟会话结束成功', {
                    sessionId,
                    userId,
                    completed,
                    completedAt: session.completedAt
                });
                res.json({
                    success: true,
                    message: '番茄钟会话已结束',
                    data: session
                });
            }
            catch (error) {
                logger_1.logger.error('结束番茄钟会话失败', {
                    userId,
                    sessionId,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getPomodoroSessions = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const options = {
                taskId: req.query.taskId ? parseInt(req.query.taskId) : undefined,
                completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };
            logger_1.logger.debug('收到获取番茄钟会话列表请求', { userId, options, ip: req.ip });
            try {
                const result = yield this.taskService.getPomodoroSessions(userId, options);
                logger_1.logger.debug('番茄钟会话列表获取成功', {
                    userId,
                    total: result.total,
                    count: result.sessions.length
                });
                res.json({
                    success: true,
                    data: {
                        sessions: result.sessions,
                        pagination: {
                            page: options.page,
                            limit: options.limit,
                            total: result.total,
                            totalPages: Math.ceil(result.total / options.limit),
                            hasNext: options.page < Math.ceil(result.total / options.limit),
                            hasPrev: options.page > 1
                        }
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('获取番茄钟会话列表失败', { userId, options, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getPomodoroStats = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const days = parseInt(req.query.days) || 30;
            logger_1.logger.debug('收到获取番茄钟统计请求', { userId, days, ip: req.ip });
            try {
                if (days < 1 || days > 365) {
                    throw new error_utils_1.ValidationError('天数必须在1-365之间');
                }
                const stats = yield this.taskService.getPomodoroStats(userId, days);
                logger_1.logger.debug('番茄钟统计获取成功', { userId, days, stats });
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取番茄钟统计失败', { userId, days, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getActivePomodoroSession = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.debug('收到获取活跃番茄钟会话请求', { userId, ip: req.ip });
            try {
                const session = yield this.taskService.getActivePomodoroSession(userId);
                logger_1.logger.debug('活跃番茄钟会话获取成功', { userId, hasActiveSession: !!session });
                res.json({
                    success: true,
                    data: {
                        session,
                        hasActiveSession: !!session
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('获取活跃番茄钟会话失败', { userId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.updateTaskCompletionFromPomodoro = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const taskId = parseInt(req.params.taskId);
            const sessionId = parseInt(req.params.sessionId);
            const { markAsCompleted, completedAt } = req.body;
            logger_1.logger.info('收到更新任务完成状态请求（番茄钟）', {
                userId,
                taskId,
                sessionId,
                markAsCompleted,
                ip: req.ip
            });
            try {
                if (typeof markAsCompleted !== 'boolean') {
                    throw new error_utils_1.ValidationError('markAsCompleted 必须为布尔值');
                }
                const updatedTask = yield this.taskService.updateTaskCompletionFromPomodoro(userId, taskId, sessionId, markAsCompleted, completedAt);
                logger_1.logger.info('任务完成状态更新成功（番茄钟）', {
                    taskId,
                    sessionId,
                    userId,
                    markAsCompleted,
                    focusTime: updatedTask.focusTime,
                    pomodoroCount: updatedTask.pomodoroCount
                });
                res.json({
                    success: true,
                    message: '任务完成状态更新成功',
                    data: updatedTask
                });
            }
            catch (error) {
                logger_1.logger.error('更新任务完成状态失败（番茄钟）', {
                    userId,
                    taskId,
                    sessionId,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getCalendarCheckIns = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;
            logger_1.logger.info('获取打卡日历数据', { userId, year, month, ip: req.ip });
            try {
                if (month < 1 || month > 12) {
                    throw new error_utils_1.ValidationError('月份必须在1-12之间');
                }
                const checkIns = yield this.taskService.getCalendarCheckIns(userId, year, month);
                const user = yield this.taskService.taskRepository.getUserRewardCount(userId);
                res.json({
                    success: true,
                    message: '获取打卡日历数据成功',
                    data: {
                        checkIns,
                        remainingMakeUps: 2 - user.reward_count
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('获取打卡日历数据失败', { userId, year, month, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.createMakeUpCheckIn = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const { checkInDate } = req.body;
            logger_1.logger.info('收到补打卡请求', { userId, checkInDate, ip: req.ip });
            try {
                if (!checkInDate) {
                    throw new error_utils_1.ValidationError('补打卡日期不能为空');
                }
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(checkInDate)) {
                    throw new error_utils_1.ValidationError('日期格式错误，应为YYYY-MM-DD');
                }
                const task = yield this.taskService.createMakeUpCheckIn(userId, checkInDate);
                logger_1.logger.info('补打卡成功', { userId, checkInDate, taskId: task.id });
                res.status(201).json({
                    success: true,
                    message: '补打卡成功',
                    data: task
                });
            }
            catch (error) {
                logger_1.logger.error('补打卡失败', { userId, checkInDate, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getRecentTaskStats = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const days = parseInt(req.query.days) || 7;
            logger_1.logger.info('获取近期任务统计', { userId, days, ip: req.ip });
            try {
                if (days < 1 || days > 30) {
                    throw new error_utils_1.ValidationError('天数必须在1-30之间');
                }
                const stats = yield this.taskService.getRecentTaskStats(userId, days);
                res.json({
                    success: true,
                    message: '获取近期任务统计成功',
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取近期任务统计失败', { userId, days, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.getCompletionStats = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('获取完成度统计数据', { userId, ip: req.ip });
            try {
                const stats = yield this.taskService.getCompletionStats(userId);
                res.json({
                    success: true,
                    message: '获取完成度统计数据成功',
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取完成度统计数据失败', { userId, ip: req.ip, error: error.message });
                throw error;
            }
        }));
        this.taskService = new task_service_1.TaskService();
    }
}
exports.TaskController = TaskController;
exports.default = TaskController;
//# sourceMappingURL=task.controller.js.map