-- 修改 focus_periods 和 task_brieflogs 表结构

-- 1. 重命名 focus_periods 的主键列
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' AND column_name = 'period_id'
  ) THEN
    ALTER TABLE focus_periods RENAME COLUMN id TO period_id;
  END IF;
END $$;

-- 2. 修改 task_brieflogs 表结构
-- 2.1 重命名主键
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'task_brieflog_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'debrief_id'
  ) THEN
    ALTER TABLE task_brieflogs RENAME COLUMN task_brieflog_id TO debrief_id;
  END IF;
END $$;

-- 2.2 添加 session_id 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE task_brieflogs ADD COLUMN session_id INTEGER;
    
    -- 添加外键约束
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'pomodoro_sessions'
    ) THEN
      ALTER TABLE task_brieflogs 
        ADD CONSTRAINT fk_task_brieflogs_session 
        FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 2.3 添加 brief_type 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'brief_type'
  ) THEN
    ALTER TABLE task_brieflogs ADD COLUMN brief_type INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;

-- 2.4 重命名 content 为 brief_content
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'brief_content'
  ) THEN
    ALTER TABLE task_brieflogs RENAME COLUMN content TO brief_content;
  END IF;
END $$;

-- 2.5 重命名 log_date 为 created_at
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'log_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_brieflogs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE task_brieflogs RENAME COLUMN log_date TO created_at;
  END IF;
END $$;
