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
exports.HabitAnalysisController = void 0;
const habit_analysis_service_1 = require("../services/habit-analysis.service");
const error_utils_1 = require("../utils/error.utils");
const logger_1 = require("../config/logger");
const error_utils_2 = require("../utils/error.utils");
class HabitAnalysisController {
    constructor() {
        this.getHabitStats = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const timeframe = req.query.timeframe;
            if (!timeframe || !['week', 'month'].includes(timeframe)) {
                throw new error_utils_1.ValidationError('timeframe 必须是 week 或 month');
            }
            logger_1.logger.info('收到获取习惯分析统计请求', { userId, timeframe });
            try {
                const stats = yield this.habitAnalysisService.getHabitStats(userId, timeframe);
                logger_1.logger.info('习惯分析统计数据获取成功', { userId, timeframe });
                res.status(200).json({
                    success: true,
                    message: '获取习惯分析统计数据成功',
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取习惯分析统计数据失败', {
                    userId,
                    timeframe,
                    error: error.message
                });
                throw error;
            }
        }));
        this.habitAnalysisService = new habit_analysis_service_1.HabitAnalysisService();
    }
}
exports.HabitAnalysisController = HabitAnalysisController;
//# sourceMappingURL=habit-analysis.controller.js.map