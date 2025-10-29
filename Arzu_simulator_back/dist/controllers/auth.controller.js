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
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
const error_utils_1 = require("../utils/error.utils");
const logger_1 = require("../config/logger");
const error_utils_2 = require("../utils/error.utils");
class AuthController {
    constructor() {
        this.register = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('收到用户注册请求', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const { username, mail, password } = req.body;
            try {
                const result = yield this.authService.register(username, mail, password);
                logger_1.logger.info('用户注册成功', {
                    userId: result.userId,
                    username,
                    mail,
                    ip: req.ip
                });
                res.status(201).json({
                    success: true,
                    message: '用户注册成功',
                    data: result
                });
            }
            catch (error) {
                logger_1.logger.error('用户注册失败', {
                    username,
                    mail,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.login = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            logger_1.logger.info('收到用户登录请求', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const { username, password } = req.body;
            const clientIp = req.ip;
            try {
                const result = yield this.authService.login(username, password, clientIp);
                res.set({
                    'X-RateLimit-Remaining': ((_a = req.rateLimit) === null || _a === void 0 ? void 0 : _a.remaining) || 'unknown',
                    'X-RateLimit-Reset': ((_c = (_b = req.rateLimit) === null || _b === void 0 ? void 0 : _b.resetTime) === null || _c === void 0 ? void 0 : _c.toISOString()) || 'unknown'
                });
                logger_1.logger.info('用户登录成功', {
                    userId: result.user.id,
                    username: result.user.username,
                    ip: clientIp
                });
                res.json({
                    success: true,
                    message: '登录成功',
                    data: {
                        accessToken: result.tokens.accessToken,
                        refreshToken: result.tokens.refreshToken,
                        user: {
                            id: result.user.id,
                            username: result.user.username,
                            email: result.user.email
                        }
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('用户登录失败', {
                    username,
                    ip: clientIp,
                    error: error.message
                });
                throw error;
            }
        }));
        this.loginByEmail = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('收到邮箱登录请求', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new error_utils_1.ValidationError('输入验证失败', errors.array());
            }
            const { mail, password } = req.body;
            try {
                const result = yield this.authService.loginByEmail(mail, password);
                logger_1.logger.info('邮箱登录成功', {
                    mail,
                    ip: req.ip
                });
                res.json({
                    success: true,
                    message: '登录成功',
                    data: result
                });
            }
            catch (error) {
                logger_1.logger.error('邮箱登录失败', {
                    mail,
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.refreshToken = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('收到刷新令牌请求', { ip: req.ip });
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new error_utils_1.ValidationError('刷新令牌不能为空');
            }
            try {
                const tokens = yield this.authService.refreshAccessToken(refreshToken);
                logger_1.logger.info('访问令牌刷新成功', { ip: req.ip });
                res.json({
                    success: true,
                    message: '令牌刷新成功',
                    data: tokens
                });
            }
            catch (error) {
                logger_1.logger.error('刷新访问令牌失败', {
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.logout = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            const { refreshToken } = req.body;
            logger_1.logger.info('收到用户登出请求', { userId });
            try {
                yield this.authService.logout(userId, refreshToken);
                logger_1.logger.info('用户登出成功', { userId });
                res.json({
                    success: true,
                    message: '登出成功'
                });
            }
            catch (error) {
                logger_1.logger.error('用户登出失败', {
                    userId,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getProfile = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.id;
            logger_1.logger.info('收到获取用户信息请求', { userId });
            try {
                const userProfile = yield this.authService.getUserProfile(userId);
                logger_1.logger.debug('用户信息获取成功', { userId });
                res.json({
                    success: true,
                    data: userProfile
                });
            }
            catch (error) {
                logger_1.logger.error('获取用户信息失败', {
                    userId,
                    error: error.message
                });
                throw error;
            }
        }));
        this.getAuthStats = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('收到获取认证统计信息请求', { ip: req.ip });
            try {
                const stats = yield this.authService.getAuthStats();
                logger_1.logger.debug('认证统计信息获取成功');
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                logger_1.logger.error('获取认证统计信息失败', {
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.cleanupTokens = (0, error_utils_2.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('收到清理过期令牌请求', { ip: req.ip });
            try {
                const deletedCount = yield this.authService.cleanupExpiredRefreshTokens();
                logger_1.logger.info('过期令牌清理完成', { deletedCount });
                res.json({
                    success: true,
                    message: '过期令牌清理完成',
                    data: { deletedCount }
                });
            }
            catch (error) {
                logger_1.logger.error('清理过期令牌失败', {
                    ip: req.ip,
                    error: error.message
                });
                throw error;
            }
        }));
        this.authService = new auth_service_1.AuthService();
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
//# sourceMappingURL=auth.controller.js.map