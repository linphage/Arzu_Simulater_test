-- 迁移脚本：修改 task_brieflogs.brief_type 从字符串类型改为整数类型
-- brief_type 映射：
-- 1 = DELETE_REASON (删除原因)
-- 2 = CATEGORY_CHANGE (任务类型变更)
-- 3 = PRIORITY_CHANGE (优先级变更)
-- 4 = DUE_DATE_CHANGE (截止时间变更)
-- 5 = INTERRUPT_REMARK (中断备注)
-- 6 = COMPLETION_REMARK (完成备注)

-- 步骤1: 创建新表结构
CREATE TABLE task_brieflogs_new (
  debrief_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  task_id INTEGER,
  user_id INTEGER NOT NULL,
  brief_type INTEGER NOT NULL CHECK (brief_type IN (1, 2, 3, 4, 5, 6)),
  brief_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 步骤2: 迁移现有数据，将字符串类型转换为整数类型
INSERT INTO task_brieflogs_new (debrief_id, session_id, task_id, user_id, brief_type, brief_content, created_at)
SELECT 
  debrief_id,
  session_id,
  task_id,
  user_id,
  CASE brief_type
    WHEN 'DELETE_REASON' THEN 1
    WHEN 'CATEGORY_CHANGE' THEN 2
    WHEN 'PRIORITY_CHANGE' THEN 3
    WHEN 'DUE_DATE_CHANGE' THEN 4
    WHEN 'INTERRUPT_REMARK' THEN 5
    WHEN 'COMPLETION_REMARK' THEN 6
    ELSE 1
  END,
  brief_content,
  created_at
FROM task_brieflogs;

-- 步骤3: 删除旧表
DROP TABLE task_brieflogs;

-- 步骤4: 重命名新表
ALTER TABLE task_brieflogs_new RENAME TO task_brieflogs;

-- 步骤5: 创建索引
CREATE INDEX IF NOT EXISTS idx_task_brieflogs_task_id ON task_brieflogs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_brieflogs_user_id ON task_brieflogs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_brieflogs_session_id ON task_brieflogs(session_id);
CREATE INDEX IF NOT EXISTS idx_task_brieflogs_brief_type ON task_brieflogs(brief_type);
CREATE INDEX IF NOT EXISTS idx_task_brieflogs_created_at ON task_brieflogs(created_at);
