# 任务创建模态框 - 前后端接口联动文档

## 概述
已完成任务创建模态框(TaskCreationModal)与后端API的集成，实现前后端数据字段映射和转换。

## 前后端字段映射

### 1. 基础字段
| 前端字段 | 后端字段 | 转换逻辑 | 说明 |
|---------|---------|---------|------|
| title | title | 直接映射 | 任务标题(最多12字符) |
| content | description | 直接映射 | 任务描述(最多200字符) |
| taskType | category | 直接映射 | 任务类型:勤政/恕己/爱人 |
| priority | priority | 映射转换 | 金卡→金, 银卡→银, 铜卡→铜, 石卡→石 |

### 2. 日期时间字段
| 前端字段 | 后端字段 | 转换逻辑 | 说明 |
|---------|---------|---------|------|
| date + startTime | due_date | parseChineseDateToISO() | 中文日期+时间 → ISO 8601格式 |

**示例转换:**
```
输入: date="9月13日，周五", startTime="下午20:00"
输出: due_date="2025-09-13T20:00:00.000Z"
```

### 3. 提醒字段
| 前端字段 | 后端字段 | 转换逻辑 | 说明 |
|---------|---------|---------|------|
| reminder | alarm | calculateAlarmTime() | 根据提醒选项计算alarm时间 |

**提醒时间计算逻辑:**
- "无" → alarm = due_date
- "前5分钟" → alarm = due_date - 5分钟
- "前10分钟" → alarm = due_date - 10分钟
- "前30分钟" → alarm = due_date - 30分钟

### 4. 重复日期字段
| 前端字段 | 后端字段 | 转换逻辑 | 说明 |
|---------|---------|---------|------|
| selectedWeekdays[] | repeat_days | encodeRepeatDays() | 使用位掩码编码 |

**位掩码编码逻辑:**
```
位分配(从右到左):
第1位(bit 0) → 周一
第2位(bit 1) → 周二
第3位(bit 2) → 周三
第4位(bit 3) → 周四
第5位(bit 4) → 周五
第6位(bit 5) → 周六
第7位(bit 6) → 周日

示例: 选择周一、周三、周五
二进制: 0010101 (从右到左:周一=1,周二=0,周三=1,周四=0,周五=1)
十进制: 21
```

### 5. 自动字段(后端处理)
| 字段 | 默认值 | 说明 |
|------|-------|------|
| id | 自增 | 任务ID |
| user_id | 当前用户ID | 从JWT token获取 |
| completed | 0 | 未完成状态 |
| completed_at | NULL | 完成时间 |
| focus_time | 0 | 专注时间 |
| pomodoro_count | 0 | 番茄钟计数 |
| deleted_at | NULL | 删除时间 |
| created_at | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | CURRENT_TIMESTAMP | 更新时间 |

## 创建的文件

### 1. taskService.ts
**位置:** `Arzu_simulator_front/src/services/taskService.ts`

**主要功能:**
- `createTask()` - 创建任务API调用
- `getUserTasks()` - 获取任务列表
- `convertPriorityToBackend()` - 优先级字段转换
- `parseChineseDateToISO()` - 中文日期转ISO 8601
- `calculateAlarmTime()` - 计算提醒时间
- `encodeRepeatDays()` - 重复日期位掩码编码

**请求示例:**
```typescript
await taskService.createTask(
  "完成项目文档",           // title
  "需要完成项目的技术文档", // description
  "勤政",                  // category
  "金卡",                  // priority (前端)
  "9月13日，周五",         // dateStr
  "下午20:00",             // timeStr
  "前5分钟",               // reminder
  "每周一、三、五",        // repeat
  [1, 3, 5]                // selectedWeekdays
);
```

**发送到后端的数据:**
```json
{
  "title": "完成项目文档",
  "description": "需要完成项目的技术文档",
  "category": "勤政",
  "priority": "金",
  "due_date": "2025-09-13T20:00:00.000Z",
  "alarm": "2025-09-13T19:55:00.000Z",
  "repeat_days": 21
}
```

## 修改的文件

### 1. TaskCreationModal.tsx
**修改内容:**
- 导入 `taskService`
- 添加 `isSubmitting` 状态
- 修改 `handleSubmit` 为异步函数
- 添加后端API调用逻辑
- 添加错误处理
- 显示"创建中..."状态

### 2. DateTimeModal.tsx
**修改内容:**
- 在 `onConfirm` 接口中添加 `selectedWeekdays` 字段
- 在确认时返回 `selectedWeekdays` 数据

### 3. api.ts
**修改内容:**
- 添加 `TASKS` 端点配置
- 添加 `TASK_BY_ID` 端点函数
- 添加 `TASK_STATS` 端点
- 添加 `TASK_ANALYTICS` 端点

## API端点

### 创建任务
```
POST /api/v1/tasks
Headers: 
  - Content-Type: application/json
  - Authorization: Bearer {accessToken}
Body: CreateTaskRequest
Response: TaskResponse
```

## 测试步骤

1. **启动后端服务**
   ```bash
   cd Arzu_simulator_back
   npm run dev
   ```

2. **启动前端服务**
   ```bash
   cd Arzu_simulator_front
   npm run dev
   ```

3. **测试流程**
   - 登录系统
   - 点击底部"+"按钮
   - 填写任务标题和内容
   - 设置DDL时间
   - (可选)设置任务类型和优先级
   - (可选)设置提醒时间
   - (可选)设置重复日期
   - 点击"创建"按钮
   - 检查浏览器控制台日志
   - 验证任务是否成功创建

## 注意事项

1. **认证要求**: 创建任务需要有效的 JWT token
2. **字段验证**: 
   - 标题长度: 1-12字符
   - 描述长度: 0-200字符
   - DDL时间必须设置
   - 优先级会自动转换为后端格式
3. **错误处理**: 创建失败时会显示错误提示
4. **加载状态**: 创建过程中按钮显示"创建中..."并禁用

## 调试信息

创建任务时会在控制台输出以下日志:
```
📤 发送任务创建请求: {...}
✅ 任务创建成功: {...}
```

如遇错误会输出:
```
创建任务失败: {错误信息}
```

## 后续优化建议

1. 添加任务创建成功后的提示
2. 实现任务列表的实时更新
3. 添加离线缓存支持
4. 优化错误提示的用户体验
5. 添加表单验证反馈
