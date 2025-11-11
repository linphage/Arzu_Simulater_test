-- PostgreSQL Migration: Add repeat task support
-- Date: 2025-01-10
-- Description: Add parent_task_id field and modify repeat_days type for weekly task generation

-- 1. Add parent_task_id field
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE;

-- 2. Modify repeat_days type (from INTEGER to TEXT)
-- PostgreSQL can directly modify column type with USING clause for data conversion
ALTER TABLE tasks ALTER COLUMN repeat_days TYPE TEXT USING 
  CASE 
    WHEN repeat_days IS NOT NULL AND repeat_days::TEXT != '0' 
    THEN '[' || repeat_days::TEXT || ']'
    ELSE NULL 
  END;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- 4. Create unique index to prevent duplicate instance tasks
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_instance_unique 
ON tasks(parent_task_id, due_date) 
WHERE parent_task_id IS NOT NULL;

-- 5. Add comments
COMMENT ON COLUMN tasks.parent_task_id IS 'Parent task ID for template-instance relationship. NULL for templates, points to template for instances';
COMMENT ON COLUMN tasks.repeat_days IS 'JSON array format for repeat days, e.g. "[0,1,3]" for Sunday, Monday, Wednesday';

-- 6. Verify migration (optional)
-- SELECT 
--   COUNT(*) as total_tasks,
--   COUNT(parent_task_id) as instance_tasks,
--   COUNT(*) - COUNT(parent_task_id) as template_tasks
-- FROM tasks;
