-- PostgreSQL数据库初始化脚本

-- 创建users表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建tasks表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('勤政', '书杰', '爱人')),
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('金', '木', '水', '火', '土')),
  completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
  pomodoro_count INTEGER DEFAULT 0,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建brieflogs表
CREATE TABLE IF NOT EXISTS brieflogs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brief_type VARCHAR(50) NOT NULL CHECK (brief_type IN ('周简报', '日简报', '月简报')),
  date VARCHAR(50) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建focus_periods表
CREATE TABLE IF NOT EXISTS focus_periods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建pomodoro_sessions表
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER DEFAULT 25,
  completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
  interrupted INTEGER DEFAULT 0 CHECK (interrupted IN (0, 1)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建rewards表
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_value INTEGER NOT NULL,
  earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_brieflogs_user_id ON brieflogs(user_id);
CREATE INDEX IF NOT EXISTS idx_brieflogs_date ON brieflogs(date);
CREATE INDEX IF NOT EXISTS idx_focus_periods_user_id ON focus_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_periods_task_id ON focus_periods(task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);

-- 创建更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brieflogs_updated_at ON brieflogs;
CREATE TRIGGER update_brieflogs_updated_at
  BEFORE UPDATE ON brieflogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pomodoro_sessions_updated_at ON pomodoro_sessions;
CREATE TRIGGER update_pomodoro_sessions_updated_at
  BEFORE UPDATE ON pomodoro_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
