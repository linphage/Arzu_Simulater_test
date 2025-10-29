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
exports.FocusPeriodController = void 0;
const focus_period_repository_1 = require("../repositories/focus-period.repository");
const focus_analysis_service_1 = require("../services/focus-analysis.service");
const logger_1 = require("../config/logger");
class FocusPeriodController {
    constructor() {
        this.startPeriod = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sessionId } = req.params;
                const { start_time } = req.body;
                const activePeriod = yield this.focusPeriodRepository.getActivePeriod(Number(sessionId));
                if (activePeriod) {
                    res.status(400).json({
                        message: '当前会话已有活跃的细分时间段，请先结束当前时间段'
                    });
                    return;
                }
                const periodId = yield this.focusPeriodRepository.create({
                    session_id: Number(sessionId),
                    start_time
                });
                logger_1.logger.info('细分时间段开始', {
                    sessionId,
                    periodId,
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                });
                res.status(201).json({
                    message: '细分时间段已开始',
                    data: {
                        period_id: periodId,
                        session_id: Number(sessionId),
                        start_time: start_time || new Date().toISOString()
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('开始细分时间段失败', {
                    sessionId: req.params.sessionId,
                    error: error.message,
                    stack: error.stack
                });
                res.status(500).json({ message: '开始细分时间段失败', error: error.message });
            }
        });
        this.endPeriod = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { periodId } = req.params;
                const { end_time, is_interrupted } = req.body;
                if (typeof is_interrupted !== 'boolean') {
                    res.status(400).json({ message: 'is_interrupted 字段必须是布尔值' });
                    return;
                }
                yield this.focusPeriodRepository.endPeriod(Number(periodId), {
                    end_time,
                    is_interrupted
                });
                logger_1.logger.info('细分时间段结束', {
                    periodId,
                    isInterrupted: is_interrupted,
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                });
                res.json({
                    message: '细分时间段已结束',
                    data: {
                        period_id: Number(periodId),
                        end_time: end_time || new Date().toISOString(),
                        is_interrupted
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('结束细分时间段失败', {
                    periodId: req.params.periodId,
                    error: error.message
                });
                res.status(500).json({ message: '结束细分时间段失败' });
            }
        });
        this.getSessionPeriods = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sessionId } = req.params;
                const periods = yield this.focusPeriodRepository.findBySessionId(Number(sessionId));
                logger_1.logger.info('查询会话细分时间段', {
                    sessionId,
                    periodCount: periods.length,
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                });
                res.json({
                    message: '查询成功',
                    data: {
                        session_id: Number(sessionId),
                        periods,
                        total: periods.length
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('查询会话细分时间段失败', {
                    sessionId: req.params.sessionId,
                    error: error.message
                });
                res.status(500).json({ message: '查询细分时间段失败' });
            }
        });
        this.getActivePeriod = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sessionId } = req.params;
                const period = yield this.focusPeriodRepository.getActivePeriod(Number(sessionId));
                logger_1.logger.info('查询活跃细分时间段', {
                    sessionId,
                    hasActivePeriod: !!period,
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                });
                res.json({
                    message: '查询成功',
                    data: {
                        session_id: Number(sessionId),
                        active_period: period || null
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('查询活跃细分时间段失败', {
                    sessionId: req.params.sessionId,
                    error: error.message
                });
                res.status(500).json({ message: '查询活跃细分时间段失败' });
            }
        });
        this.getSessionPeriodStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sessionId } = req.params;
                const stats = yield this.focusPeriodRepository.getSessionPeriodStats(Number(sessionId));
                logger_1.logger.info('查询会话细分时间段统计', {
                    sessionId,
                    stats,
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                });
                res.json({
                    message: '查询成功',
                    data: Object.assign({ session_id: Number(sessionId) }, stats)
                });
            }
            catch (error) {
                logger_1.logger.error('查询会话细分时间段统计失败', {
                    sessionId: req.params.sessionId,
                    error: error.message
                });
                res.status(500).json({ message: '查询细分时间段统计失败' });
            }
        });
        this.getFocusStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.user.id;
                const { timeframe = 'week' } = req.query;
                if (timeframe !== 'week' && timeframe !== 'month') {
                    res.status(400).json({
                        success: false,
                        message: 'timeframe 参数必须是 week 或 month'
                    });
                    return;
                }
                logger_1.logger.info('获取专注度统计数据', { userId, timeframe });
                const stats = yield this.focusAnalysisService.getFocusStats(userId, timeframe);
                res.json({
                    success: true,
                    message: '获取专注度统计数据成功',
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取专注度统计数据失败', {
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    error: error.message
                });
                res.status(500).json({
                    success: false,
                    message: '获取专注度统计数据失败',
                    error: error.message
                });
            }
        });
        this.focusPeriodRepository = new focus_period_repository_1.FocusPeriodRepository();
        this.focusAnalysisService = new focus_analysis_service_1.FocusAnalysisService();
    }
}
exports.FocusPeriodController = FocusPeriodController;
exports.default = FocusPeriodController;
//# sourceMappingURL=focus-period.controller.js.map