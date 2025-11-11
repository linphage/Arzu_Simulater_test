# 403错误调试指南

## 问题描述
点击任务卡完成框后提交总结时遇到403权限错误

## 已完成的修复
1. ✅ 修改了`task.controller.ts`的`completeTask`方法
2. ✅ 添加了类型转换：将userId转换为字符串进行比较
3. ✅ 添加了详细的调试日志
4. ✅ 代码已提交并推送到GitHub

## 诊断步骤

### 1. 确认Render后端已重新部署
访问Render Dashboard检查后端服务的部署状态：
- 最新提交ID应该是: `11ed3a72`
- 部署状态应该是: Live

### 2. 检查浏览器Console的完整错误信息
打开浏览器DevTools → Console，查找：
```
🎯 点击完成框: ...
❌ 完成任务失败: ...
```

### 3. 检查Network标签页
1. 打开DevTools → Network
2. 点击完成框并提交总结
3. 找到失败的请求（状态码403）
4. 查看：
   - Request URL: 应该是 `/api/v1/tasks/{taskId}/complete`
   - Request Headers: 检查`Authorization: Bearer ...`是否存在
   - Response: 查看错误详情

### 4. 检查localStorage中的token
在Console中运行：
```javascript
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('refreshToken:', localStorage.getItem('refreshToken'));
```

### 5. 检查后端日志
在Render Dashboard查看后端日志，应该能看到：
```
收到任务完成请求: { userId: ..., taskId: ..., userIdType: ... }
权限检查: { taskUserId: ..., currentUserId: ..., ... }
```

## 可能的解决方案

### 方案1: 重新登录
如果token过期，请：
1. 退出登录
2. 重新登录
3. 再次尝试完成任务

### 方案2: 检查用户ID类型
如果后端日志显示`taskUserId !== currentUserId`，需要检查：
1. 数据库中tasks表的user_id字段类型
2. 认证中间件返回的req.user.id类型

### 方案3: 临时绕过权限检查（仅用于调试）
修改`task.controller.ts`:
```typescript
// 临时注释掉权限检查
// if (taskUserIdStr !== currentUserIdStr) {
//   throw new AuthorizationError('无权操作此任务');
// }
```

## 预期结果
修复后应该看到：
1. 前端Console: `✅ 任务完成并记录总结成功`
2. 后端日志: `任务已标记为完成`
3. 任务卡变为已完成状态（白色背景，带绿色勾选框）
4. `task_brieflogs`表中新增一条`brief_type=8`的记录
5. `tasks`表中任务的`completed=true`, `completed_at`已更新
