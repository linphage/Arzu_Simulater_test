# 番茄钟完成流程测试指南

## 测试场景：用户完成整段计时后点击"还差一点"

### 前置条件
1. 已登录系统
2. 已创建一个任务
3. 进入番茄钟界面

### 测试步骤

#### 步骤1：开始番茄钟
1. 点击任务卡进入番茄钟界面
2. 设置专注时间（建议设置1分钟用于测试）
3. 点击"开始"按钮
4. 等待计时器完成

**预期结果：**
- 控制台输出：`✅ 番茄钟会话创建成功 { sessionId: X }`
- 控制台输出：`✅ 开始新的细分时间段 { periodId: X, sessionId: X }`

#### 步骤2：等待计时完成
1. 等待计时器倒数到0
2. 触发MotivationModal（任务完成确认弹窗）

**预期结果：**
- 控制台输出：`✅ 细分时间段正常完成 { periodId: X, sessionId: X }`
- 控制台输出：`✅ 场景5: 完成整段计时 - 会话已完成 { sessionId: X }`
- 显示"阿尔图，做的很棒。这个任务做完了吗？"弹窗

#### 步骤3：点击"还差一点"
1. 在弹窗中点击"还差一点"按钮

**预期结果：**
- 控制台输出：`✅ 用户点击"还差一点" - 任务表已更新（completed不变，focus_time累加，pomodoro_count+1）`

### 数据库验证

#### 验证 pomodoro_sessions 表
```sql
SELECT 
  id,
  user_id,
  task_id,
  duration_minutes,
  completed,
  started_at,
  completed_at
FROM pomodoro_sessions 
ORDER BY started_at DESC 
LIMIT 1;
```

**预期结果：**
- `completed` = **1** (true)
- `completed_at` = **触发MotivationModal的时间**
- `duration_minutes` = **设定的专注时长（不变）**

#### 验证 focus_periods 表
```sql
SELECT 
  period_id,
  session_id,
  start_time,
  end_time,
  duration_min,
  is_interrupted
FROM focus_periods 
WHERE session_id = <刚才的sessionId>
ORDER BY created_at;
```

**预期结果：**
- 有一条记录
- `is_interrupted` = **0** (false，正常完成)
- `duration_min` = **实际运行的分钟数**
- `end_time` 不为空

#### 验证 tasks 表
```sql
-- 先查询本次session的focus_periods总时长
SELECT 
  session_id,
  SUM(COALESCE(duration_min, 0)) as session_total_time
FROM focus_periods 
WHERE session_id = <刚才的sessionId>
GROUP BY session_id;

-- 再查询任务表
SELECT 
  id,
  title,
  completed,
  completed_at,
  focus_time,
  pomodoro_count
FROM tasks 
WHERE id = <任务ID>;
```

**预期结果：**
- `completed` = **0** (false，任务未完成)
- `completed_at` = **NULL**
- `focus_time` = **原有focus_time + 本次session的focus_periods总时长（保留一位小数）**
- `pomodoro_count` = **原有pomodoro_count + 1**

### 完整SQL验证脚本
```sql
-- 查看最新一次番茄钟会话的完整信息
SELECT 
  ps.id as session_id,
  ps.user_id,
  ps.task_id,
  ps.duration_minutes as session_duration,
  ps.completed as session_completed,
  ps.started_at,
  ps.completed_at,
  -- focus_periods统计
  COUNT(fp.period_id) as period_count,
  SUM(COALESCE(fp.duration_min, 0)) as total_focus_time,
  -- 任务信息
  t.title as task_title,
  t.completed as task_completed,
  t.completed_at as task_completed_at,
  t.focus_time as task_focus_time,
  t.pomodoro_count as task_pomodoro_count
FROM pomodoro_sessions ps
LEFT JOIN focus_periods fp ON ps.id = fp.session_id
LEFT JOIN tasks t ON ps.task_id = t.id
WHERE ps.id = (SELECT id FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 1)
GROUP BY ps.id;
```

### 成功标准
✅ `pomodoro_sessions.completed` = 1  
✅ `pomodoro_sessions.completed_at` 有值  
✅ `pomodoro_sessions.duration_minutes` = 设定值（不变）  
✅ `focus_periods.is_interrupted` = 0  
✅ `tasks.completed` = 0  
✅ `tasks.completed_at` = NULL  
✅ `tasks.focus_time` = 旧值 + focus_periods总时长（一位小数）  
✅ `tasks.pomodoro_count` = 旧值 + 1  

### 常见问题排查

#### 问题1：tasks表没有更新
**排查步骤：**
1. 检查浏览器控制台是否有报错
2. 检查后端日志：`Arzu_simulator_back/backend.log`
3. 检查API调用：`Network` 标签页 → 找到 `/api/v1/tasks/:taskId/pomodoro/:sessionId/complete`
4. 查看响应状态码和响应体

#### 问题2：focus_time计算错误
**排查步骤：**
1. 手动计算focus_periods的总时长：
   ```sql
   SELECT SUM(duration_min) FROM focus_periods WHERE session_id = X;
   ```
2. 检查后端日志中的计算结果
3. 对比任务表中的focus_time增量

#### 问题3：pomodoro_sessions表没有更新
**排查步骤：**
1. 检查`handlePhaseComplete`是否被调用
2. 检查`pomodoroService.endSession`的响应
3. 查看后端日志中的会话结束记录

---

## 测试完成后的清理

如果需要重新测试，可以使用以下SQL清理数据：

```sql
-- 注意：这会删除最新一次的测试数据
DELETE FROM focus_periods 
WHERE session_id = (SELECT id FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 1);

DELETE FROM pomodoro_sessions 
WHERE id = (SELECT id FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 1);

-- 如果需要重置任务的focus_time和pomodoro_count
UPDATE tasks 
SET focus_time = 0, 
    pomodoro_count = 0,
    completed = 0,
    completed_at = NULL
WHERE id = <测试任务ID>;
```
