# Pomodoro Sessions 业务逻辑需求文档

## 一、pomodoro_sessions 表创建场景

### 场景1：点击任务卡进入番茄钟
- 触发时机：点击任务卡 → 设置计时时间 → 点击"开始"键
- 后端记录：
  - `id`: 自增
  - `user_id`: 关联users表
  - `task_id`: 关联tasks表
  - `duration_minutes`: 设定的计时时间
  - `completed`: false
  - `started_at`: 触发开始时间
  - `completed_at`: null

### 场景2：重置计时器
- 触发时机：点击"重置计时器" → 设置计时时间 → 点击"开始"键
- 后端记录：同场景1
- ⚠️ 注意：重置计时器会**先结束当前session**（见结束场景3），然后创建新session

### 场景3：休息时间结束后重新工作
- 触发时机：结束休息时间 → 重新进入工作时间 → 设置工作时间 → 点击"开始"键
- 后端记录：同场景1

---

## 二、pomodoro_sessions 表结束场景

### 场景1：点击"离开"按钮（中断）
- 触发路径：左上角返回 → ExitConfirmModal → "离开"
- 后端更新：
  - `completed`: false（保持）
  - `completed_at`: 触发Modal的时间
  - `duration_minutes`: **不变**（保持设定值）

### 场景2：点击"我做完了"按钮（完成任务）
- 触发路径：左上角返回 → ExitConfirmModal → "我做完了"
- 后端更新：
  - `completed`: **true**
  - `completed_at`: 触发Modal的时间
  - `duration_minutes`: **累加本session所有focus_periods的duration_min**

### 场景3：点击"重置计时器"（重新开始）
- 触发路径：番茄钟界面 → "重置计时器"按钮
- 后端更新：
  - `completed`: false
  - `completed_at`: 触发按钮的时间
  - `duration_minutes`: **不变**

### 场景4：突然关闭网页（意外离开）
- 触发路径：beforeunload事件
- 后端更新：
  - `completed`: false
  - `completed_at`: 关闭网页的时间
  - `duration_minutes`: **不变**

### 场景5：完成整段计时（正常完成）
- 触发路径：计时器到0 → 触发MotivationModal
- 后端更新：
  - `completed`: **true**
  - `completed_at`: 触发Modal的时间
  - `duration_minutes`: **不变**（因为是按设定时间完成）

---

## 三、focus_periods 与 session_id 关联规则

**核心规则**：任意时刻新增的 `focus_periods.session_id` 必须指向**当前用户最新一条 `completed_at` 为 null 的 `pomodoro_sessions.id`**

SQL查询示例：
```sql
SELECT id FROM pomodoro_sessions 
WHERE user_id = ? AND completed_at IS NULL 
ORDER BY started_at DESC 
LIMIT 1
```

---

## 四、当前代码问题

1. ❌ **创建session逻辑**：目前在进入番茄钟时就创建session，但应该在点击"开始"时创建
2. ❌ **结束session逻辑**：只有简单的 `completeSession`，缺少5种场景的区分
3. ❌ **重置计时器**：没有正确处理旧session的结束和新session的创建
4. ❌ **突然关闭**：`beforeunload` 只处理了 `focus_period`，没有处理 `session`
5. ❌ **duration_minutes更新**：场景2需要累加focus_periods，但当前代码没有实现

---

## 五、实现方案

### 后端修改

1. ✅ 已添加 `PomodoroRepository.endSession()` 方法
2. ✅ 已添加 `PomodoroRepository.calculateSessionActualDuration()` 方法
3. ⏳ 需要添加新的API端点 `PATCH /api/v1/tasks/pomodoro/:sessionId/end`
4. ⏳ 需要修改 `PomodoroController` 添加 `endSession` 方法

### 前端修改

1. ⏳ 修改 `pomodoroService.ts` 添加 `endSession()` 方法
2. ⏳ 修改 `PomodoroView.tsx` 的5个结束场景调用逻辑：
   - `handleLeavePomodoro()` → 场景1
   - `handleCompleteFromExit()` → 场景2  
   - `resetTimer()` → 场景3
   - `beforeunload` → 场景4
   - `handlePhaseComplete()` → 场景5

---

## 六、下一步行动

请确认以上理解是否正确，然后我会继续实现：
1. 后端API端点
2. 前端service方法
3. 前端各场景调用逻辑
