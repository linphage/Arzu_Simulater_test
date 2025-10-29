# Focus Periods 功能测试指南

## 🎯 测试目标
验证番茄钟细分时间段（focus_periods）的记录功能是否正确工作。

---

## 🚀 测试环境

- **后端服务**: http://localhost:3002
- **前端服务**: http://localhost:3000
- **数据库**: SQLite (database_new_2025-09-25T08-54-04-778Z.db)

---

## 📋 测试场景

### 场景 1: 开始番茄钟并正常完成

**步骤：**
1. 登录系统
2. 点击任务卡进入番茄钟界面
3. 观察控制台输出，应该看到：
   ```
   ✅ 番茄钟会话创建成功 { sessionId: X }
   ```
4. 点击"开始"按钮
5. 观察控制台输出，应该看到：
   ```
   ✅ 开始新的细分时间段 { periodId: X, sessionId: X }
   ```
6. 等待计时器完成（或手动调整专注时长为1分钟）
7. 计时完成后，观察控制台输出，应该看到：
   ```
   ✅ 细分时间段正常完成 { periodId: X, sessionId: X }
   ```

**预期结果：**
- `focus_periods` 表中应该有一条记录
- `is_interrupted = 0` (false)
- `duration_min` 应该等于设置的专注时长

**验证 SQL:**
```sql
SELECT * FROM focus_periods ORDER BY created_at DESC LIMIT 1;
```

---

### 场景 2: 暂停番茄钟（中断）

**步骤：**
1. 点击任务卡进入番茄钟界面
2. 点击"开始"按钮
3. 等待几秒后点击"暂停"按钮
4. 观察控制台输出，应该看到：
   ```
   ✅ 暂停 - 细分时间段中断 { periodId: X, sessionId: X }
   ```

**预期结果：**
- `focus_periods` 表中应该有一条记录
- `is_interrupted = 1` (true)
- `duration_min` 应该是实际运行的分钟数

**验证 SQL:**
```sql
SELECT * FROM focus_periods 
WHERE is_interrupted = 1 
ORDER BY created_at DESC LIMIT 1;
```

---

### 场景 3: 重置计时器（中断）

**步骤：**
1. 点击任务卡进入番茄钟界面
2. 点击"开始"按钮
3. 等待几秒后点击"重置计时器"按钮
4. 观察控制台输出，应该看到：
   ```
   ✅ 重置 - 细分时间段中断 { periodId: X, sessionId: X }
   ```

**预期结果：**
- `focus_periods` 表中应该有一条记录
- `is_interrupted = 1` (true)
- `duration_min` 应该是实际运行的分钟数

---

### 场景 4: 点击返回后选择"我搞错了"（中断后继续）

**步骤：**
1. 点击任务卡进入番茄钟界面
2. 点击"开始"按钮
3. 等待几秒后点击左上角返回按钮
4. 观察控制台输出，应该看到：
   ```
   ✅ 退出请求 - 细分时间段中断 { periodId: X, sessionId: X }
   ```
5. 在弹窗中点击"我搞错了"按钮
6. 观察控制台输出，应该看到：
   ```
   ✅ 继续工作 - 开始新的细分时间段 { periodId: Y, sessionId: X }
   ```

**预期结果：**
- `focus_periods` 表中应该有两条记录（同一个 session_id）
- 第一条：`is_interrupted = 1`
- 第二条：刚创建，`end_time = NULL`

**验证 SQL:**
```sql
SELECT * FROM focus_periods 
WHERE session_id = (
  SELECT session_id FROM focus_periods 
  ORDER BY created_at DESC LIMIT 1
)
ORDER BY created_at;
```

---

### 场景 5: 暂停后继续（创建新的细分时间段）

**步骤：**
1. 点击任务卡进入番茄钟界面
2. 点击"开始"按钮（第一次）
3. 点击"暂停"按钮
4. 观察控制台，第一个细分时间段结束
5. 点击"继续"按钮
6. 观察控制台输出，应该看到：
   ```
   ✅ 开始新的细分时间段 { periodId: Y, sessionId: X }
   ```

**预期结果：**
- `focus_periods` 表中应该有两条记录（同一个 session_id）
- 第一条：`is_interrupted = 1`，已结束
- 第二条：刚创建，`end_time = NULL`

---

### 场景 6: 点击返回后选择"离开"（中断并离开）

**步骤：**
1. 点击任务卡进入番茄钟界面
2. 点击"开始"按钮
3. 点击左上角返回按钮
4. 在弹窗中点击"离开"按钮

**预期结果：**
- `focus_periods` 表中应该有一条记录
- `is_interrupted = 1`
- 返回首页

---

## 🔍 数据库验证查询

### 查看所有细分时间段
```sql
SELECT 
  fp.period_id,
  fp.session_id,
  fp.start_time,
  fp.end_time,
  fp.duration_min,
  fp.is_interrupted,
  fp.created_at,
  ps.duration_minutes as session_duration
FROM focus_periods fp
LEFT JOIN pomodoro_sessions ps ON fp.session_id = ps.id
ORDER BY fp.created_at DESC;
```

### 查看某个会话的所有细分时间段
```sql
SELECT * FROM focus_periods 
WHERE session_id = <SESSION_ID>
ORDER BY created_at;
```

### 查看中断的细分时间段
```sql
SELECT * FROM focus_periods 
WHERE is_interrupted = 1
ORDER BY created_at DESC;
```

### 查看正常完成的细分时间段
```sql
SELECT * FROM focus_periods 
WHERE is_interrupted = 0
ORDER BY created_at DESC;
```

### 查看某个会话的统计
```sql
SELECT 
  session_id,
  COUNT(*) as total_periods,
  SUM(CASE WHEN is_interrupted = 1 THEN 1 ELSE 0 END) as interrupted_periods,
  SUM(COALESCE(duration_min, 0)) as total_focus_minutes,
  AVG(COALESCE(duration_min, 0)) as avg_period_minutes
FROM focus_periods
WHERE session_id = <SESSION_ID>
GROUP BY session_id;
```

---

## ✅ 成功标准

1. **数据完整性**
   - 所有细分时间段都有 `start_time` 和 `created_at`
   - 已结束的细分时间段有 `end_time`、`duration_min` 和 `is_interrupted`
   - `duration_min` 的值合理（与实际运行时间匹配）

2. **中断标记正确**
   - 暂停、重置、点击返回：`is_interrupted = 1`
   - 正常完成：`is_interrupted = 0`

3. **会话关联正确**
   - 所有细分时间段的 `session_id` 都能关联到 `pomodoro_sessions` 表
   - 同一个番茄钟会话下可以有多个细分时间段

4. **控制台日志清晰**
   - 每个操作都有对应的日志输出
   - 能够追踪细分时间段的创建和结束

---

## 🐛 常见问题

### 问题 1: 控制台没有日志输出
**解决方案**: 
- 打开浏览器开发者工具（F12）
- 切换到 Console 标签页
- 刷新页面

### 问题 2: API 调用失败
**解决方案**:
- 检查后端服务是否运行（http://localhost:3002）
- 检查 Network 标签页查看具体错误
- 检查是否已登录

### 问题 3: 数据库中没有记录
**解决方案**:
- 确认后端日志中有 "细分时间段创建成功" 的日志
- 检查数据库文件路径是否正确
- 使用 SQLite 客户端直接查询数据库

---

## 📊 测试报告模板

| 场景 | 测试结果 | 备注 |
|------|---------|------|
| 场景1: 正常完成 | ☐ 通过 ☐ 失败 | |
| 场景2: 暂停中断 | ☐ 通过 ☐ 失败 | |
| 场景3: 重置中断 | ☐ 通过 ☐ 失败 | |
| 场景4: 返回后继续 | ☐ 通过 ☐ 失败 | |
| 场景5: 暂停后继续 | ☐ 通过 ☐ 失败 | |
| 场景6: 返回后离开 | ☐ 通过 ☐ 失败 | |

---

## 🎉 测试完成

完成所有测试场景后，可以使用以下 SQL 查看整体数据：

```sql
-- 查看测试期间创建的所有会话和细分时间段
SELECT 
  ps.id as session_id,
  ps.user_id,
  ps.duration_minutes as session_duration,
  ps.started_at as session_start,
  COUNT(fp.period_id) as total_periods,
  SUM(CASE WHEN fp.is_interrupted = 1 THEN 1 ELSE 0 END) as interrupted_count,
  SUM(CASE WHEN fp.is_interrupted = 0 THEN 1 ELSE 0 END) as completed_count,
  SUM(COALESCE(fp.duration_min, 0)) as total_minutes
FROM pomodoro_sessions ps
LEFT JOIN focus_periods fp ON ps.id = fp.session_id
WHERE ps.started_at >= datetime('now', '-1 hour')
GROUP BY ps.id
ORDER BY ps.started_at DESC;
```

祝测试顺利！🚀
