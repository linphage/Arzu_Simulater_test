-- 为 focus_periods 表添加缺失的字段

-- 添加 session_id 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE focus_periods ADD COLUMN session_id INTEGER;
    
    -- 如果有外键约束，添加外键
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'pomodoro_sessions'
    ) THEN
      ALTER TABLE focus_periods 
        ADD CONSTRAINT fk_focus_periods_session 
        FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 添加 duration_min 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' AND column_name = 'duration_min'
  ) THEN
    ALTER TABLE focus_periods ADD COLUMN duration_min INTEGER;
  END IF;
END $$;

-- 添加 is_interrupted 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' AND column_name = 'is_interrupted'
  ) THEN
    ALTER TABLE focus_periods ADD COLUMN is_interrupted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 添加 created_at 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE focus_periods ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 添加索引
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'focus_periods' AND indexname = 'idx_focus_session'
  ) THEN
    CREATE INDEX idx_focus_session ON focus_periods(session_id);
  END IF;
END $$;
