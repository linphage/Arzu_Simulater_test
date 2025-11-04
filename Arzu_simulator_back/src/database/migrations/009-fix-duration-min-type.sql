-- 修改 focus_periods.duration_min 字段类型为 NUMERIC，支持小数

DO $$ 
BEGIN
  -- 修改 duration_min 字段类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_periods' 
      AND column_name = 'duration_min'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE focus_periods ALTER COLUMN duration_min TYPE NUMERIC(10, 1);
    RAISE NOTICE 'duration_min 类型已修改为 NUMERIC(10, 1)';
  END IF;
END $$;
