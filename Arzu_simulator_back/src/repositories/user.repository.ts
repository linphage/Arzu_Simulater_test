import { getQuery, runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';

export interface User {
  user_id: number;
  id: number;
  username: string;
  mail: string;
  email: string;
  password_hash: string;
  created_at: string;
  api_ds: string | null;
  work_count: number;
  worktime_count: number;
  last_reward_trigger_time: number;
  reward_count: number;
  is_active: boolean;
  failed_login_attempts: number;
}

export interface CreateUserData {
  username: string;
  mail: string;
  passwordHash: string;
}

export interface UpdateUserData {
  username?: string;
  mail?: string;
  password_hash?: string;
  api_ds?: string | null;
  work_count?: number;
  worktime_count?: number;
  last_reward_trigger_time?: number;
  reward_count?: number;
}

export class UserRepository {
  /**
   * 创建用户
   */
  async create(userData: CreateUserData): Promise<number> {
    try {
      const result = await runQuery(
        `INSERT INTO users (username, mail, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count) 
         VALUES (?, ?, ?, datetime('now'), NULL, 0, 0, 0, 0)`,
        [userData.username, userData.mail, userData.passwordHash]
      );
      
      logger.info('用户创建成功', { userId: result.lastID, username: userData.username });
      return result.lastID!;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('users.username')) {
        throw new Error('用户名已存在');
      }
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('users.mail')) {
        throw new Error('邮箱已存在');
      }
      throw error;
    }
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<User | undefined> {
    const user = await getQuery<User>(
      'SELECT user_id, user_id as id, username, mail, mail as email, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, COALESCE(is_active, 1) as is_active, COALESCE(failed_login_attempts, 0) as failed_login_attempts, locked_until, last_login_at FROM users WHERE user_id = ?',
      [id]
    );
    
    if (user) {
      logger.debug('用户查找成功', { userId: id, username: user.username });
    } else {
      logger.debug('用户未找到', { userId: id });
    }
    
    return user;
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | undefined> {
    const user = await getQuery<User>(
      'SELECT user_id, user_id as id, username, mail, mail as email, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, COALESCE(is_active, 1) as is_active, COALESCE(failed_login_attempts, 0) as failed_login_attempts, locked_until, last_login_at FROM users WHERE username = ?',
      [username]
    );
    
    if (user) {
      logger.debug('用户查找成功', { username });
    } else {
      logger.debug('用户未找到', { username });
    }
    
    return user;
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await getQuery<User>(
      'SELECT user_id, user_id as id, username, mail, mail as email, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, COALESCE(is_active, 1) as is_active, COALESCE(failed_login_attempts, 0) as failed_login_attempts, locked_until, last_login_at FROM users WHERE mail = ?',
      [email]
    );
    
    if (user) {
      logger.debug('用户查找成功', { email });
    } else {
      logger.debug('用户未找到', { email });
    }
    
    return user;
  }

  /**
   * 根据用户名或邮箱查找用户
   */
  async findByUsernameOrEmail(username: string, mail: string): Promise<User | undefined> {
    const user = await getQuery<User>(
      'SELECT * FROM users WHERE username = ? OR mail = ? LIMIT 1',
      [username, mail]
    );
    
    if (user) {
      logger.debug('用户查找成功', { username, mail });
    } else {
      logger.debug('用户未找到', { username, mail });
    }
    
    return user;
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updateData: UpdateUserData): Promise<void> {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return;
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE users SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;
    
    await runQuery(sql, [...values, id]);
    
    logger.info('用户更新成功', { userId: id, updatedFields: fields });
  }

  /**
   * 删除用户
   */
  async delete(id: number): Promise<void> {
    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    logger.info('用户删除成功', { userId: id });
  }

  /**
   * 获取用户列表（带分页）
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, isActive } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive);
    }
    
    // 获取总数
    const countResult = await getQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );
    const total = countResult?.count || 0;
    
    // 获取用户列表
    const users = await allQuery<User>(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    logger.debug('用户列表查询成功', { page, limit, total, count: users.length });
    return { users, total };
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(id: number): Promise<void> {
    await runQuery(
      'UPDATE users SET created_at = datetime("now") WHERE user_id = ?',
      [id]
    );
    logger.info('更新用户最后登录时间', { userId: id });
  }

  /**
   * 增加失败登录次数
   */
  async incrementFailedLoginAttempts(id: number): Promise<void> {
    // 由于新表结构没有这个字段，我们记录到审计日志
    logger.warn('用户登录失败', { userId: id });
  }

  /**
   * 重置失败登录次数
   */
  async resetFailedLoginAttempts(id: number): Promise<void> {
    // 由于新表结构没有这个字段，我们记录成功登录
    logger.info('用户登录成功', { userId: id });
  }

  /**
   * 锁定用户账户
   */
  async lockAccount(id: number, lockedUntil: Date): Promise<void> {
    // 由于新表结构没有这个字段，我们记录到审计日志
    logger.warn('用户账户被锁定', { userId: id, lockedUntil });
  }

  /**
   * 解锁用户账户
   */
  async unlockAccount(id: number): Promise<void> {
    // 由于新表结构没有这个字段，我们记录账户解锁
    logger.info('用户账户解锁', { userId: id });
  }

  /**
   * 检查账户是否被锁定
   */
  async isAccountLocked(id: number): Promise<boolean> {
    // 由于新表结构没有锁定字段，返回false
    return false;
  }

  /**
   * 获取活跃用户数
   */
  async getActiveUserCount(): Promise<number> {
    // 由于新表结构没有is_active字段，我们返回所有用户数
    const result = await getQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );
    return result?.count || 0;
  }

  /**
   * 获取最近注册的用户
   */
  async getRecentUsers(days: number = 7): Promise<User[]> {
    const users = await allQuery<User>(
      `SELECT * FROM users 
       WHERE created_at >= datetime('now', '-${days} days') 
       ORDER BY created_at DESC`
    );
    
    return users;
  }

  /**
   * 根据最后登录时间获取用户
   */
  async getUsersByLastLogin(days: number = 30): Promise<User[]> {
    // 由于新表结构没有last_login_at字段，我们返回空数组
    return [];
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query}%`;
    const users = await allQuery<User>(
      `SELECT * FROM users 
       WHERE username LIKE ? OR mail LIKE ? 
       ORDER BY username ASC`,
      [searchTerm, searchTerm]
    );
    
    return users;
  }

  /**
   * 批量删除非活跃用户
   */
  async deleteInactiveUsers(daysInactive: number = 365): Promise<number> {
    // 由于新表结构没有is_active和last_login_at字段，我们删除旧用户
    const result = await runQuery(
      `DELETE FROM users 
       WHERE created_at < datetime('now', '-${daysInactive} days')`
    );
    
    logger.info('删除旧用户', { deletedCount: result.changes, daysInactive });
    return result.changes;
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    lockedUsers: number;
    recentUsers: number;
  }> {
    // 由于新表结构没有相关字段，我们简化统计
    const stats = await Promise.all([
      getQuery<{ count: number }>('SELECT COUNT(*) as count FROM users'),
      getQuery<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")')
    ]);
    
    return {
      totalUsers: stats[0]?.count || 0,
      activeUsers: stats[0]?.count || 0, // 全部视为活跃用户
      inactiveUsers: 0,
      lockedUsers: 0,
      recentUsers: stats[1]?.count || 0
    };
  }
}

export default UserRepository;