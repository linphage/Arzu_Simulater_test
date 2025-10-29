-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME
);

-- 任务表（支持三维分类和四级优先级）
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(20) CHECK(category IN ('勤政', '恕己', '爱人')) DEFAULT '勤政',
  priority VARCHAR(10) CHECK(priority IN ('金', '银', '铜', '石')) DEFAULT '铜',
  completed BOOLEAN DEFAULT FALSE,
  pomodoro_count INTEGER DEFAULT 0,
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 番茄钟记录表
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  duration_minutes INTEGER DEFAULT 25,
  completed BOOLEAN DEFAULT FALSE,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
);

-- 刷新令牌表（安全存储）
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_pomodoro_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_task_id ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_started_at ON pomodoro_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 创建触发器用于自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;