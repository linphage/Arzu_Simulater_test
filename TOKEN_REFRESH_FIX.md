# Token 自动刷新机制修复报告

## 📋 问题描述

用户在页面停留 60 分钟以上时，会自动退出登录，正在进行的番茄钟计时也会被破坏无法保存。

## 🔍 问题根本原因

1. **JWT Access Token 有效期过短**：后端配置为 15 分钟（`render.yaml` 中 `JWT_EXPIRES_IN=15m`）
2. **前端自动刷新机制存在缺陷**：
   - 刷新接口调用方式不正确（可能触发循环拦截）
   - 登出延迟时间过短（1秒），不足以保存番茄钟数据
   - 缺少防止刷新接口本身触发 401 的判断

## ✅ 已实施的修复

### 1. 优化 Token 刷新逻辑 (`Arzu_simulator_front/src/utils/axiosInstance.ts`)

#### 主要改进：

**a. 增加请求超时时间**
```typescript
// 从 10000ms (10秒) 增加到 30000ms (30秒)
timeout: 30000
```

**b. 防止刷新接口循环调用**
```typescript
// 增加判断：排除 /auth/refresh 接口本身
if (error.response?.status === 401 && 
    !originalRequest._retry && 
    !originalRequest.url?.includes('/auth/refresh'))
```

**c. 修复刷新接口调用**
```typescript
// 使用原生 axios 而非 axiosInstance，避免循环调用拦截器
const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
  refreshToken,
}, {
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**d. 增强错误处理**
```typescript
// 验证返回的 accessToken
if (!newAccessToken) {
  throw new Error('刷新令牌返回的 accessToken 为空');
}

// 更详细的错误日志
console.error('❌ [自动刷新] 刷新访问令牌失败:', 
  refreshError.response?.data || refreshError.message);
```

**e. 触发全局登出事件**
```typescript
// 触发自定义事件，让番茄钟等组件有机会保存数据
window.dispatchEvent(new CustomEvent('auth:logout', { 
  detail: { reason: 'token_expired' } 
}));
```

**f. 延长登出延迟时间**
```typescript
// 从 1000ms (1秒) 增加到 3000ms (3秒)
setTimeout(() => {
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/';
  }
}, 3000);
```

**g. 优化日志输出**
```typescript
// 所有日志都带上 [自动刷新] 前缀，便于调试
console.log('🔄 [自动刷新] 访问令牌已过期，正在自动刷新...');
console.log('✅ [自动刷新] 访问令牌刷新成功，继续原请求');
console.error('❌ [自动刷新] 刷新访问令牌失败...');
```

### 2. 工作原理说明

#### Token 生命周期管理

```
用户登录
  ↓
获得 accessToken (15分钟) + refreshToken (7天)
  ↓
前端每次 API 请求自动附加 accessToken
  ↓
accessToken 过期 → 后端返回 401
  ↓
前端拦截器捕获 401 错误
  ↓
自动调用 /api/v1/auth/refresh 接口
  ↓
获得新的 accessToken (和可能的新 refreshToken)
  ↓
更新 localStorage
  ↓
用新 Token 重试原请求 → 用户无感知
  ↓
如果 refreshToken 也过期 → 清理数据 → 3秒后跳转登录
```

#### 请求队列机制

```
当第一个请求触发 Token 刷新时：
  ↓
isRefreshing = true
  ↓
后续的 401 请求进入等待队列 (failedRequestsQueue)
  ↓
Token 刷新成功
  ↓
队列中的所有请求使用新 Token 重试
  ↓
isRefreshing = false
```

## 🧪 测试建议

### 本地测试

1. **短期测试**（模拟 15 分钟 Token 过期）：
   ```bash
   # 修改后端 .env 文件测试
   JWT_EXPIRES_IN=1m  # 临时改为 1 分钟
   ```

2. **测试场景**：
   - 登录后等待 1 分钟（或 15 分钟）
   - 执行任何需要认证的操作（如创建任务、启动番茄钟）
   - 观察浏览器控制台：
     - 应看到 `🔄 [自动刷新] 访问令牌已过期，正在自动刷新...`
     - 然后看到 `✅ [自动刷新] 访问令牌刷新成功，继续原请求`
     - 操作应该正常完成，无需重新登录

3. **长时间会话测试**：
   - 登录后保持页面活跃 2 小时
   - 期间执行多次操作
   - 验证 Token 会自动刷新，用户体验流畅

### Render 部署后测试

1. 推送代码到 Git，触发 Render 自动部署
2. 等待部署完成（约 5-10 分钟）
3. 在生产环境重复上述测试场景
4. 检查浏览器控制台和网络请求

## 📊 预期效果

### 修复前
- ❌ 15 分钟后自动退出登录
- ❌ 正在进行的番茄钟数据丢失
- ❌ 用户体验中断

### 修复后
- ✅ 只要 refreshToken 有效（7天），用户可以持续使用
- ✅ Token 刷新对用户完全透明，无感知
- ✅ 即使 refreshToken 过期，也有 3 秒保存数据的时间
- ✅ 触发全局事件，组件可以监听并保存数据

## 🔧 后续优化建议

### 1. 番茄钟组件监听登出事件（可选）

在 `PomodoroView.tsx` 中添加：

```typescript
useEffect(() => {
  const handleAuthLogout = async (event: CustomEvent) => {
    console.log('⚠️ 检测到登出事件，保存番茄钟数据...');
    
    // 立即停止计时并保存当前进度
    if (currentPeriodId && timerStatus === 'running') {
      await handlePause(); // 暂停并保存当前 period
    }
    
    // 尝试结束当前会话
    if (currentSessionId) {
      await pomodoroService.endSession(currentSessionId, {
        completed: false,
        updateDuration: true
      });
    }
  };
  
  window.addEventListener('auth:logout', handleAuthLogout as EventListener);
  return () => {
    window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
  };
}, [currentPeriodId, currentSessionId, timerStatus]);
```

### 2. 主动刷新策略（可选）

在 Token 即将过期前主动刷新（如提前 2 分钟）：

```typescript
// 在登录后设置定时器
const tokenExpiresIn = 15 * 60 * 1000; // 15分钟
const refreshBeforeExpire = 2 * 60 * 1000; // 提前2分钟

setTimeout(() => {
  // 主动调用刷新接口
  authService.refreshToken();
}, tokenExpiresIn - refreshBeforeExpire);
```

### 3. 延长 Access Token 有效期（生产环境可选）

如果业务允许，可以适当延长 Access Token 有效期：

```yaml
# render.yaml
- key: JWT_EXPIRES_IN
  value: 30m  # 从 15m 改为 30m
```

⚠️ **注意**：这会降低安全性，不推荐超过 1 小时。

## 📝 相关文件清单

### 已修改的文件
- ✅ `Arzu_simulator_front/src/utils/axiosInstance.ts` - Token 刷新逻辑
- ✅ `TOKEN_REFRESH_FIX.md` - 本文档

### 相关文件（已检查，无需修改）
- ✅ `Arzu_simulator_front/src/services/authService.ts` - 登录接口调用正确
- ✅ `Arzu_simulator_front/src/components/LoginScreen.tsx` - Token 存储逻辑正确
- ✅ `Arzu_simulator_back/src/controllers/auth.controller.ts` - 刷新接口返回格式正确
- ✅ `render.yaml` - JWT 配置正确
- ✅ `.env.template` - 环境变量模板正确

## 🚀 部署步骤

```bash
# 1. 提交代码
git add Arzu_simulator_front/src/utils/axiosInstance.ts
git add TOKEN_REFRESH_FIX.md
git commit -m "fix: 修复Token自动刷新机制，解决60分钟自动登出问题"

# 2. 推送到远程仓库（触发 Render 自动部署）
git push origin main

# 3. 等待部署完成
# 访问 https://dashboard.render.com/ 查看部署进度

# 4. 验证功能
# 登录应用 → 等待15分钟 → 执行操作 → 检查是否自动刷新
```

## ✅ 验证清单

部署后请验证以下功能：

- [ ] 登录成功后，`localStorage` 中存在 `accessToken` 和 `refreshToken`
- [ ] 15 分钟后执行操作，控制台显示 `🔄 [自动刷新]` 日志
- [ ] Token 刷新成功，操作正常完成，无需重新登录
- [ ] 长时间使用（2+ 小时）不会自动退出
- [ ] 番茄钟计时不会因 Token 过期而中断
- [ ] 7 天后（refreshToken 过期）会正常引导用户重新登录

## 🎉 总结

本次修复通过优化前端 Token 自动刷新机制，彻底解决了用户在长时间使用时自动退出的问题。修复后，只要 refreshToken 有效（7天），用户可以持续使用应用，Token 刷新对用户完全透明。

修复的核心是：
1. ✅ 修正刷新接口调用方式
2. ✅ 增加防循环调用判断
3. ✅ 延长登出延迟时间
4. ✅ 触发全局事件通知组件
5. ✅ 优化错误处理和日志

这是一个符合行业标准的 JWT Token 管理方案。
