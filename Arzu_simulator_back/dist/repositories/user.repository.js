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
exports.UserRepository = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../config/logger");
class UserRepository {
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, connection_1.runQuery)(`INSERT INTO users (username, mail, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count) 
         VALUES (?, ?, ?, datetime('now'), NULL, 0, 0, 0, 0)`, [userData.username, userData.mail, userData.passwordHash]);
                logger_1.logger.info('用户创建成功', { userId: result.lastID, username: userData.username });
                return result.lastID;
            }
            catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('users.username')) {
                    throw new Error('用户名已存在');
                }
                if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('users.mail')) {
                    throw new Error('邮箱已存在');
                }
                throw error;
            }
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield (0, connection_1.getQuery)('SELECT user_id, user_id as id, username, mail, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, is_active, failed_login_attempts, locked_until, last_login_at FROM users WHERE user_id = ?', [id]);
            if (user) {
                logger_1.logger.debug('用户查找成功', { userId: id, username: user.username });
            }
            else {
                logger_1.logger.debug('用户未找到', { userId: id });
            }
            return user;
        });
    }
    findByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield (0, connection_1.getQuery)('SELECT user_id, user_id as id, username, mail, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, is_active, failed_login_attempts, locked_until, last_login_at FROM users WHERE username = ?', [username]);
            if (user) {
                logger_1.logger.debug('用户查找成功', { username });
            }
            else {
                logger_1.logger.debug('用户未找到', { username });
            }
            return user;
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield (0, connection_1.getQuery)('SELECT user_id, user_id as id, username, mail, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, is_active, failed_login_attempts, locked_until, last_login_at FROM users WHERE mail = ?', [email]);
            if (user) {
                logger_1.logger.debug('用户查找成功', { email });
            }
            else {
                logger_1.logger.debug('用户未找到', { email });
            }
            return user;
        });
    }
    findByUsernameOrEmail(username, mail) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield (0, connection_1.getQuery)('SELECT * FROM users WHERE username = ? OR mail = ? LIMIT 1', [username, mail]);
            if (user) {
                logger_1.logger.debug('用户查找成功', { username, mail });
            }
            else {
                logger_1.logger.debug('用户未找到', { username, mail });
            }
            return user;
        });
    }
    update(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);
            if (fields.length === 0) {
                return;
            }
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const sql = `UPDATE users SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;
            yield (0, connection_1.runQuery)(sql, [...values, id]);
            logger_1.logger.info('用户更新成功', { userId: id, updatedFields: fields });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, connection_1.runQuery)('DELETE FROM users WHERE id = ?', [id]);
            logger_1.logger.info('用户删除成功', { userId: id });
        });
    }
    findAll() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            const { page = 1, limit = 10, isActive } = options;
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE 1=1';
            const params = [];
            if (isActive !== undefined) {
                whereClause += ' AND is_active = ?';
                params.push(isActive);
            }
            const countResult = yield (0, connection_1.getQuery)(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
            const total = (countResult === null || countResult === void 0 ? void 0 : countResult.count) || 0;
            const users = yield (0, connection_1.allQuery)(`SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
            logger_1.logger.debug('用户列表查询成功', { page, limit, total, count: users.length });
            return { users, total };
        });
    }
    updateLastLogin(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, connection_1.runQuery)('UPDATE users SET created_at = datetime("now") WHERE user_id = ?', [id]);
            logger_1.logger.info('更新用户最后登录时间', { userId: id });
        });
    }
    incrementFailedLoginAttempts(id) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.warn('用户登录失败', { userId: id });
        });
    }
    resetFailedLoginAttempts(id) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('用户登录成功', { userId: id });
        });
    }
    lockAccount(id, lockedUntil) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.warn('用户账户被锁定', { userId: id, lockedUntil });
        });
    }
    unlockAccount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('用户账户解锁', { userId: id });
        });
    }
    isAccountLocked(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return false;
        });
    }
    getActiveUserCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM users');
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    getRecentUsers() {
        return __awaiter(this, arguments, void 0, function* (days = 7) {
            const users = yield (0, connection_1.allQuery)(`SELECT * FROM users 
       WHERE created_at >= datetime('now', '-${days} days') 
       ORDER BY created_at DESC`);
            return users;
        });
    }
    getUsersByLastLogin() {
        return __awaiter(this, arguments, void 0, function* (days = 30) {
            return [];
        });
    }
    searchUsers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchTerm = `%${query}%`;
            const users = yield (0, connection_1.allQuery)(`SELECT * FROM users 
       WHERE username LIKE ? OR mail LIKE ? 
       ORDER BY username ASC`, [searchTerm, searchTerm]);
            return users;
        });
    }
    deleteInactiveUsers() {
        return __awaiter(this, arguments, void 0, function* (daysInactive = 365) {
            const result = yield (0, connection_1.runQuery)(`DELETE FROM users 
       WHERE created_at < datetime('now', '-${daysInactive} days')`);
            logger_1.logger.info('删除旧用户', { deletedCount: result.changes, daysInactive });
            return result.changes;
        });
    }
    getUserStats() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const stats = yield Promise.all([
                (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM users'),
                (0, connection_1.getQuery)('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")')
            ]);
            return {
                totalUsers: ((_a = stats[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
                activeUsers: ((_b = stats[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                inactiveUsers: 0,
                lockedUsers: 0,
                recentUsers: ((_c = stats[1]) === null || _c === void 0 ? void 0 : _c.count) || 0
            };
        });
    }
}
exports.UserRepository = UserRepository;
exports.default = UserRepository;
//# sourceMappingURL=user.repository.js.map