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
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_repository_1 = require("../repositories/user.repository");
const config_1 = require("../config");
const logger_1 = require("../config/logger");
const error_utils_1 = require("../utils/error.utils");
const connection_1 = require("../database/connection");
class AuthService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.saltRounds = config_1.authConfig.bcryptRounds;
    }
    register(username, mail, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始用户注册', { username, mail });
                this.validateRegistrationInput(username, mail, password);
                const existingUser = yield this.userRepository.findByUsernameOrEmail(username, mail);
                if (existingUser) {
                    if (existingUser.username === username) {
                        throw new error_utils_1.ConflictError('用户名已存在');
                    }
                    if (existingUser.mail === mail) {
                        throw new error_utils_1.ConflictError('邮箱已存在');
                    }
                }
                const passwordHash = yield bcryptjs_1.default.hash(password, this.saltRounds);
                const userId = yield this.userRepository.create({
                    username,
                    mail: mail.toLowerCase(),
                    passwordHash
                });
                logger_1.logger.info('用户注册成功', { userId, username, mail });
                return { userId, username, mail };
            }
            catch (error) {
                logger_1.logger.error('用户注册失败', { username, mail, error: error.message });
                throw error;
            }
        });
    }
    login(username, password, clientIp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始用户登录', { username, clientIp });
                const user = yield this.userRepository.findByUsername(username);
                if (!user) {
                    logger_1.logger.warn('用户登录失败 - 用户不存在', { username });
                    throw new error_utils_1.AuthenticationError('用户名或密码错误');
                }
                yield this.checkAccountStatus(user);
                const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password_hash);
                if (!isPasswordValid) {
                    yield this.handleFailedLogin(user.id);
                    logger_1.logger.warn('用户登录失败 - 密码错误', { userId: user.id, username });
                    throw new error_utils_1.AuthenticationError('用户名或密码错误');
                }
                yield this.handleSuccessfulLogin(user.id);
                const tokens = yield this.generateTokens(user);
                yield this.storeRefreshToken(user.id, tokens.refreshToken);
                logger_1.logger.info('用户登录成功', { userId: user.id, username, clientIp });
                return {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    },
                    tokens
                };
            }
            catch (error) {
                logger_1.logger.error('用户登录失败', { username, clientIp, error: error.message });
                throw error;
            }
        });
    }
    loginByEmail(mail, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始邮箱登录', { mail });
                const user = yield this.userRepository.findByEmail(mail);
                if (!user) {
                    logger_1.logger.warn('邮箱登录失败 - 用户不存在', { mail });
                    throw new error_utils_1.AuthenticationError('邮箱或密码无效');
                }
                const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password_hash);
                if (!isPasswordValid) {
                    logger_1.logger.warn('邮箱登录失败 - 密码错误', { userId: user.user_id, mail });
                    throw new error_utils_1.AuthenticationError('邮箱或密码无效');
                }
                const payload = {
                    userId: user.user_id,
                    mail: user.mail,
                    username: user.username
                };
                const token = jsonwebtoken_1.default.sign(payload, config_1.authConfig.jwtSecret, {
                    expiresIn: config_1.authConfig.jwtExpiresIn
                });
                logger_1.logger.info('邮箱登录成功', { userId: user.user_id, mail });
                return { token };
            }
            catch (error) {
                logger_1.logger.error('邮箱登录失败', { mail, error: error.message });
                throw error;
            }
        });
    }
    refreshAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('开始刷新访问令牌');
                const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.authConfig.jwtRefreshSecret);
                const tokenHash = this.hashToken(refreshToken);
                const tokenExists = yield this.checkRefreshTokenExists(decoded.userId, tokenHash);
                if (!tokenExists) {
                    throw new error_utils_1.AuthenticationError('无效的刷新令牌');
                }
                const user = yield this.userRepository.findById(decoded.userId);
                if (!user || !user.is_active) {
                    throw new error_utils_1.AuthenticationError('用户账户无效');
                }
                const tokens = yield this.generateTokens(user);
                yield this.removeRefreshToken(decoded.userId, tokenHash);
                yield this.storeRefreshToken(user.id, tokens.refreshToken);
                logger_1.logger.info('访问令牌刷新成功', { userId: user.id, username: user.username });
                return tokens;
            }
            catch (error) {
                logger_1.logger.error('刷新访问令牌失败', { error: error.message });
                if (error.name === 'TokenExpiredError') {
                    throw new error_utils_1.AuthenticationError('刷新令牌已过期');
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new error_utils_1.AuthenticationError('无效的刷新令牌');
                }
                throw error;
            }
        });
    }
    logout(userId, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('用户登出', { userId });
                if (refreshToken) {
                    const tokenHash = this.hashToken(refreshToken);
                    yield this.removeRefreshToken(userId, tokenHash);
                }
                else {
                    yield this.removeAllRefreshTokens(userId);
                }
                logger_1.logger.info('用户登出成功', { userId });
            }
            catch (error) {
                logger_1.logger.error('用户登出失败', { userId, error: error.message });
                throw error;
            }
        });
    }
    validateAccessToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.authConfig.jwtSecret);
                const user = yield this.userRepository.findById(decoded.userId);
                if (!user || !user.is_active) {
                    throw new error_utils_1.AuthenticationError('用户账户无效');
                }
                return {
                    userId: user.id,
                    username: user.username,
                    email: user.email
                };
            }
            catch (error) {
                if (error.name === 'TokenExpiredError') {
                    throw new error_utils_1.AuthenticationError('访问令牌已过期');
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new error_utils_1.AuthenticationError('无效的访问令牌');
                }
                throw error;
            }
        });
    }
    validateRegistrationInput(username, mail, password) {
        if (!username || username.length < 3 || username.length > 50) {
            throw new error_utils_1.ValidationError('用户名长度必须在3-50个字符之间');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new error_utils_1.ValidationError('用户名只能包含字母、数字和下划线');
        }
        if (!mail || mail.length > 255) {
            throw new error_utils_1.ValidationError('邮箱长度不能超过255个字符');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mail)) {
            throw new error_utils_1.ValidationError('请输入有效的邮箱地址');
        }
        if (!password || password.length < 8 || password.length > 128) {
            throw new error_utils_1.ValidationError('密码长度必须在8-128个字符之间');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new error_utils_1.ValidationError('密码必须包含大小写字母、数字和特殊字符');
        }
    }
    checkAccountStatus(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!user.is_active) {
                throw new error_utils_1.AuthenticationError('账户已被禁用');
            }
            if (user.locked_until) {
                const lockedUntil = new Date(user.locked_until);
                const now = new Date();
                if (lockedUntil > now) {
                    throw new error_utils_1.AuthenticationError(`账户已被锁定，解锁时间：${lockedUntil.toLocaleString()}`);
                }
                else {
                    yield this.userRepository.unlockAccount(user.id);
                    yield this.userRepository.resetFailedLoginAttempts(user.id);
                }
            }
        });
    }
    handleFailedLogin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.userRepository.incrementFailedLoginAttempts(userId);
            const user = yield this.userRepository.findById(userId);
            if (!user)
                return;
            if (user.failed_login_attempts >= 5) {
                const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                yield this.userRepository.lockAccount(userId, lockedUntil);
                logger_1.logger.warn('账户因多次失败登录被锁定', { userId, lockedUntil });
            }
        });
    }
    handleSuccessfulLogin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                this.userRepository.resetFailedLoginAttempts(userId),
                this.userRepository.updateLastLogin(userId),
                this.userRepository.unlockAccount(userId)
            ]);
        });
    }
    generateTokens(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                userId: user.id,
                username: user.username,
                email: user.email
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, config_1.authConfig.jwtSecret, {
                expiresIn: config_1.authConfig.jwtExpiresIn
            });
            const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.authConfig.jwtRefreshSecret, {
                expiresIn: config_1.authConfig.jwtRefreshExpiresIn
            });
            return { accessToken, refreshToken };
        });
    }
    storeRefreshToken(userId, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenHash = this.hashToken(refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            yield (0, connection_1.runQuery)('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [userId, tokenHash, expiresAt.toISOString()]);
            logger_1.logger.debug('刷新令牌已存储', { userId });
        });
    }
    checkRefreshTokenExists(userId, tokenHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, connection_1.runQuery)('SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND expires_at > datetime("now")', [userId, tokenHash]);
            return result.changes > 0;
        });
    }
    removeRefreshToken(userId, tokenHash) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, connection_1.runQuery)('DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?', [userId, tokenHash]);
            logger_1.logger.debug('刷新令牌已删除', { userId });
        });
    }
    removeAllRefreshTokens(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, connection_1.runQuery)('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
            logger_1.logger.debug('用户的所有刷新令牌已删除', { userId });
        });
    }
    hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    cleanupExpiredRefreshTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, connection_1.runQuery)('DELETE FROM refresh_tokens WHERE expires_at < datetime("now")');
                if (result.changes > 0) {
                    logger_1.logger.info('清理过期刷新令牌', { deletedCount: result.changes });
                }
                return result.changes;
            }
            catch (error) {
                logger_1.logger.error('清理过期刷新令牌失败', { error: error.message });
                return 0;
            }
        });
    }
    getAuthStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [userStats, tokenCount] = yield Promise.all([
                this.userRepository.getUserStats(),
                (0, connection_1.runQuery)('SELECT COUNT(*) as count FROM refresh_tokens WHERE expires_at > datetime("now")')
            ]);
            return {
                totalUsers: userStats.totalUsers,
                activeUsers: userStats.activeUsers,
                lockedUsers: userStats.lockedUsers,
                refreshTokens: tokenCount.count || 0
            };
        });
    }
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userRepository.findById(userId);
                if (!user) {
                    throw new error_utils_1.ApiError('用户不存在', 404);
                }
                const createdDate = new Date(user.created_at);
                const now = new Date();
                const timeDiff = now.getTime() - createdDate.getTime();
                const daysSinceRegistration = Math.floor(timeDiff / (1000 * 3600 * 24));
                return {
                    id: user.user_id,
                    username: user.username,
                    email: user.mail,
                    createdAt: user.created_at,
                    daysSinceRegistration
                };
            }
            catch (error) {
                logger_1.logger.error('获取用户资料失败', { userId, error: error.message });
                throw error instanceof error_utils_1.ApiError ? error : new error_utils_1.ApiError('获取用户资料失败', 500);
            }
        });
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
//# sourceMappingURL=auth.service.js.map