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
exports.BriefLogService = void 0;
const brieflog_repository_1 = __importDefault(require("../repositories/brieflog.repository"));
const logger_1 = require("../config/logger");
class BriefLogService {
    constructor() {
        this.briefLogRepository = new brieflog_repository_1.default();
    }
    createBriefLog(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('创建brieflog', {
                    task_id: data.task_id,
                    user_id: data.user_id,
                    brief_type: data.brief_type
                });
                const briefLog = yield this.briefLogRepository.create(data);
                logger_1.logger.info('Brieflog创建成功', {
                    debrief_id: briefLog.debrief_id,
                    task_id: data.task_id
                });
                return briefLog;
            }
            catch (error) {
                logger_1.logger.error('创建brieflog失败', { data, error: error.message });
                throw error;
            }
        });
    }
    getBriefLogsByTaskId(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('获取任务brieflog', { taskId });
                const briefLogs = yield this.briefLogRepository.findByTaskId(taskId);
                return briefLogs;
            }
            catch (error) {
                logger_1.logger.error('获取任务brieflog失败', { taskId, error: error.message });
                throw error;
            }
        });
    }
    getBriefLogsByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 50) {
            try {
                logger_1.logger.info('获取用户brieflog', { userId, limit });
                const briefLogs = yield this.briefLogRepository.findByUserId(userId, limit);
                return briefLogs;
            }
            catch (error) {
                logger_1.logger.error('获取用户brieflog失败', { userId, error: error.message });
                throw error;
            }
        });
    }
}
exports.BriefLogService = BriefLogService;
//# sourceMappingURL=brieflog.service.js.map