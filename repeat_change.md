# 重复任务生成逻辑变更方案

## 1. 概述

本文档旨在说明对现有重复任务生成逻辑的变更计划。当前逻辑为每日通过定时任务（Cron Job）生成当天的重复任务。新的逻辑将变更为**在创建/更新时预生成本周任务**，并**每周一次性生成下一周的所有重复任务**，以便用户可以提前查看和规划。

## 2. 变更目标

- **即时性**：用户创建或修改一个重复任务模板后，应立即在日历上看到本周内将要发生的任务实例。
- **前瞻性**：系统应在每周初（周一 00:00）自动生成接下来一整周的重复任务。
- **一致性**：无论是即时生成还是每周生成，都应使用同一套核心逻辑，确保行为一致。
- **健壮性**：需要处理模板任务被修改或删除的场景，避免产生孤立或错误的任务实例。

## 3. 核心变更点

为了实现上述目标，需要对后端进行以下三处核心改造：

1.  **改造任务创建/更新的API端点**：使其在保存模板任务后，立即调用生成逻辑。
2.  **调整定时任务（Cron Job）**：从每日任务改为每周任务。
3.  **实现可复用的周任务生成函数**：这是本次变更的核心。

---

## 4. 详细实现方案

### 4.1. 数据库变更（**必须**）

#### 4.1.1. 添加 `parent_task_id` 字段

为了更好地管理模板与实例之间的关系，**必须**在 `tasks` 表中增加一个字段：

-   `parent_task_id` (INTEGER, nullable, FOREIGN KEY to `tasks.id`):
    -   如果一个任务是"实例"，该字段应指向其"模板"任务的ID。
    -   如果一个任务是"模板"，该字段为 `NULL`。

**迁移SQL (PostgreSQL):**
```sql
ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE;
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
```

**迁移SQL (SQLite):**
```sql
-- SQLite不支持直接添加外键，需要重建表
CREATE TABLE tasks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '勤政',
  priority TEXT DEFAULT '铜',
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  focus_time REAL DEFAULT 0,
  pomodoro_count INTEGER DEFAULT 0,
  due_date TEXT,
  alarm TEXT,
  repeat_days TEXT,  -- 注意：改为TEXT类型
  parent_task_id INTEGER,
  deleted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 复制数据
INSERT INTO tasks_new SELECT *, NULL as parent_task_id FROM tasks;

-- 替换表
DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;

-- 创建索引
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE UNIQUE INDEX idx_tasks_instance_unique ON tasks(parent_task_id, due_date) WHERE parent_task_id IS NOT NULL;
```

#### 4.1.2. 修改 `repeat_days` 数据类型

**当前问题**：`repeat_days` 为 `INTEGER`，无法存储多个星期几。

**解决方案（二选一）**：

**方案A：使用 JSON 数组（推荐）**
```sql
-- PostgreSQL
ALTER TABLE tasks ALTER COLUMN repeat_days TYPE TEXT;

-- SQLite（见上面的重建表SQL）
```
存储格式：`"[0,1,3,5]"`（表示周日、周一、周三、周五）

**方案B：使用位掩码**
保持 `INTEGER` 类型，使用位运算：
- 周日=1, 周一=2, 周二=4, 周三=8, 周四=16, 周五=32, 周六=64
- 例：周一+周三+周五 = 2+8+32 = 42

**本文档后续代码将采用方案A（JSON数组）。**

#### 4.1.3. 添加唯一约束防止重复

为了避免同一模板在同一时间生成多个实例，添加唯一索引：

```sql
-- 确保同一模板的同一due_date只有一个实例
CREATE UNIQUE INDEX idx_tasks_instance_unique 
ON tasks(parent_task_id, due_date) 
WHERE parent_task_id IS NOT NULL;
```

### 4.2. 改造API端点 (`POST /api/tasks` 和 `PUT /api/tasks/:id`)

当用户创建或更新一个任务，并且该任务设置了 `repeat_days` 时，后端在将该“模板”任务存入数据库后，需要**立即调用**新的周任务生成函数。

**伪代码示例 (Express.js):**

```javascript
// 在你的 tasks router 文件中

// 1. 引入新的生成逻辑服务
const TaskGenerationService = require('../services/taskGenerationService');

// 2. 修改创建任务的路由
router.post('/tasks', async (req, res) => {
  // ... 数据验证和保存模板任务的逻辑 ...
  const templateTask = await db.tasks.create({ ...req.body });

  // 3. 如果是重复任务，立即生成本周的实例
  // 解析repeat_days（可能是JSON字符串或数组）
  const repeatDays = typeof templateTask.repeat_days === 'string' 
    ? JSON.parse(templateTask.repeat_days) 
    : templateTask.repeat_days;
  
  if (repeatDays && repeatDays.length > 0) {
    // 调用核心函数，传入新创建的模板任务
    // 'this_week' 参数告诉函数只生成当前周剩余的任务
    await TaskGenerationService.generateWeeklyTasks(templateTask, 'this_week');
  }

  res.status(201).json(templateTask);
});

// 3. 修改更新任务的路由 (PUT /api/tasks/:id)
router.put('/tasks/:id', async (req, res) => {
    // ... 更新模板任务的逻辑 ...
    const updatedTemplateTask = await db.tasks.update(...);

    // 先删除未来所有未完成的子任务
    await db.tasks.destroy({
        where: {
            parent_task_id: updatedTemplateTask.id,
            is_completed: false, // 只删除未完成的
            due_date: { [Op.gte]: new Date() } // 只删除未来的
        }
    });

    // 重新生成本周及未来的任务
    // 解析repeat_days（可能是JSON字符串或数组）
    const repeatDays = typeof updatedTemplateTask.repeat_days === 'string'
      ? JSON.parse(updatedTemplateTask.repeat_days)
      : updatedTemplateTask.repeat_days;
    
    if (repeatDays && repeatDays.length > 0) {
        await TaskGenerationService.generateWeeklyTasks(updatedTemplateTask, 'this_week');
    }

    res.json(updatedTemplateTask);
});
```

### 4.3. 调整 Cron Job

修改 `node-cron` 的调度配置，添加每周一 `00:00` 执行的任务。

**代码示例 (src/utils/scheduler.ts):**

```typescript
import cron from 'node-cron';
import { runQuery, allQuery } from '../database/connection';
import { logger } from '../config/logger';
import { TaskGenerationService } from '../services/taskGenerationService';

export function startScheduledTasks() {
  // 原有任务：每月1日凌晨0:00重置补打卡次数
  cron.schedule('0 0 1 * *', async () => {
    try {
      logger.info('开始执行每月重置补打卡次数任务');
      await runQuery('UPDATE users SET reward_count = 0', []);
      logger.info('每月补打卡次数重置成功');
    } catch (error: any) {
      logger.error('每月补打卡次数重置失败', { error: error.message });
    }
  }, {
    timezone: 'Asia/Shanghai'
  });

  // 新增任务：每周一 00:00 (东八区) 生成下一周重复任务
  cron.schedule('0 0 * * 1', async () => {
    try {
      logger.info('开始执行每周重复任务生成...');

      // 1. 查找所有"模板"任务（parent_task_id 为 NULL 且 repeat_days 不为空）
      const templateTasks = await allQuery(
        `SELECT * FROM tasks 
         WHERE parent_task_id IS NULL 
         AND repeat_days IS NOT NULL 
         AND repeat_days != '[]' 
         AND repeat_days != '0'
         AND deleted_at IS NULL`,
        []
      );

      logger.info(`找到 ${templateTasks.length} 个模板任务`);

      // 2. 为每个模板生成下一周的任务
      for (const template of templateTasks) {
        try {
          await TaskGenerationService.generateWeeklyTasks(template, 'next_week');
        } catch (error: any) {
          logger.error('生成任务实例失败', { 
            templateId: template.id, 
            error: error.message 
          });
        }
      }

      logger.info('每周任务生成完毕。');
    } catch (error: any) {
      logger.error('每周重复任务生成失败', { error: error.message });
    }
  }, {
    timezone: 'Asia/Shanghai'  // 使用东八区时间
  });

  logger.info('定时任务已启动：');
  logger.info('  - 每月1日凌晨0:00：重置补打卡次数');
  logger.info('  - 每周一凌晨0:00：生成下一周重复任务');
}
```

**注意事项**：
- 使用 `timezone: 'Asia/Shanghai'` 确保定时任务在东八区执行
- 但内部日期计算应使用 UTC，见 4.4 节

### 4.4. 实现核心生成函数 `generateWeeklyTasks`

这是所有逻辑的核心，需要被API和Cron Job共同调用。

**代码示例 (src/services/taskGenerationService.ts):**

```typescript
import { runQuery, allQuery, getQuery } from '../database/connection';
import { logger } from '../config/logger';

export class TaskGenerationService {
  static async generateWeeklyTasks(templateTask: any, period: 'this_week' | 'next_week' = 'this_week'): Promise<void> {
    const { id, title, description, repeat_days, due_date, user_id } = templateTask;
    
    // 解析 repeat_days（可能是JSON字符串或数组）
    const repeatDaysArray = typeof repeat_days === 'string' 
      ? JSON.parse(repeat_days) 
      : repeat_days;
    
    if (!repeatDaysArray || repeatDaysArray.length === 0) {
      logger.warn('模板任务没有重复规则', { taskId: id });
      return;
    }

    // 提取时间部分（HH:MM:SS）
    const dueTime = due_date ? new Date(due_date).toISOString().split('T')[1].substring(0, 8) : '00:00:00';

    // 1. 确定要生成的日期范围（统一使用UTC时间）
    const nowUTC = new Date();
    let startDate: Date, endDate: Date;

    if (period === 'this_week') {
      // 从今天开始，到本周日结束
      startDate = new Date(nowUTC);
      const dayOfWeek = nowUTC.getUTCDay(); // 0=周日, 1=周一, ...
      endDate = new Date(nowUTC);
      // 修复：确保周日也能正确计算
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      endDate.setUTCDate(nowUTC.getUTCDate() + daysUntilSunday);
    } else { // 'next_week'
      // 从下周一开始，到下周日结束
      const dayOfWeek = nowUTC.getUTCDay();
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      
      startDate = new Date(nowUTC);
      startDate.setUTCDate(nowUTC.getUTCDate() + daysUntilNextMonday);
      
      endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6); // 周一到周日
    }

    // 2. 遍历日期范围，生成任务实例
    const tasksToCreate: any[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const currentDayOfWeek = currentDate.getUTCDay(); // 0=周日, 1=周一, ...

      // 3. 检查今天是否在重复规则内
      if (repeatDaysArray.includes(currentDayOfWeek)) {
        
        // 组合日期和时间（ISO格式）
        const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const newDueDate = `${dateStr}T${dueTime}`; // YYYY-MM-DDTHH:MM:SS

        // 防止重复创建：使用数据库唯一索引 + 检查
        const existing = await getQuery(
          'SELECT id FROM tasks WHERE parent_task_id = ? AND due_date = ?',
          [id, newDueDate]
        );

        if (!existing) {
          tasksToCreate.push({
            user_id,
            title,
            description: description || null,
            category: templateTask.category || '勤政',
            priority: templateTask.priority || '铜',
            due_date: newDueDate,
            completed: false,
            repeat_days: null, // 实例任务没有重复规则
            parent_task_id: id // 关联到模板
          });
        }
      }
      
      // 移动到下一天
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 4. 批量插入数据库，提高效率
    if (tasksToCreate.length > 0) {
      for (const task of tasksToCreate) {
        try {
          await runQuery(
            `INSERT INTO tasks (user_id, title, description, category, priority, due_date, completed, repeat_days, parent_task_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [task.user_id, task.title, task.description, task.category, task.priority, task.due_date, task.completed ? 1 : 0, task.repeat_days, task.parent_task_id]
          );
        } catch (error: any) {
          // 如果唯一索引冲突，忽略（说明已存在）
          if (!error.message.includes('UNIQUE constraint')) {
            logger.error('创建任务实例失败', { task, error: error.message });
          }
        }
      }
      logger.info(`为模板任务 #${id} 生成了 ${tasksToCreate.length} 个实例`, { period, taskIds: tasksToCreate });
    } else {
      logger.debug(`模板任务 #${id} 在指定周期内无需生成新任务`, { period });
    }
  }
}
```

**关键改进**：
1. **修复周日计算bug**：使用 `daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek)`
2. **统一使用UTC时间**：所有日期计算使用 `getUTCDay()` 和 `setUTCDate()`，避免时区问题
3. **解析JSON格式**：支持 `repeat_days` 为字符串或数组
4. **数据库层面防重复**：配合唯一索引，捕获 `UNIQUE constraint` 错误并忽略

## 5. 边缘情况处理

### 5.1. 模板任务更新

**场景**：用户修改了模板任务的时间、标题或重复规则。

**处理策略**：
1. **保留已完成的实例**：已完成的任务代表历史记录，不应删除
2. **删除未来未完成的实例**：重新生成以反映新的模板配置
3. **使用 `parent_task_id`**：快速定位所有关联实例

**实现代码** (见 4.2 节)：
```typescript
// 删除未来所有未完成的子任务
await runQuery(
  `DELETE FROM tasks 
   WHERE parent_task_id = ? 
   AND completed = 0 
   AND due_date >= datetime('now')`,
  [updatedTemplateTask.id]
);

// 重新生成任务
await TaskGenerationService.generateWeeklyTasks(updatedTemplateTask, 'this_week');
```

### 5.2. 模板任务删除

**场景**：用户删除了模板任务。

**处理策略（建议提供用户选择）**：
- **选项1（推荐）**：软删除模板，保留所有实例任务（包括未完成的）
- **选项2**：软删除模板，同时删除未来未完成的实例
- **选项3**：级联删除所有实例（不推荐，会丢失历史记录）

**实现代码**：
```typescript
// 选项1：只软删除模板
async deleteTemplate(taskId: number, userId: number, deleteInstances: boolean = false) {
  // 软删除模板
  await runQuery(
    `UPDATE tasks SET deleted_at = datetime('now') 
     WHERE id = ? AND user_id = ? AND parent_task_id IS NULL`,
    [taskId, userId]
  );

  if (deleteInstances) {
    // 选项2：删除未来未完成的实例
    await runQuery(
      `UPDATE tasks SET deleted_at = datetime('now')
       WHERE parent_task_id = ? 
       AND completed = 0 
       AND due_date >= datetime('now')`,
      [taskId]
    );
  }

  logger.info('模板任务已删除', { taskId, deleteInstances });
}
```

### 5.3. 防止重复创建

**多层防护机制**：

1. **数据库唯一索引**（最可靠）：
```sql
CREATE UNIQUE INDEX idx_tasks_instance_unique 
ON tasks(parent_task_id, due_date) 
WHERE parent_task_id IS NOT NULL;
```

2. **代码层检查**（见 4.4 节）：
```typescript
const existing = await getQuery(
  'SELECT id FROM tasks WHERE parent_task_id = ? AND due_date = ?',
  [id, newDueDate]
);
if (!existing) { /* 创建任务 */ }
```

3. **捕获冲突错误**：
```typescript
try {
  await runQuery(/* INSERT ... */);
} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    // 忽略重复创建错误
    return;
  }
  throw error;
}
```

### 5.4. 时区问题处理

**问题**：用户和服务器可能在不同时区。

**解决方案**：
1. **统一使用UTC存储**：数据库中所有 `due_date` 使用 ISO 8601 UTC 格式
2. **Cron调度使用本地时区**：`timezone: 'Asia/Shanghai'` 确保定时任务在东八区执行
3. **日期计算使用UTC方法**：`getUTCDay()`, `setUTCDate()` 避免本地时区影响
4. **前端显示转换**：前端根据用户时区显示时间

**示例**：
```typescript
// ✅ 正确：使用UTC方法
const dayOfWeek = nowUTC.getUTCDay();
endDate.setUTCDate(nowUTC.getUTCDate() + 7);

// ❌ 错误：使用本地时区方法
const dayOfWeek = now.getDay(); // 会受服务器时区影响
endDate.setDate(now.getDate() + 7);
```

### 5.5. 并发创建问题

**场景**：多个Cron Job或API请求同时创建任务。

**解决方案**：
- 依赖数据库唯一索引，让数据库处理并发冲突
- 使用事务（如果需要批量操作的原子性）

```typescript
// SQLite自动处理单条INSERT的原子性
// 唯一索引会自动拒绝重复记录
await runQuery(/* INSERT ... */);
```

## 6. 实施前检查清单

### 6.1. 数据库变更
- [ ] 添加 `parent_task_id` 字段及外键约束
- [ ] 修改 `repeat_days` 类型为 TEXT（支持JSON数组）
- [ ] 创建唯一索引 `idx_tasks_instance_unique`
- [ ] 创建普通索引 `idx_tasks_parent`
- [ ] 备份现有数据
- [ ] 测试迁移脚本（先在测试环境）

### 6.2. 代码实现
- [ ] 创建 `TaskGenerationService` 服务类
- [ ] 实现 `generateWeeklyTasks()` 方法
- [ ] 修改任务创建API端点（POST /api/tasks）
- [ ] 修改任务更新API端点（PUT /api/tasks/:id）
- [ ] 修改任务删除逻辑（支持级联删除选项）
- [ ] 更新 `scheduler.ts` 添加周任务生成

### 6.3. 测试用例
- [ ] 跨周边界测试（周六晚上创建任务）
- [ ] 周日创建任务测试
- [ ] 并发创建测试（多个请求同时生成）
- [ ] 时区测试（UTC vs 东八区）
- [ ] 更新模板后实例任务的变化
- [ ] 删除模板后实例任务的处理
- [ ] Cron Job手动触发测试

### 6.4. 性能优化
- [ ] 批量插入优化（使用事务）
- [ ] 索引性能验证
- [ ] 大量模板任务场景测试（100+ 模板）
- [ ] 日志记录优化（避免过多日志）

### 6.5. 文档更新
- [ ] 更新API文档（Swagger/OpenAPI）
- [ ] 更新数据库Schema文档
- [ ] 添加故障排查指南
- [ ] 前端适配文档（如何显示模板和实例）

## 7. 风险评估与回滚方案

### 7.1. 主要风险
1. **数据迁移失败**：现有任务数据可能损坏
2. **性能下降**：大量任务生成可能阻塞数据库
3. **时区错误**：用户看到错误的任务时间
4. **重复创建**：唯一索引失效导致重复任务

### 7.2. 回滚方案
1. **数据库回滚**：
   - 保留迁移前的数据库备份
   - 准备反向迁移脚本（删除新字段、还原旧类型）
   
2. **代码回滚**：
   - 使用Git版本控制，标记发布版本
   - 准备快速回滚脚本

3. **分阶段发布**：
   - 第一阶段：仅添加数据库字段，不启用新逻辑
   - 第二阶段：启用API端点的即时生成
   - 第三阶段：启用Cron Job周任务生成

## 8. 总结

通过以上步骤，我们可以将重复任务的生成逻辑从被动的"每日检查"模式，转变为主动的"每周预生成"模式，显著提升用户体验。

**核心改进**：
1. ✅ 数据库增加 `parent_task_id` 和修改 `repeat_days` 类型
2. ✅ 实现 `TaskGenerationService.generateWeeklyTasks()` 核心服务
3. ✅ API端点即时生成本周任务
4. ✅ Cron Job每周一生成下一周任务
5. ✅ 多层防护机制防止重复创建
6. ✅ 统一使用UTC时间避免时区问题
7. ✅ 完善的边缘情况处理（更新、删除、并发）

**关键注意事项**：
- 所有日期计算使用UTC方法（`getUTCDay()`, `setUTCDate()`）
- 数据库唯一索引是防重复的最后防线
- 保留已完成任务的历史记录，只删除未来未完成的实例
- 在测试环境充分验证后再上线
