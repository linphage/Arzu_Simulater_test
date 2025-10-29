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
exports.validateRefreshToken = exports.requireAdmin = exports.requireRole = exports.optionalAuthenticate = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("../config/logger");
const error_utils_1 = require("../utils/error.utils");
const auth_service_1 = require("../services/auth.service");
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            logger_1.logger.warn('认证失败 - 缺少令牌', {
                ip: req.ip,
                path: req.path,
                method: req.method
            });
            throw new error_utils_1.AuthenticationError('访问令牌缺失');
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.authConfig.jwtSecret);
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                logger_1.logger.warn('认证失败 - 令牌已过期', {
                    ip: req.ip,
                    path: req.path,
                    userId: decoded === null || decoded === void 0 ? void 0 : decoded.userId
                });
                throw new error_utils_1.AuthenticationError('访问令牌已过期');
            }
            if (error.name === 'JsonWebTokenError') {
                logger_1.logger.warn('认证失败 - 无效的令牌', {
                    ip: req.ip,
                    path: req.path
                });
                throw new error_utils_1.AuthenticationError('访问令牌无效');
            }
            throw new error_utils_1.AuthenticationError('访问令牌验证失败');
        }
        const authService = new auth_service_1.AuthService();
        const user = yield authService.validateAccessToken(token);
        req.user = {
            id: user.userId,
            username: user.username,
            email: user.email
        };
        logger_1.logger.debug('认证成功', {
            userId: user.userId,
            username: user.username,
            path: req.path
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('认证中间件错误', {
            ip: req.ip,
            path: req.path,
            error: error.message
        });
        if (error instanceof error_utils_1.AuthenticationError) {
            res.status(401).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(401).json({
                success: false,
                message: '认证失败',
                timestamp: new Date().toISOString()
            });
        }
    }
});
exports.authenticateToken = authenticateToken;
const optionalAuthenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        next();
        return;
    }
    try {
        const authService = new auth_service_1.AuthService();
        const user = yield authService.validateAccessToken(token);
        req.user = {
            id: user.userId,
            username: user.username,
            email: user.email
        };
    }
    catch (error) {
        logger_1.logger.debug('可选认证失败', {
            ip: req.ip,
            path: req.path,
            error: error.message
        });
    }
    next();
});
exports.optionalAuthenticate = optionalAuthenticate;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '需要认证',
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: '需要认证',
            timestamp: new Date().toISOString()
        });
        return;
    }
    logger_1.logger.debug('管理员权限检查', {
        userId: req.user.id,
        username: req.user.username
    });
    next();
};
exports.requireAdmin = requireAdmin;
const validateRefreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({
            success: false,
            message: '刷新令牌不能为空',
            timestamp: new Date().toISOString()
        });
        return;
    }
    try {
        if (typeof refreshToken !== 'string' || refreshToken.length < 10) {
            throw new Error('无效的刷新令牌格式');
        }
        next();
    }
    catch (error) {
        logger_1.logger.warn('刷新令牌验证失败', {
            ip: req.ip,
            error: error.message
        });
        res.status(400).json({
            success: false,
            message: '无效的刷新令牌',
            timestamp: new Date().toISOString()
        });
    }
});
exports.validateRefreshToken = validateRefreshToken;
//# sourceMappingURL=auth.middleware.js.map