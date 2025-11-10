import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository, CreateUserData } from '../repositories/user.repository';
import { authConfig } from '../config';
import { logger } from '../config/logger';
import { ApiError, AuthenticationError, ConflictError, ValidationError, isErrorWithName } from '../utils/error.utils';
import { runQuery } from '../database/connection';
import { getErrorMessage } from '../utils/error-handler';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: {
    id: number;
    username: string;
    email: string;
  };
  tokens: AuthTokens;
}

export class AuthService {
  private userRepository: UserRepository;
  private readonly saltRounds: number;

  constructor() {
    this.userRepository = new UserRepository();
    this.saltRounds = authConfig.bcryptRounds;
  }

  /**
   * 用户注册 - 适配loginplan.md规范
   */
  async register(username: string, mail: string, password: string): Promise<{ userId: number; username: string; mail: string }> {
    try {
      logger.info('开始用户注册', { username, mail });

      // 验证输入
      this.validateRegistrationInput(username, mail, password);

      // 检查用户名和邮箱唯一性
      const existingUser = await this.userRepository.findByUsernameOrEmail(username, mail);
      if (existingUser) {
        if (existingUser.username === username) {
          throw new ConflictError('用户名已存在');
        }
        if (existingUser.mail === mail) {
          throw new ConflictError('邮箱已存在');
        }
      }

      // 生成密码哈希
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // 创建用户
      const userId = await this.userRepository.create({
        username,
        mail: mail.toLowerCase(),
        passwordHash
      });

      logger.info('用户注册成功', { userId, username, mail });
      
      return { userId, username, mail };

    } catch (error) {
      logger.error('用户注册失败', { username, mail, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string, clientIp?: string): Promise<LoginResult> {
    try {
      logger.info('开始用户登录', { username, clientIp });

      // 查找用户
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        logger.warn('用户登录失败 - 用户不存在', { username });
        throw new AuthenticationError('用户名或密码错误');
      }

      // 检查账户状态
      await this.checkAccountStatus(user);

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user.id);
        logger.warn('用户登录失败 - 密码错误', { userId: user.id, username });
        throw new AuthenticationError('用户名或密码错误');
      }

      // 处理成功登录
      await this.handleSuccessfulLogin(user.id);

      // 生成令牌
      const tokens = await this.generateTokens(user);

      // 存储刷新令牌
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      logger.info('用户登录成功', { userId: user.id, username, clientIp });

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        tokens
      };

    } catch (error) {
      logger.error('用户登录失败', { username, clientIp, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * 根据邮箱登录 - 适配loginplan.md规范
   */
  async loginByEmail(mail: string, password: string): Promise<{ token: string; refreshToken?: string }> {
    try {
      logger.info('开始邮箱登录', { mail });

      // 根据邮箱查找用户
      const user = await this.userRepository.findByEmail(mail);
      if (!user) {
        logger.warn('邮箱登录失败 - 用户不存在', { mail });
        throw new AuthenticationError('邮箱或密码无效');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        logger.warn('邮箱登录失败 - 密码错误', { userId: user.user_id, mail });
        throw new AuthenticationError('邮箱或密码无效');
      }

      // 检查账户状态
      await this.checkAccountStatus(user);

      // 处理成功登录
      await this.handleSuccessfulLogin(user.user_id);

      // 生成令牌（包含accessToken和refreshToken）
      const tokens = await this.generateTokens(user);

      // 存储刷新令牌
      await this.storeRefreshToken(user.user_id, tokens.refreshToken);

      logger.info('邮箱登录成功', { userId: user.user_id, mail });

      return { 
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

    } catch (error) {
      logger.error('邮箱登录失败', { mail, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      logger.info('开始刷新访问令牌');

      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret) as any;
      
      // 检查刷新令牌是否存在于数据库
      const tokenHash = this.hashToken(refreshToken);
      const tokenExists = await this.checkRefreshTokenExists(decoded.userId, tokenHash);
      
      if (!tokenExists) {
        throw new AuthenticationError('无效的刷新令牌');
      }

      // 查找用户
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new AuthenticationError('用户账户无效');
      }

      // 生成新的令牌
      const tokens = await this.generateTokens(user);

      // 删除旧的刷新令牌，存储新的
      await this.removeRefreshToken(decoded.userId, tokenHash);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      logger.info('访问令牌刷新成功', { userId: user.id, username: user.username });

      return tokens;

    } catch (error) {
      logger.error('刷新访问令牌失败', { error: getErrorMessage(error) });
      if (isErrorWithName(error) && error.name === 'TokenExpiredError') {
        throw new AuthenticationError('刷新令牌已过期');
      }
      if (isErrorWithName(error) && error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('无效的刷新令牌');
      }
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: number, refreshToken?: string): Promise<void> {
    try {
      logger.info('用户登出', { userId });

      if (refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        await this.removeRefreshToken(userId, tokenHash);
      } else {
        // 删除该用户的所有刷新令牌
        await this.removeAllRefreshTokens(userId);
      }

      logger.info('用户登出成功', { userId });

    } catch (error) {
      logger.error('用户登出失败', { userId, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * 验证访问令牌
   */
  async validateAccessToken(token: string): Promise<{ userId: number; username: string; mail: string; email: string }> {
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret) as any;
      
      // 验证用户是否存在且活跃
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new AuthenticationError('用户账户无效');
      }

      return {
        userId: user.id,
        username: user.username,
        mail: user.mail,
        email: user.email
      };

    } catch (error) {
      if (isErrorWithName(error) && error.name === 'TokenExpiredError') {
        throw new AuthenticationError('访问令牌已过期');
      }
      if (isErrorWithName(error) && error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('无效的访问令牌');
      }
      throw error;
    }
  }

  /**
   * 私有方法：验证注册输入
   */
  private validateRegistrationInput(username: string, mail: string, password: string): void {
    // 用户名验证
    if (!username || username.length < 3 || username.length > 50) {
      throw new ValidationError('用户名长度必须在3-50个字符之间');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError('用户名只能包含字母、数字和下划线');
    }

    // 邮箱验证
    if (!mail || mail.length > 255) {
      throw new ValidationError('邮箱长度不能超过255个字符');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
      throw new ValidationError('请输入有效的邮箱地址');
    }

    // 密码验证
    if (!password || password.length < 8 || password.length > 128) {
      throw new ValidationError('密码长度必须在8-128个字符之间');
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new ValidationError('密码必须包含大小写字母、数字和特殊字符');
    }
  }

  /**
   * 私有方法：检查账户状态
   */
  private async checkAccountStatus(user: any): Promise<void> {
    // 检查账户是否激活
    if (!user.is_active) {
      throw new AuthenticationError('账户已被禁用');
    }

    // 检查账户是否被锁定
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      const now = new Date();
      if (lockedUntil > now) {
        throw new AuthenticationError(`账户已被锁定，解锁时间：${lockedUntil.toLocaleString()}`);
      } else {
        // 锁定时间已过，解锁账户
        await this.userRepository.unlockAccount(user.id);
        await this.userRepository.resetFailedLoginAttempts(user.id);
      }
    }
  }

  /**
   * 私有方法：处理失败登录
   */
  private async handleFailedLogin(userId: number): Promise<void> {
    await this.userRepository.incrementFailedLoginAttempts(userId);
    
    const user = await this.userRepository.findById(userId);
    if (!user) return;

    // 如果失败次数达到5次，锁定账户15分钟
    if (user.failed_login_attempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后
      await this.userRepository.lockAccount(userId, lockedUntil);
      logger.warn('账户因多次失败登录被锁定', { userId, lockedUntil });
    }
  }

  /**
   * 私有方法：处理成功登录
   */
  private async handleSuccessfulLogin(userId: number): Promise<void> {
    await Promise.all([
      this.userRepository.resetFailedLoginAttempts(userId),
      this.userRepository.updateLastLogin(userId),
      this.userRepository.unlockAccount(userId)
    ]);
  }

  /**
   * 私有方法：生成令牌
   */
  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    const accessToken = jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn
    } as any);

    const refreshToken = jwt.sign(payload, authConfig.jwtRefreshSecret, {
      expiresIn: authConfig.jwtRefreshExpiresIn
    } as any);

    return { accessToken, refreshToken };
  }

  /**
   * 私有方法：存储刷新令牌
   */
  private async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后

    await runQuery(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt.toISOString()]
    );

    logger.debug('刷新令牌已存储', { userId });
  }

  /**
   * 私有方法：检查刷新令牌是否存在
   */
  private async checkRefreshTokenExists(userId: number, tokenHash: string): Promise<boolean> {
    const result = await runQuery(
      'SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND expires_at > datetime("now")',
      [userId, tokenHash]
    );

    return result.changes > 0;
  }

  /**
   * 私有方法：移除刷新令牌
   */
  private async removeRefreshToken(userId: number, tokenHash: string): Promise<void> {
    await runQuery(
      'DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?',
      [userId, tokenHash]
    );

    logger.debug('刷新令牌已删除', { userId });
  }

  /**
   * 私有方法：移除用户的所有刷新令牌
   */
  private async removeAllRefreshTokens(userId: number): Promise<void> {
    await runQuery(
      'DELETE FROM refresh_tokens WHERE user_id = ?',
      [userId]
    );

    logger.debug('用户的所有刷新令牌已删除', { userId });
  }

  /**
   * 私有方法：哈希令牌
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * 定期清理过期的刷新令牌
   */
  async cleanupExpiredRefreshTokens(): Promise<number> {
    try {
      const result = await runQuery(
        'DELETE FROM refresh_tokens WHERE expires_at < datetime("now")'
      );

      if (result.changes > 0) {
        logger.info('清理过期刷新令牌', { deletedCount: result.changes });
      }

      return result.changes;
    } catch (error) {
      logger.error('清理过期刷新令牌失败', { error: getErrorMessage(error) });
      return 0;
    }
  }

  /**
   * 获取用户认证统计信息
   */
  async getAuthStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    refreshTokens: number;
  }> {
    const [userStats, tokenCount] = await Promise.all([
      this.userRepository.getUserStats(),
      runQuery('SELECT COUNT(*) as count FROM refresh_tokens WHERE expires_at > datetime("now")')
    ]);

    return {
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      lockedUsers: userStats.lockedUsers,
      refreshTokens: (tokenCount as any).count || 0
    };
  }

  async getUserProfile(userId: number): Promise<{
    id: number;
    username: string;
    email: string;
    createdAt: string;
    daysSinceRegistration: number;
  }> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new ApiError('用户不存在', 404);
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
    } catch (error) {
      logger.error('获取用户资料失败', { userId, error: getErrorMessage(error) });
      throw error instanceof ApiError ? error : new ApiError('获取用户资料失败', 500);
    }
  }
}

export default AuthService;