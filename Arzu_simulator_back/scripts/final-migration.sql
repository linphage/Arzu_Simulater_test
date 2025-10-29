-- 完整数据库迁移脚本
-- 包含所有必需的字段和表结构

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- 删除所有表（按依赖顺序）
DROP TABLE IF EXISTS focus_periods;
DROP TABLE IF EXISTS task_brieflogs;
DROP TABLE IF EXISTS gift_card;
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS users;

-- 1. users 表（包含所有必需字段）
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  mail VARCHAR(120) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  api_ds VARCHAR(120),
  work_count INTEGER DEFAULT 0,
  worktime_count INTEGER DEFAULT 0,
  last_reward_trigger_time INTEGER DEFAULT 0,
  reward_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  last_login_at DATETIME
);
CREATE INDEX idx_users_mail ON users(mail);

-- 2. tasks 表（包含软删除支持）
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) DEFAULT '勤政' CHECK (category IN ('勤政','恕己','爱人')),
  priority VARCHAR(10) DEFAULT '铜' CHECK (priority IN ('金','银','铜','石')),
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  focus_time INTEGER DEFAULT 0,
  pomodoro_count INTEGER DEFAULT 0,
  due_date DATETIME,
  alarm DATETIME,
  repeat_days INTEGER DEFAULT 0,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at);

-- 3. pomodoro_sessions 表
CREATE TABLE pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration INTEGER DEFAULT 25,
  completed BOOLEAN DEFAULT 0,
  interrupted BOOLEAN DEFAULT 0,
  abandoned BOOLEAN DEFAULT 0,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX idx_pomodoro_user ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_task ON pomodoro_sessions(task_id);

-- 4. focus_periods 表
CREATE TABLE focus_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  duration INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX idx_focus_user ON focus_periods(user_id);

-- 5. task_brieflogs 表
CREATE TABLE task_brieflogs (
  task_brieflog_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  content TEXT,
  log_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 6. gift_card 表（公用奖励卡）
CREATE TABLE gift_card (
  gift_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(50),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. refresh_tokens 表（使用token_hash）
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token_hash);

-- 8. audit_logs 表
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

COMMIT;
