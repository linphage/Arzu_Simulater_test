-- 修改 focus_periods 表的 user_id 为可选

DO $$ 
BEGIN
  -- 删除 NOT NULL 约束
  ALTER TABLE focus_periods ALTER COLUMN user_id DROP NOT NULL;
END $$;
