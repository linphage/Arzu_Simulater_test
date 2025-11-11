# 任务完成与工作总结功能实现方案

## 1. 功能概述

本文档旨在为“点击完成任务并提交工作总结”这一新功能提供完整的全栈实现方案。当用户在任务卡片上点击“完成”选择框时，系统将弹出一个模态框，引导用户填写简短的工作总结。提交后，系统将记录该总结，并将任务状态更新为“已完成”。

## 2. 核心流程

1.  **前端触发**：用户点击任务卡片上的完成方块。
2.  **前端响应**：一个模态框（Modal）弹出，其中包含一个文本输入区和提交按钮。
3.  **用户输入**：用户在文本区内填写工作总结，并点击“提交总结”按钮。
4.  **API 请求**：前端向后端发送一个请求，包含任务ID和总结内容。
5.  **后端处理**：后端在一个数据库事务（Transaction）中执行两个操作：
    a. 在 `task_brieflogs` 表中创建一条新的记录。
    b. 更新 `tasks` 表中对应任务的 `completed` 和 `completed_at` 字段。
6.  **API 响应**：后端返回成功或失败的状态给前端。
7.  **前端更新**：前端接收到成功响应后，关闭模态框，并将该任务卡片的UI更新为“已完成”样式。

---

## 3. 前端实现 (React)

前端的修改主要集中在任务列表和任务卡片组件。

### 3.1. 创建模态框组件 (`CompletionSummaryModal.tsx`)

首先，创建一个可复用的模态框组件。

-   **Props**:
    -   `isOpen: boolean`: 控制模态框的显示与隐藏。
    -   `onClose: () => void`: 关闭模态框时触发的回调。
    -   `onSubmit: (summary: string) => void`: 提交总结时触发的回调，将总结内容作为参数传出。
    -   `isLoading: boolean`: 用于在API请求期间显示加载状态（例如禁用提交按钮）。
-   **State**:
    -   `const [summary, setSummary] = useState('');`: 用于管理 `textarea` 的输入内容。
-   **结构**: 使用您提供的HTML结构，并将其转换为JSX。

**伪代码示例:**

```jsx
// CompletionSummaryModal.tsx
import React, { useState } from 'react';

const CompletionSummaryModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [summary, setSummary] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(summary);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="unified-content bg-white max-w-sm w-full ..." style={{...}}>
        {/* ... 模态框的p, textarea, button等内容 ... */}
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="分享你的工作总结..."
          className="unified-textarea w-full ..."
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="unified-button ..."
        >
          {isLoading ? '提交中...' : '提交总结'}
        </button>
        {/* ... */}
      </div>
    </div>
  );
};

export default CompletionSummaryModal;
```

### 3.2. 修改任务列表/卡片组件 (`TaskList.tsx` / `TaskCard.tsx`)

在渲染任务列表的父组件中管理模态框的状态和逻辑。

-   **State 管理**:
    -   `const [isModalOpen, setIsModalOpen] = useState(false);`
    -   `const [selectedTask, setSelectedTask] = useState(null);` // 存储当前正在操作的任务
    -   `const [isLoading, setIsLoading] = useState(false);`

-   **事件处理**:
    1.  **打开模态框**: 在 `TaskCard.tsx` 的完成方块 `div` 上添加 `onClick` 事件。
        ```jsx
        // 在 TaskCard.tsx 中
        <div
          className="box-border content-stretch ..."
          onClick={() => onCompleteClick(task)} // 触发父组件的函数
        >
          {/* ... SVG icon ... */}
        </div>
        ```
        该事件调用父组件 (`TaskList.tsx`) 中的处理函数：
        ```jsx
        // 在 TaskList.tsx 中
        const handleCompleteClick = (task) => {
          if (!task.completed) { // 防止对已完成任务重复操作
            setSelectedTask(task);
            setIsModalOpen(true);
          }
        };
        ```

    2.  **提交总结**: 实现传递给模态框的 `onSubmit` 函数。
        ```jsx
        // 在 TaskList.tsx 中
        const handleSummarySubmit = async (summary) => {
          if (!selectedTask) return;

          setIsLoading(true);
          try {
            // 发送API请求
            await axios.post(`/api/tasks/${selectedTask.id}/complete`, {
              brief_content: summary,
            });

            // 更新前端状态
            // 找到任务列表中的对应任务并更新其 'completed' 状态
            // 这会让React自动重新渲染TaskCard为已完成样式
            updateTaskInList(selectedTask.id, { completed: true, completed_at: new Date() });

            setIsModalOpen(false); // 关闭模态框
            setSelectedTask(null); // 清理选中的任务
          } catch (error) {
            console.error("完成任务失败:", error);
            // (可选) 显示错误提示
          } finally {
            setIsLoading(false);
          }
        };
        ```

-   **渲染模态框**:
    ```jsx
    // 在 TaskList.tsx 的 return 语句中
    return (
      <div>
        {/* ... 渲染任务列表 ... */}
        <CompletionSummaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSummarySubmit}
          isLoading={isLoading}
        />
      </div>
    );
    ```

---

## 4. 后端实现 (Node.js/Express)

### 4.1. 数据库表结构

确保 `task_brieflogs` 表存在且结构正确。

**SQL 定义:**

```sql
CREATE TABLE IF NOT EXISTS task_brieflogs (
    debrief_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    task_id INTEGER NOT NULL,
    brief_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id INTEGER, -- 允许为 NULL
    brief_type INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

同时，确保 `tasks` 表有 `completed` (BOOLEAN) 和 `completed_at` (TIMESTAMP) 字段。

### 4.2. 创建新的 API 端点

在后端的 `tasks` 路由文件中，添加一个新的 `POST` 路由。

**路由定义 (`routes/tasks.js`):**

```javascript
// POST /api/tasks/:id/complete
router.post(
  '/:id/complete',
  authMiddleware, // 确保用户已登录
  TaskController.completeTaskWithSummary
);
```

### 4.3. 实现控制器逻辑

这是后端的核心。**必须使用数据库事务**来保证数据一致性：要么两个写操作都成功，要么都失败。

**控制器函数 (`controllers/taskController.js`):**

```javascript
const db = require('../models'); // 假设使用 Sequelize 或类似 ORM

exports.completeTaskWithSummary = async (req, res) => {
  const { id: taskId } = req.params;
  const { brief_content } = req.body;
  const userId = req.user.id; // 从 authMiddleware 获取用户ID

  // 启动一个数据库事务
  const transaction = await db.sequelize.transaction();

  try {
    // 1. 检查任务是否存在且属于该用户
    const task = await db.tasks.findOne({
      where: { id: taskId, user_id: userId },
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: "任务不存在或无权操作。" });
    }

    if (task.completed) {
        await transaction.rollback();
        return res.status(400).json({ message: "任务已经完成。" });
    }

    const completionTime = new Date();

    // 2. 在事务中创建 task_brieflogs 记录
    await db.task_brieflogs.create({
      user_id: userId,
      task_id: taskId,
      brief_content: brief_content,
      created_at: completionTime,
      session_id: null, // 规则6
      brief_type: 8      // 规则7
    }, { transaction });

    // 3. 在事务中更新 tasks 表
    await task.update({
      completed: true,
      completed_at: completionTime
    }, { transaction });

    // 4. 如果一切顺利，提交事务
    await transaction.commit();

    res.status(200).json({ message: "任务已完成并记录总结。" });

  } catch (error) {
    // 5. 如果任何一步出错，回滚事务
    await transaction.rollback();
    console.error("完成任务时发生错误:", error);
    res.status(500).json({ message: "服务器内部错误。" });
  }
};
```

---

## 5. 总结与文件清单

**需要修改/创建的文件:**

1.  **`src/components/CompletionSummaryModal.tsx`** (新文件): 独立的模态框组件。
2.  **`src/components/TaskList.tsx`** (或类似父组件): 管理模态框状态和API调用逻辑。
3.  **`src/components/TaskCard.tsx`** (或类似子组件): 添加 `onClick` 触发器，并根据 `task.completed` 状态渲染不同样式。
4.  **`backend/routes/tasks.js`**: 添加新的API路由。
5.  **`backend/controllers/taskController.js`**: 添加处理任务完成和总结记录的核心业务逻辑。
6.  **数据库迁移文件**: 如果 `task_brieflogs` 表或 `tasks` 表的字段不存在，需要创建相应的迁移脚本。
