-- 更新 focus_periods 表中缺失的 user_id 和 task_id

DO $$ 
BEGIN
  -- 从 pomodoro_sessions 更新 focus_periods 的 user_id 和 task_id
  UPDATE focus_periods fp
  SET 
    user_id = ps.user_id,
    task_id = ps.task_id
  FROM pomodoro_sessions ps
  WHERE fp.session_id = ps.id
    AND fp.user_id IS NULL;
    
  RAISE NOTICE '已更新 focus_periods 的 user_id 和 task_id';
END $$;
