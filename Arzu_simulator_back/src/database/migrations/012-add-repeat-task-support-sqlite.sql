-- 迁移脚本：添加重复任务支持
-- 日期: 2025-01-10
-- 描述: 添加 parent_task_id 字段和修改 repeat_days 类型以支持周任务生成

-- 1. 备份当前 tasks 表（通过创建临时表）
CREATE TABLE IF NOT EXISTS tasks_backup_20250110 AS SELECT * FROM tasks;

-- 2. 创建新的 tasks 表结构
CREATE TABLE tasks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '勤政' CHECK (category IN ('勤政','恕己','爱人')),
  priority TEXT DEFAULT '铜' CHECK (priority IN ('金','银','铜','石')),
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  focus_time REAL DEFAULT 0,
  pomodoro_count INTEGER DEFAULT 0,
  due_date TEXT,
  alarm TEXT,
  repeat_days TEXT,  -- 改为 TEXT 类型，支持 JSON 数组
  parent_task_id INTEGER,  -- 新增字段：关联到父任务（模板）
  deleted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_task_id) REFERENCES tasks_new(id) ON DELETE CASCADE
);

-- 3. 迁移数据（转换 repeat_days 从 INTEGER 到 TEXT）
INSERT INTO tasks_new (
  id, user_id, title, description, category, priority, 
  completed, completed_at, focus_time, pomodoro_count,
  due_date, alarm, repeat_days, parent_task_id, 
  deleted_at, created_at, updated_at
)
SELECT 
  id, user_id, title, description, category, priority,
  completed, completed_at, focus_time, pomodoro_count,
  due_date, alarm,
  -- 转换 repeat_days: 如果是数字且非0，转为单元素JSON数组；否则为NULL
  CASE 
    WHEN repeat_days IS NOT NULL AND repeat_days != 0 
    THEN '[' || repeat_days || ']'
    ELSE NULL 
  END as repeat_days,
  NULL as parent_task_id,  -- 现有任务都是模板任务
  deleted_at, created_at, updated_at
FROM tasks;

-- 4. 删除旧表
DROP TABLE tasks;

-- 5. 重命名新表
ALTER TABLE tasks_new RENAME TO tasks;

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- 7. 创建唯一索引防止重复生成实例任务
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_instance_unique 
ON tasks(parent_task_id, due_date) 
WHERE parent_task_id IS NOT NULL;

-- 8. 验证迁移
-- 以下查询应返回行数与原表相同
-- SELECT COUNT(*) FROM tasks;
-- SELECT COUNT(*) FROM tasks_backup_20250110;
