# 🚀 Arzu Simulator - Render 平台完整部署指南

## 📋 目录

1. [部署架构说明](#部署架构说明)
2. [准备工作](#准备工作)
3. [后端部署 (Web Service)](#后端部署)
4. [前端部署 (Static Site)](#前端部署)
5. [数据库配置](#数据库配置)
6. [环境变量配置](#环境变量配置)
7. [部署后验证](#部署后验证)
8. [常见问题解决](#常见问题解决)
9. [生产环境优化](#生产环境优化)

---

## 🏗️ 部署架构说明

### 推荐的 Render 部署方案

根据你的项目架构（前后端分离 + SQLite数据库），最适合的部署方案是：

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Render 平台部署架构                            │
│                                                 │
│  ┌─────────────────┐     ┌──────────────────┐ │
│  │  Static Site    │────▶│  Web Service      │ │
│  │  (前端)         │     │  (后端API)        │ │
│  │  React + Vite   │ API │  Node.js + SQLite │ │
│  └─────────────────┘     └──────────────────┘ │
│         │                        │             │
│         │                        ▼             │
│         │                ┌──────────────────┐ │
│         │                │ Persistent Disk  │ │
│         │                │ (SQLite 数据库)  │ │
│         │                └──────────────────┘ │
│         │                                      │
│         └──────── HTTPS 访问 ─────────────────│
│                                                 │
└─────────────────────────────────────────────────┘
```

### 为什么选择这个方案？

✅ **前端静态托管** - 免费，CDN加速，高性能  
✅ **后端Web服务** - 支持Node.js，可挂载持久化存储  
✅ **持久化磁盘** - SQLite数据不会丢失  
✅ **HTTPS自动证书** - 免费SSL，安全可靠  
✅ **自动部署** - Git push自动触发部署  

### 费用说明

- **前端 Static Site**: 完全免费 ✅
- **后端 Web Service**: 免费套餐(512MB RAM) 或 付费套餐($7/月起)
- **Persistent Disk**: 1GB 免费，$0.25/GB/月

---

## 📦 准备工作

### 1. 注册 Render 账号

访问 https://render.com 并注册账号（推荐使用 GitHub 账号登录）

### 2. 准备 Git 仓库

你的代码需要托管在 Git 平台（GitHub/GitLab/Bitbucket）

**检查你的代码是否已推送到远程仓库：**

```bash
cd C:\Users\Amber\Desktop\Arzu_Simulater_test_backup
git remote -v
```

如果没有远程仓库，请先创建：

#### 方法A：使用 GitHub（推荐）

1. 在 GitHub 创建新仓库：https://github.com/new
2. 推送代码：

```bash
git remote add origin https://github.com/你的用户名/arzu-simulator.git
git branch -M main
git push -u origin main
```

#### 方法B：使用 GitLab

1. 在 GitLab 创建新项目：https://gitlab.com/projects/new
2. 推送代码（命令类似）

### 3. 检查必要文件

确保以下文件存在且配置正确：

- ✅ `Arzu_simulator_back/package.json` - 后端依赖
- ✅ `Arzu_simulator_back/tsconfig.json` - TypeScript配置
- ✅ `Arzu_simulator_front/package.json` - 前端依赖
- ✅ `Arzu_simulator_front/vite.config.ts` - Vite配置

---

## 🔧 后端部署 (Web Service)

### 步骤 1: 创建 Web Service

1. 登录 Render Dashboard: https://dashboard.render.com
2. 点击 **"New +"** → 选择 **"Web Service"**
3. 连接你的 Git 仓库（授权 Render 访问）
4. 选择 `Arzu_Simulater_test_backup` 仓库

### 步骤 2: 配置 Web Service

填写以下配置：

| 配置项 | 值 |
|--------|-----|
| **Name** | `arzu-simulator-backend` (或你喜欢的名字) |
| **Region** | `Oregon (US West)` 或 `Singapore` (推荐选新加坡，离中国近) |
| **Branch** | `main` |
| **Root Directory** | `Arzu_simulator_back` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (免费套餐) 或 `Starter` ($7/月，更稳定) |

### 步骤 3: 添加环境变量

在 **Environment Variables** 部分，点击 **"Add Environment Variable"**，添加以下变量：

```bash
# 必需变量
NODE_ENV=production
PORT=3001

# JWT 密钥（重要：生成强密钥）
JWT_SECRET=你的超长随机密钥_至少32位_请修改此值
JWT_REFRESH_SECRET=你的另一个超长随机密钥_至少32位_请修改此值

# JWT 过期时间
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 数据库路径（挂载持久化磁盘后会用到）
DATABASE_PATH=/var/data/database.db

# CORS 允许的前端域名（稍后填写前端URL）
CORS_ORIGIN=https://你的前端域名.onrender.com

# 日志级别
LOG_LEVEL=info
```

**如何生成强密钥？**

在本地运行以下命令（Windows PowerShell）：

```powershell
# 生成 JWT_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# 生成 JWT_REFRESH_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

或者在 Git Bash / Linux / Mac：

```bash
openssl rand -base64 48
```

### 步骤 4: 添加持久化磁盘（重要！）

**为什么需要？** SQLite 数据库文件需要持久化存储，否则每次重启数据会丢失。

1. 在 Web Service 配置页，找到 **"Disks"** 部分
2. 点击 **"Add Disk"**
3. 配置：
   - **Name**: `arzu-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (免费)
4. 点击 **"Save"**

### 步骤 5: 创建并部署

1. 点击 **"Create Web Service"**
2. Render 会自动开始构建和部署
3. 等待 5-10 分钟，直到显示 **"Live"** 状态

### 步骤 6: 获取后端 URL

部署成功后，你会看到类似的 URL：

```
https://arzu-simulator-backend.onrender.com
```

**记下这个 URL，稍后配置前端时会用到！**

### 步骤 7: 测试后端 API

打开浏览器访问：

```
https://你的后端URL.onrender.com/health
```

应该看到：

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-10-29T...",
  "memory": {...},
  "environment": "production"
}
```

---

## 🎨 前端部署 (Static Site)

### 步骤 1: 创建 Static Site

1. 回到 Render Dashboard
2. 点击 **"New +"** → 选择 **"Static Site"**
3. 选择同一个 Git 仓库

### 步骤 2: 配置 Static Site

| 配置项 | 值 |
|--------|-----|
| **Name** | `arzu-simulator-frontend` |
| **Branch** | `main` |
| **Root Directory** | `Arzu_simulator_front` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 步骤 3: 添加环境变量

在 **Environment Variables** 部分添加：

```bash
# 后端 API 地址（填写上一步获取的后端URL）
VITE_API_URL=https://你的后端URL.onrender.com
```

### 步骤 4: 配置重定向规则（重要！）

**为什么需要？** React 单页应用需要所有路由都指向 `index.html`

1. 在 **Redirects/Rewrites** 部分，点击 **"Add Rule"**
2. 添加规则：
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
3. 点击 **"Save"**

### 步骤 5: 创建并部署

1. 点击 **"Create Static Site"**
2. 等待构建完成（约 3-5 分钟）
3. 部署成功后会显示前端 URL，例如：

```
https://arzu-simulator-frontend.onrender.com
```

### 步骤 6: 更新后端 CORS 配置

**重要！** 回到后端 Web Service，更新环境变量：

```bash
CORS_ORIGIN=https://你的前端URL.onrender.com
```

保存后，后端会自动重启。

### 步骤 7: 测试前端访问

打开浏览器访问前端 URL，应该能看到登录页面。

---

## 🗄️ 数据库配置

### 初始化数据库

后端首次启动时会自动检查数据库结构。但为了确保正确初始化：

#### 方法 1: 通过 Shell 访问（推荐）

1. 在后端 Web Service 页面，点击右上角的 **"Shell"** 标签
2. 进入 Shell 后，运行：

```bash
cd /var/data
ls -la  # 检查是否有 database.db 文件

# 如果没有，手动触发初始化
node dist/database/init.js
```

#### 方法 2: 使用迁移脚本

如果你的项目有迁移脚本（`scripts/run-migration.js`），可以运行：

```bash
node scripts/run-migration.js
```

### 数据库备份

**重要提示：** 定期备份数据库！

1. 在 Shell 中运行：

```bash
cp /var/data/database.db /var/data/database_backup_$(date +%Y%m%d).db
```

2. 或者使用 Render 的 Disk Snapshot 功能（付费功能）

---

## ⚙️ 环境变量配置完整清单

### 后端环境变量 (Web Service)

```bash
# === 必需变量 ===
NODE_ENV=production
PORT=3001

# === JWT 配置 ===
JWT_SECRET=<生成64位随机字符串>
JWT_REFRESH_SECRET=<生成64位随机字符串>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# === 数据库配置 ===
DATABASE_PATH=/var/data/database.db

# === CORS 配置 ===
CORS_ORIGIN=https://你的前端域名.onrender.com

# === 日志配置 ===
LOG_LEVEL=info

# === 可选：Bcrypt 配置 ===
BCRYPT_ROUNDS=10

# === 可选：服务器配置 ===
SERVER_TIMEOUT=30000
```

### 前端环境变量 (Static Site)

```bash
# === API 配置 ===
VITE_API_URL=https://你的后端域名.onrender.com

# === 可选：应用配置 ===
VITE_APP_NAME=Arzu Simulator
VITE_APP_VERSION=1.0.0
```

---

## ✅ 部署后验证

### 1. 健康检查

**后端健康检查：**

```bash
curl https://你的后端URL.onrender.com/health
```

预期响应：

```json
{
  "status": "healthy",
  "uptime": 456.789,
  "timestamp": "2025-10-29T...",
  "environment": "production"
}
```

**API 文档检查：**

```bash
curl https://你的后端URL.onrender.com/api/docs
```

### 2. 用户注册测试

使用 Postman 或 curl 测试注册：

```bash
curl -X POST https://你的后端URL.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "mail": "test@example.com",
    "password": "Test123!@#"
  }'
```

预期响应：

```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "userId": 1,
    "username": "testuser",
    "mail": "test@example.com"
  }
}
```

### 3. 用户登录测试

```bash
curl -X POST https://你的后端URL.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

预期响应：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### 4. 前端功能测试

1. 访问前端 URL
2. 使用测试账号登录
3. 创建一个测试任务
4. 启动番茄钟计时
5. 完成任务，检查统计数据

### 5. 数据持久化测试

1. 创建几个任务
2. 在 Render 后端 Dashboard 点击 **"Manual Deploy"** → **"Clear build cache & deploy"**（强制重启）
3. 重启后，检查数据是否还在

---

## 🐛 常见问题解决

### 问题 1: 后端构建失败

**错误信息：** `Error: Cannot find module 'typescript'`

**解决方法：**

检查 `package.json` 的 `devDependencies`，确保包含：

```json
{
  "devDependencies": {
    "typescript": "^5.9.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

然后在 Render 设置中，将 Build Command 改为：

```bash
npm install --include=dev && npm run build
```

### 问题 2: 前端无法连接后端

**错误信息：** `CORS policy: No 'Access-Control-Allow-Origin' header`

**解决方法：**

1. 确认后端环境变量 `CORS_ORIGIN` 设置正确
2. 检查前端环境变量 `VITE_API_URL` 是否正确
3. 检查后端 `src/server.ts` 的 CORS 配置：

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 问题 3: 数据库数据丢失

**原因：** 没有挂载持久化磁盘

**解决方法：**

1. 确认已添加 Disk（参考 [后端部署步骤4](#步骤-4-添加持久化磁盘重要)）
2. 检查环境变量 `DATABASE_PATH=/var/data/database.db`
3. 确认后端代码中数据库路径使用了环境变量：

```typescript
// src/database/connection.ts
const dbPath = process.env.DATABASE_PATH || './database.db';
```

### 问题 4: 免费套餐服务休眠

**现象：** 首次访问很慢（15秒以上）

**原因：** Render 免费套餐在 15 分钟无请求后会休眠

**解决方法：**

#### 方法 A: 使用 Uptime 监控服务（推荐）

1. 注册 https://uptimerobot.com （免费）
2. 添加监控：
   - URL: `https://你的后端URL.onrender.com/health`
   - 监控间隔: 5 分钟
   - 监控类型: HTTP(s)

#### 方法 B: 升级到付费套餐

- Starter: $7/月，永不休眠
- 更稳定，推荐生产环境使用

### 问题 5: 前端路由 404 错误

**现象：** 刷新页面后显示 404

**原因：** 没有配置重定向规则

**解决方法：**

参考 [前端部署步骤4](#步骤-4-配置重定向规则重要) 配置 Rewrite 规则。

### 问题 6: 环境变量未生效

**解决方法：**

1. 修改环境变量后，点击 **"Save Changes"**
2. Render 会自动重启服务
3. 等待重启完成（约 1-2 分钟）
4. 在 Shell 中验证：

```bash
echo $JWT_SECRET
echo $DATABASE_PATH
```

---

## 🚀 生产环境优化

### 1. 性能优化

#### 后端优化

**添加构建缓存：**

在 `Arzu_simulator_back` 目录创建 `.buildcache` 文件：

```bash
node_modules/
dist/
.env
*.log
```

**优化构建命令：**

```bash
npm ci --only=production && npm run build
```

#### 前端优化

**Vite 构建优化：**

在 `vite.config.ts` 添加：

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true  // 移除 console.log
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    }
  }
});
```

### 2. 日志管理

**配置 Winston 日志输出：**

修改 `src/config/logger.ts`，确保生产环境日志输出到 stdout：

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

在 Render Dashboard 可以查看实时日志：**Logs** 标签。

### 3. 自定义域名（可选）

如果你有自己的域名：

#### 后端自定义域名

1. 在后端 Web Service 页面，点击 **"Settings"** → **"Custom Domain"**
2. 添加域名，例如 `api.yourdomain.com`
3. 在你的 DNS 提供商添加 CNAME 记录：
   ```
   api.yourdomain.com  →  arzu-simulator-backend.onrender.com
   ```
4. 等待 DNS 生效（最多 48 小时）
5. Render 会自动签发 SSL 证书

#### 前端自定义域名

1. 在前端 Static Site 页面，点击 **"Settings"** → **"Custom Domain"**
2. 添加域名，例如 `app.yourdomain.com`
3. 添加 CNAME 记录：
   ```
   app.yourdomain.com  →  arzu-simulator-frontend.onrender.com
   ```

**更新环境变量：**

- 后端 `CORS_ORIGIN=https://app.yourdomain.com`
- 前端 `VITE_API_URL=https://api.yourdomain.com`

### 4. 自动部署配置

**使用 `render.yaml` 实现一键部署：**

在项目根目录创建 `render.yaml`（参考下一节的配置文件）。

推送到 Git 后，Render 会自动识别并部署。

### 5. 监控与告警

**Render 内置监控：**

- CPU 使用率
- 内存使用率
- 磁盘使用率
- HTTP 请求统计

**配置告警：**

1. 在 Dashboard 点击 **"Notifications"**
2. 添加邮箱或 Slack Webhook
3. 设置告警条件（服务宕机、内存超限等）

---

## 📝 快速部署检查清单

在正式部署前，请确认：

### 准备阶段

- [ ] 代码已推送到 GitHub/GitLab
- [ ] 已注册 Render 账号
- [ ] 已生成 JWT 密钥（64位随机字符串）

### 后端部署

- [ ] 创建 Web Service
- [ ] 配置 Root Directory: `Arzu_simulator_back`
- [ ] 添加所有环境变量（至少 7 个）
- [ ] 添加 Disk: `/var/data` (1GB)
- [ ] 部署状态显示 "Live"
- [ ] 健康检查 `/health` 返回正常

### 前端部署

- [ ] 创建 Static Site
- [ ] 配置 Root Directory: `Arzu_simulator_front`
- [ ] 添加 `VITE_API_URL` 环境变量
- [ ] 配置重定向规则: `/* → /index.html`
- [ ] 部署状态显示 "Live"
- [ ] 能访问登录页面

### 集成测试

- [ ] 更新后端 `CORS_ORIGIN` 为前端 URL
- [ ] 前端能成功注册新用户
- [ ] 前端能成功登录
- [ ] 能创建、编辑、删除任务
- [ ] 番茄钟功能正常
- [ ] 重启后数据不丢失

---

## 🎉 部署完成！

恭喜你成功部署了 Arzu Simulator！

**最终访问地址：**

- 前端：`https://你的前端域名.onrender.com`
- 后端：`https://你的后端域名.onrender.com`

**下一步建议：**

1. 创建测试用户账号
2. 邀请用户试用
3. 监控日志和性能指标
4. 定期备份数据库
5. 根据用户反馈迭代功能

**需要帮助？**

- Render 官方文档：https://render.com/docs
- 项目 Issue：在你的 GitHub 仓库提 Issue

---

**文档版本：** v1.0  
**最后更新：** 2025-10-29  
**作者：** Claude Code Assistant
