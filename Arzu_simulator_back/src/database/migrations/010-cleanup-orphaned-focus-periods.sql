-- 清理孤立的活跃 focus periods（没有 end_time 的记录）

DO $$ 
DECLARE
  updated_count INTEGER;
BEGIN
  -- 结束所有未完成的 focus periods
  UPDATE focus_periods 
  SET 
    end_time = CURRENT_TIMESTAMP,
    duration_min = ROUND(CAST(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 60.0 AS NUMERIC), 1),
    is_interrupted = true
  WHERE end_time IS NULL 
    AND duration_min IS NULL;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '已清理 % 个未结束的 focus periods', updated_count;
END $$;

