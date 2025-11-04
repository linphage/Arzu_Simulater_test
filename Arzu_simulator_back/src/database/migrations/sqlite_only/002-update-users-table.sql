-- 更新用户表结构以符合loginplan.md规范
-- 这个迁移将现有的users表更新为新的结构

-- 步骤1: 创建临时表保存现有数据
CREATE TABLE users_backup AS 
SELECT id, username as usernam, email as mail, password_hash, created_at, updated_at, last_login_at, is_active, failed_login_attempts, locked_until FROM users;

-- 步骤2: 删除现有表
DROP TABLE users;

-- 步骤3: 创建新结构的users表（符合loginplan.md规范）
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  mail VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  api_ds VARCHAR(120) NULL,
  work_count INTEGER DEFAULT 0,
  worktime_count INTEGER DEFAULT 0,
  last_reward_trigger_time INTEGER DEFAULT 0,
  reward_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  last_login_at DATETIME
);

-- 步骤4: 将备份数据迁移到新表
INSERT INTO users (username, mail, password_hash, created_at, api_ds, work_count, worktime_count, last_reward_trigger_time, reward_count, is_active, failed_login_attempts, locked_until, last_login_at)
SELECT usernam, mail, password_hash, created_at, NULL, 0, 0, 0, 0, COALESCE(is_active, 1), COALESCE(failed_login_attempts, 0), locked_until, last_login_at FROM users_backup;

-- 步骤5: 删除备份表
DROP TABLE users_backup;

-- 步骤6: 为新表创建索引
CREATE INDEX IF NOT EXISTS idx_users_mail ON users(mail);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 步骤7: 更新相关表的外键约束（需要重新创建）
-- 注意：由于表结构变化，需要更新相关外键约束

-- 添加审计日志记录
INSERT INTO audit_logs (action, resource_type, new_values, created_at) 
VALUES ('MIGRATE_USERS_TABLE', 'database', '{"description": "Updated users table structure to match loginplan.md specification"}', CURRENT_TIMESTAMP);