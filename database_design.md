# 数据库设计与迁移文档

本文档提供与现有后端代码兼容且可直接执行的数据库方案，并统一 API 路由前缀为 `/api/v1`。适用于当前数据库无业务数据的场景，可一次性重建并落地所有表结构与索引。

---

## 📋 评审修改记录（2025-10-20）

### 修改内容总览
根据评审反馈，本次修改包括以下核心变更：

#### 1. **字段命名规范化**
- ✅ `users.usernam` → `users.username`（统一规范命名）
- ✅ 缩减字段长度：`mail` (255→120), `username` (255→50), `title` (255→100)

#### 2. **新增业务字段**
- ✅ `users` 表新增：`last_reward_trigger_time` (上次奖励触发时长), `reward_count` (奖励总数)
- ✅ `tasks` 表新增：`completed_at` (完成时间), `focus_time` (任务累计专注时长), `deleted_at` (软删除标记)

#### 3. **软删除机制**
- ✅ 采用逻辑删除，保留数据用于历史分析和可能的恢复
- ✅ 所有查询默认排除 `deleted_at IS NOT NULL` 的记录

#### 4. **索引优化**
- ❌ 删除低效索引：`idx_users_usernam`, `idx_tasks_category`, `idx_tasks_priority`, `idx_audit_action`
- ✅ 新增索引：`idx_tasks_deleted` (软删除查询优化)

#### 5. **API 路由迁移**
- ✅ 统一使用 `/api/v1` 前缀
- ✅ 保留 `/api` 作为兼容别名（具体实施见第八章）

---

## 一、 核心原则

- **保留部分：** `audit_logs`, `refresh_tokens`, `sqlite_sequences` 三个表的现有结构、功能及相关API接口保持不变。
- **数据迁移：** 在执行迁移时，需要编写脚本确保 `users` 和 `tasks` 表中的现有数据能够平滑地过渡到新的表结构中。
- **接口设计：** 所有新增和修改的表都将配备完整的增删改查（CRUD）API接口，以确保前后端能够顺利集成。
一次性落库：当前无数据，允许直接重建表结构（DROP + CREATE）。
- 与代码一致：字段命名与类型对齐后端仓库（如 `username`、`mail`、`completed BOOLEAN`）。
- 路由统一：所有 API 路径统一采用 `/api/v1/...` 前缀。
- 安全内建：JWT 认证、限流、输入校验、错误处理、审计与刷新令牌保留并说明。

## 二、数据库表结构设计（与后端兼容）

### 1. users (用户表) - 修改

**说明:** 现有 `users` 表将按照以下结构进行调整。

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `user_id` | INTEGER | **主键**。用户的唯一数字ID。 |
| `mail` | VARCHAR(120) | 登录标识/邮箱。作为用户登录的唯一凭据，并强制唯一。 |
| `username` | VARCHAR(50) | 用户名/昵称。用户在应用内显示的名称，不要求唯一。 |
| `password_hash` | VARCHAR(255) | 安全密码存储。存储的不是用户密码原文，而是经过bcrypt算法加密后的哈希值（bcrypt需要60字符）。 |
| `created_at` | DATETIME | 注册时间。记录用户创建账户的时间。 |
| `api_ds` | VARCHAR(120) | API动态密钥（推测）。此字段当前未被积极使用，可能为未来功能预留。 |
| `work_count` | INTEGER | 工作计数。用于统计用户完成的任务总数，默认 0。 |
| `worktime_count` | INTEGER | **工作时长统计**。用于累计用户的总专注时长（**分钟数**），默认 0。 |
| `last_reward_trigger_time` | INTEGER | **上次奖励触发时长**。记录上次触发奖励卡时的累计专注时长（分钟），默认 0。 |
| `reward_count` | INTEGER | **获得奖励卡总数**。用户累计获得的奖励卡数量，默认 0。 |

### 2. tasks (任务表) - 修改

**说明:** 现有 `tasks` 表将按照以下结构进行调整，核心在于引入三维分类和四级优先级，并支持软删除机制。

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `id` | INTEGER | **主键**。任务的唯一数字ID。 |
| `user_id` | INTEGER | 外键，关联到 `users(user_id)`，表明任务归属。 |
| `title` | VARCHAR(100) | 任务标题。 |
| `description` | TEXT | 任务描述。 |
| `category` | VARCHAR(20) | 分类：`勤政`、`恕己`、`爱人`（CHECK约束）。 |
| `priority` | VARCHAR(10) | 优先级：`金`、`银`、`铜`、`石`（CHECK约束）。 |
| `completed` | BOOLEAN | 完成状态，默认 0。 |
| `completed_at` | DATETIME | **完成时间**。记录任务完成的时间戳。 |
| `focus_time` | INTEGER | **任务累计专注时长**。该任务的累计专注时间（毫秒），默认 0。 |
| `pomodoro_count` | INTEGER | 番茄钟计数，默认 0。 |
| `due_date` | DATETIME | 截止日期。 |
| `alarm` | DATETIME | 提醒时间（扩展列）。 |
| `repeat_days` | INTEGER | 重复日期（按位，扩展列），默认 0。 |
| `deleted_at` | DATETIME | **软删除标记**。标记任务删除时间，NULL 表示未删除。 |
| `created_at` | DATETIME | 创建时间，默认当前。 |
| `updated_at` | DATETIME | 更新时间，默认当前。 |

**索引建议：** `user_id`、`completed`、`due_date`、`deleted_at`（已优化，移除低效索引 `category`、`priority`）。

**软删除使用说明：**
- **删除任务：** `UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`
- **恢复任务：** `UPDATE tasks SET deleted_at = NULL WHERE id = ?`
- **查询有效任务：** `SELECT * FROM tasks WHERE deleted_at IS NULL`
- **查询回收站：** `SELECT * FROM tasks WHERE deleted_at IS NOT NULL`

### 3. pomodoro_sessions (番茄钟主表)
与后端兼容：

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `id` | INTEGER | 主键，自增。 |
| `user_id` | INTEGER | 外键，`users(user_id)`，非空。 |
| `task_id` | INTEGER | 外键，`tasks(id)`，可空，`ON DELETE SET NULL`。 |
| `duration_minutes` | INTEGER | 会话时长，默认 25。 |
| `completed` | BOOLEAN | 是否完成，默认 false。 |
| `started_at` | DATETIME | 开始时间，默认当前。 |
| `completed_at` | DATETIME | 完成时间。 |

### 4. focus_periods (番茄钟记录表-子表) - 新增

**说明:** 此为新增表，用于精确记录每一次专注与中断，是 `pomodoro_sessions` 的子表。

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `period_id` | INTEGER | 主键，自增。 |
| `session_id` | INTEGER | 外键，`pomodoro_sessions(id)`，非空。 |
| `start_time` | DATETIME | 开始时间，非空。 |
| `end_time` | DATETIME | 结束时间。 |
| `duration_min` | INTEGER | 时长（分钟）。 |
| `is_interrupted` | BOOLEAN | 是否因中断结束，默认 false。 |
| `created_at` | DATETIME | 创建时间，默认当前。 |

### 5. task_brieflogs (总结管理日志表) - 新增

**说明:** 此为新增表，用于统一管理任务生命周期中的各类文本记录和反馈。一次性落库，采用受控字符串代替 ENUM（SQLite 兼容）：

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `debrief_id` | INTEGER | 主键，自增。 |
| `session_id` | INTEGER | 外键，`pomodoro_sessions(id)`，可空。 |
| `task_id` | INTEGER | 外键，`tasks(id)`，可空。 |
| `user_id` | INTEGER | 外键，`users(user_id)`，非空。 |
| `brief_type` | VARCHAR(24) | 类型：`DELETE_REASON`、`INTERRUPT_REMARK`、`PRIORITY_CHANGE`、`CATEGORY_CHANGE`、`DUE_DATE_CHANGE`、`COMPLETION_REMARK`（CHECK约束）。 |
| `brief_content` | TEXT | 内容，非空。 |
| `created_at` | DATETIME | 创建时间，默认当前。 |

### 6. gift_card (奖励卡管理表) - 新增

一次性落库：
**说明:** 此为新增表，用于管理用户可获取的奖励卡片。

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `gift_id` | INTEGER | 主键，自增。 |
| `title` | VARCHAR(50) | 标题。 |
| `description` | TEXT | 描述。 |
| `created_at` | DATETIME | 创建时间，默认当前。 |

### 7. refresh_tokens / audit_logs（安全保留）
- `refresh_tokens`：刷新令牌存储（用户ID、令牌、过期时间）。
- `audit_logs`：审计日志（用户ID、动作、资源、时间、元数据）。

## 三、API 接口设计（统一为 /api/v1 前缀）

### Auth API (`/api/v1/auth`)
- `POST /api/v1/auth/register`: 用户注册（`username`, `mail`, `password`）。
- `POST /api/v1/auth/login`: 用户名登录（`username` + `password`）。
- `POST /api/v1/auth/login/email`: 邮箱登录（`mail` + `password`）。
- `POST /api/v1/auth/refresh`: 刷新令牌（读写 `refresh_tokens`）。
- `POST /api/v1/auth/logout`: 登出。
- `GET /api/v1/auth/profile`: 当前用户资料。

### Tasks API (`/api/v1/tasks`)
- `GET /api/v1/tasks`: 任务列表（筛选：`category`, `priority`, `completed`, `due_date`）。
- `POST /api/v1/tasks`: 创建任务。
- `GET /api/v1/tasks/:id`: 获取单个任务。
- `PATCH /api/v1/tasks/:id`: 更新任务。
- `DELETE /api/v1/tasks/:id`: 删除任务。
- `GET /api/v1/tasks/stats`: 任务统计。
- `GET /api/v1/tasks/analytics?days=7`: 任务分析。
- `GET /api/v1/tasks/search?q=...`: 搜索任务。
- `GET /api/v1/tasks/upcoming`: 即将到期。
- `GET /api/v1/tasks/overdue`: 逾期任务。
- `POST /api/v1/tasks/archive`: 归档已完成。
- `POST /api/v1/tasks/batch`: 批量操作（完成/删除/更新分类/优先级/截止日/归档）。

### Pomodoro API (`/api/v1/tasks/pomodoro`)
- `POST /api/v1/tasks/pomodoro`: 创建会话。
- `PATCH /api/v1/tasks/pomodoro/:sessionId/complete`: 完成会话。
- `GET /api/v1/tasks/pomodoro`: 会话列表。
- `GET /api/v1/tasks/pomodoro/active`: 活跃会话。
- `GET /api/v1/tasks/pomodoro/stats`: 会话统计。

### Focus Periods API（待路由接入）
- 建议挂载：`/api/v1/tasks/pomodoro/:sessionId/periods`（自动记录为主）。

### Task Brieflogs API（待路由接入）
- 建议挂载：`/api/v1/tasks/:taskId/brieflogs`。

### Gift Cards API（待路由接入）
- 建议挂载：`/api/v1/gift-cards`（前期仅读）。

## 四、一次性迁移脚本（SQLite，可直接执行）

以下脚本将一次性重建所有表结构，适用于当前数据库无数据的情况。执行前请备份现有 `.db` 文件。

```sql
PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

DROP TABLE IF EXISTS focus_periods;
DROP TABLE IF EXISTS task_brieflogs;
DROP TABLE IF EXISTS gift_card;
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS audit_logs;

-- users
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  mail VARCHAR(120) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  api_ds VARCHAR(120),
  work_count INTEGER DEFAULT 0,
  worktime_count INTEGER DEFAULT 0,
  last_reward_trigger_time INTEGER DEFAULT 0,
  reward_count INTEGER DEFAULT 0
);
CREATE INDEX idx_users_mail ON users(mail);

-- tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) DEFAULT '勤政' CHECK (category IN ('勤政','恕己','爱人')),
  priority VARCHAR(10) DEFAULT '铜' CHECK (priority IN ('金','银','铜','石')),
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  focus_time INTEGER DEFAULT 0,
  pomodoro_count INTEGER DEFAULT 0,
  due_date DATETIME,
  alarm DATETIME,
  repeat_days INTEGER DEFAULT 0,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at);

-- pomodoro_sessions
CREATE TABLE pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  duration_minutes INTEGER DEFAULT 25,
  completed BOOLEAN DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX idx_pomodoro_user ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_task ON pomodoro_sessions(task_id);
CREATE INDEX idx_pomodoro_completed ON pomodoro_sessions(completed);

-- focus_periods
CREATE TABLE focus_periods (
  period_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration_min INTEGER,
  is_interrupted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_focus_session ON focus_periods(session_id);

-- task_brieflogs
CREATE TABLE task_brieflogs (
  debrief_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  task_id INTEGER,
  user_id INTEGER NOT NULL,
  brief_type VARCHAR(24) NOT NULL CHECK (brief_type IN ('DELETE_REASON','INTERRUPT_REMARK','PRIORITY_CHANGE','CATEGORY_CHANGE','DUE_DATE_CHANGE','COMPLETION_REMARK')),
  brief_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_brieflogs_task ON task_brieflogs(task_id);
CREATE INDEX idx_brieflogs_user ON task_brieflogs(user_id);

-- refresh_tokens
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);

-- audit_logs
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

COMMIT;
```

## 五、执行与回滚指引
- 备份：复制现有 `database.db` 文件（如 `database_backup_YYYYMMDD.db`）。
- 执行：在 SQLite 环境或后端迁移脚本中运行上述 SQL；确保 `PRAGMA foreign_keys = ON`。
- 验证：运行后端测试（任务与认证端点），确认表与索引创建成功且读写正常。
- 回滚：如需回滚，可恢复备份 `.db`，或在事务中取消提交。

## 六、安全与合规要点
- 认证：所有受保护接口使用 JWT 中间件（`authenticateToken`）。
- 限流：按路由分组应用限流（如 `tasks`、`create-task`、`get-pomodoro-sessions`）。
- 输入校验：使用模块化校验器（`validateRequest`/`validateTaskRequest` 等）。
- 错误处理：统一错误响应，记录审计日志（`audit_logs`）。
- 令牌管理：刷新令牌表 `refresh_tokens` 保留与清理策略。
- 数据最小化：列表接口分页与字段最小返回，分析端口限定 `days` 范围。

## 七、代码锚点与核对清单
- 路由挂载：`/api/v1/auth`、`/api/v1/tasks`（入口 `server.ts` / `index.ts`）。
- 认证路由：`auth.routes.ts`（`register/login/refresh/logout/profile`）。
- 任务路由：`task.routes.ts`（CRUD、统计、分析、搜索、批量、pomodoro）。
- 仓储与服务：`user.repository.ts`、`task.repository.ts`、`task.service.ts`。
- 迁移参考：`003-reinitialize-database.sql`、`001-initial-schema.sql`。
- 测试与文档：`src/tests/*.ts`、`src/docs/api-docs.ts`。

---

## 八、API 路由迁移实施指南

### 8.1 后端路由迁移步骤

**目标：** 将现有 `/api` 路由迁移到 `/api/v1`，同时保留 `/api` 作为兼容别名。

#### 步骤 1：修改路由前缀（`src/api/index.ts`）

```typescript
// src/api/index.ts
import express from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';

const router = express.Router();

// 挂载 v1 路由
router.use('/v1/auth', authRoutes);
router.use('/v1/tasks', taskRoutes);

// 🔄 兼容别名：保留旧版 /api 路由
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

export default router;
```

#### 步骤 2：更新 `server.ts` 路由挂载

```typescript
// src/server.ts
app.use('/api', apiRoutes);  // 保持不变，内部已有 /v1 前缀
```

**最终路由结构：**
- ✅ `/api/v1/auth/login` （新版，推荐）
- ✅ `/api/auth/login` （兼容别名）
- ✅ `/api/v1/tasks` （新版）
- ✅ `/api/tasks` （兼容别名）

### 8.2 前端 API 调用更新

**创建 API 配置文件：**

```typescript
// Arzu_simulator_front/src/config/api.ts
const API_VERSION = 'v1';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  BASE: `${API_BASE_URL}/api/${API_VERSION}`,
  AUTH: {
    REGISTER: `/api/${API_VERSION}/auth/register`,
    LOGIN: `/api/${API_VERSION}/auth/login`,
    LOGIN_EMAIL: `/api/${API_VERSION}/auth/login/email`,
    REFRESH: `/api/${API_VERSION}/auth/refresh`,
    LOGOUT: `/api/${API_VERSION}/auth/logout`,
    PROFILE: `/api/${API_VERSION}/auth/profile`,
  },
  TASKS: {
    LIST: `/api/${API_VERSION}/tasks`,
    CREATE: `/api/${API_VERSION}/tasks`,
    GET: (id: number) => `/api/${API_VERSION}/tasks/${id}`,
    UPDATE: (id: number) => `/api/${API_VERSION}/tasks/${id}`,
    DELETE: (id: number) => `/api/${API_VERSION}/tasks/${id}`,
    STATS: `/api/${API_VERSION}/tasks/stats`,
    ANALYTICS: `/api/${API_VERSION}/tasks/analytics`,
    SEARCH: `/api/${API_VERSION}/tasks/search`,
  },
  POMODORO: {
    CREATE: `/api/${API_VERSION}/tasks/pomodoro`,
    COMPLETE: (sessionId: number) => `/api/${API_VERSION}/tasks/pomodoro/${sessionId}/complete`,
    LIST: `/api/${API_VERSION}/tasks/pomodoro`,
    ACTIVE: `/api/${API_VERSION}/tasks/pomodoro/active`,
    STATS: `/api/${API_VERSION}/tasks/pomodoro/stats`,
  },
};
```

**使用示例：**

```typescript
// 前端 API 调用示例
import axios from 'axios';
import { API_ENDPOINTS } from './config/api';

// 用户登录
const login = async (username: string, password: string) => {
  const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
    username,
    password,
  });
  return response.data;
};

// 获取任务列表
const getTasks = async () => {
  const response = await axios.get(API_ENDPOINTS.TASKS.LIST);
  return response.data;
};
```

### 8.3 迁移验证清单

- [ ] 后端路由前缀已更新为 `/api/v1`
- [ ] 后端保留 `/api` 兼容别名
- [ ] 前端 API 配置文件已创建
- [ ] 前端所有 API 调用已更新
- [ ] 测试新路由端点正常工作
- [ ] 测试旧路由兼容别名正常工作
- [ ] 更新 API 文档
- [ ] 更新环境变量配置

---

## 九、软删除机制使用指南

### 9.1 软删除实现示例

**后端控制器示例（`task.controller.ts`）：**

```typescript
// 软删除任务
export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // 使用软删除而非物理删除
    const result = await taskRepository.softDelete(id, userId);
    
    if (!result) {
      return res.status(404).json({ message: '任务不存在' });
    }

    res.json({ message: '任务已删除', taskId: id });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
};

// 恢复已删除任务
export const restoreTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await taskRepository.restore(id, userId);
    
    if (!result) {
      return res.status(404).json({ message: '任务不存在或未被删除' });
    }

    res.json({ message: '任务已恢复', taskId: id });
  } catch (error) {
    res.status(500).json({ message: '恢复失败' });
  }
};

// 获取回收站（已删除任务列表）
export const getTrash = async (req: Request, res: Response) => {
  const userId = req.user.userId;

  try {
    const tasks = await taskRepository.findDeleted(userId);
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: '获取失败' });
  }
};
```

**后端仓储示例（`task.repository.ts`）：**

```typescript
// 软删除
export const softDelete = async (taskId: string, userId: number) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tasks 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [taskId, userId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
};

// 恢复任务
export const restore = async (taskId: string, userId: number) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tasks 
       SET deleted_at = NULL 
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`,
      [taskId, userId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
};

// 查询有效任务（默认查询，排除已删除）
export const findAll = async (userId: number) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// 查询已删除任务（回收站）
export const findDeleted = async (userId: number) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND deleted_at IS NOT NULL 
       ORDER BY deleted_at DESC`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};
```

### 9.2 新增 API 端点

**建议新增以下端点：**

```typescript
// src/api/task.routes.ts
router.post('/tasks/:id/restore', authenticateToken, restoreTask);  // 恢复任务
router.get('/tasks/trash', authenticateToken, getTrash);           // 获取回收站
router.delete('/tasks/:id/permanent', authenticateToken, permanentDelete); // 永久删除
```

---

以上为一次性可执行版本，满足"直接修改表结构、统一路由、能正确安全执行"的要求，并与后端现状兼容（字段与路由）。
