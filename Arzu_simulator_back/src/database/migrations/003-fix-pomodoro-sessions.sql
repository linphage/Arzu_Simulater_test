-- 为 pomodoro_sessions 表添加缺失的字段

-- 添加 completed_at 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pomodoro_sessions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE pomodoro_sessions ADD COLUMN completed_at TIMESTAMP;
  END IF;
END $$;

-- 重命名 duration 为 duration_minutes（如果需要）
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pomodoro_sessions' AND column_name = 'duration'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pomodoro_sessions' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE pomodoro_sessions RENAME COLUMN duration TO duration_minutes;
  END IF;
END $$;
