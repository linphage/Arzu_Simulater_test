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
exports.BriefLogController = void 0;
const brieflog_service_1 = require("../services/brieflog.service");
const error_utils_1 = require("../utils/error.utils");
const logger_1 = require("../config/logger");
const error_utils_2 = require("../utils/error.utils");
class BriefLogController {
    constructor() {
        this.createBriefLog = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('收到创建brieflog请求', {
                userId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const { session_id, task_id, brief_type, brief_content } = req.body;
            if (!task_id || !brief_type || !brief_content) {
                throw new error_utils_1.ValidationError('缺少必填字段: task_id, brief_type, brief_content');
            }
            if (brief_content.trim() === '') {
                throw new error_utils_1.ValidationError('brief_content 不能为空');
            }
            if (![1, 2, 3, 4, 5, 6, 7, 8].includes(brief_type)) {
                throw new error_utils_1.ValidationError('brief_type 必须是 1-8 之间的整数');
            }
            try {
                const briefLog = yield this.briefLogService.createBriefLog({
                    session_id,
                    task_id,
                    user_id: userId,
                    brief_type,
                    brief_content: brief_content.trim()
                });
                logger_1.logger.info('Brieflog创建成功', {
                    debrief_id: briefLog.debrief_id,
                    userId,
                    task_id,
                    brief_type
                });
                res.status(201).json({
                    success: true,
                    message: 'Brieflog创建成功',
                    data: briefLog
                });
            }
            catch (error) {
                logger_1.logger.error('Brieflog创建失败', {
                    userId,
                    task_id,
                    brief_type,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getBriefLogsByTaskId = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const taskId = parseInt(req.params.taskId);
            if (isNaN(taskId)) {
                throw new error_utils_1.ValidationError('无效的 taskId');
            }
            try {
                const briefLogs = yield this.briefLogService.getBriefLogsByTaskId(taskId);
                res.status(200).json({
                    success: true,
                    message: '获取任务brieflog成功',
                    data: briefLogs
                });
            }
            catch (error) {
                logger_1.logger.error('获取任务brieflog失败', {
                    userId,
                    taskId,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getBriefLogsByUserId = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            try {
                const briefLogs = yield this.briefLogService.getBriefLogsByUserId(userId, limit);
                res.status(200).json({
                    success: true,
                    message: '获取用户brieflog成功',
                    data: briefLogs
                });
            }
            catch (error) {
                logger_1.logger.error('获取用户brieflog失败', {
                    userId,
                    error: error.message
                });
                throw error;
            }
        }));
        this.briefLogService = new brieflog_service_1.BriefLogService();
    }
}
exports.BriefLogController = BriefLogController;
//# sourceMappingURL=brieflog.controller.js.map