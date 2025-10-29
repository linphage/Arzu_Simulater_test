-- 数据库迁移脚本
-- 根据 database_design.md 执行数据库结构更新
-- 执行时间: 2025-10-20
-- 说明: 此脚本将重建所有表结构，请确保已备份数据库

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- 删除所有表（按依赖顺序）
DROP TABLE IF EXISTS focus_periods;
DROP TABLE IF EXISTS task_brieflogs;
DROP TABLE IF EXISTS gift_card;
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS audit_logs;

-- 1. users 表
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
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

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
  duration_minutes INTEGER DEFAULT 25,
  completed BOOLEAN DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX idx_pomodoro_user ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_task ON pomodoro_sessions(task_id);
CREATE INDEX idx_pomodoro_completed ON pomodoro_sessions(completed);

-- 4. focus_periods 表
CREATE TABLE focus_periods (
  period_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration_min INTEGER,
  is_interrupted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_focus_session ON focus_periods(session_id);

-- 5. task_brieflogs 表
CREATE TABLE task_brieflogs (
  debrief_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  task_id INTEGER,
  user_id INTEGER NOT NULL,
  brief_type VARCHAR(24) NOT NULL CHECK (brief_type IN ('DELETE_REASON','INTERRUPT_REMARK','PRIORITY_CHANGE','CATEGORY_CHANGE','DUE_DATE_CHANGE','COMPLETION_REMARK')),
  brief_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_brieflogs_task ON task_brieflogs(task_id);
CREATE INDEX idx_brieflogs_user ON task_brieflogs(user_id);

-- 6. gift_card 表（公用奖励卡）
CREATE TABLE gift_card (
  gift_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(50),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. refresh_tokens 表
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
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

COMMIT;
