# 🚀 快速开始 - Render 部署

## 📚 部署文档导航

本项目提供完整的 Render 平台部署文档，请按照以下顺序阅读：

### 1️⃣ 主部署指南 (必读)
📄 **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)**

这是最详细的部署指南，包含：
- 部署架构说明
- 逐步操作指引
- 环境变量配置
- 常见问题解决
- 生产环境优化建议

⏱️ 阅读时间: 15-20 分钟

---

### 2️⃣ 部署检查清单 (推荐打印)
📋 **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**

可打印的检查清单，逐项勾选确保不遗漏：
- ✅ 准备工作检查
- ✅ 后端部署步骤
- ✅ 前端部署步骤
- ✅ 集成测试验证
- ✅ 发布给测试用户

⏱️ 部署时间: 30-45 分钟

---

### 3️⃣ 环境变量模板
🔐 **[.env.template](./.env.template)**

完整的环境变量配置模板，包含：
- 后端环境变量 (10+ 个)
- 前端环境变量 (3+ 个)
- 安全提示和注意事项
- 本地开发环境配置

---

### 4️⃣ 自动化部署配置 (可选)
⚙️ **[render.yaml](./render.yaml)**

Render 平台的 Infrastructure as Code 配置文件，支持：
- 一键部署前后端服务
- 自动配置环境变量
- 自动挂载持久化磁盘
- Git push 自动部署

---

## ⚡ 快速部署流程

### 前置要求
- ✅ 已注册 Render 账号 (https://render.com)
- ✅ 代码已推送到 GitHub/GitLab
- ✅ Node.js >= 18 (本地测试用)

### 三步部署

```bash
# 步骤 1: 生成 JWT 密钥
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# 或 Linux/Mac
openssl rand -base64 48
```

```bash
# 步骤 2: 在 Render 创建服务
# 1. 后端 Web Service
#    - Root Directory: Arzu_simulator_back
#    - Build: npm install && npm run build
#    - Start: npm start
#    - 添加环境变量 (参考 .env.template)
#    - 添加 Disk: /var/data (1GB)
#
# 2. 前端 Static Site
#    - Root Directory: Arzu_simulator_front
#    - Build: npm install && npm run build
#    - Publish: dist
#    - 添加 VITE_API_URL 环境变量
#    - 配置重定向: /* → /index.html
```

```bash
# 步骤 3: 测试验证
# 访问后端健康检查
curl https://你的后端URL.onrender.com/health

# 访问前端应用
# 在浏览器打开: https://你的前端URL.onrender.com
```

---

## 📊 部署架构一览

```
                     互联网用户
                         ↓
              ┌──────────────────────┐
              │   Render CDN + SSL   │
              └──────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
┌─────────────────┐            ┌─────────────────┐
│  Static Site    │    API     │  Web Service    │
│  (前端)         │───────────→│  (后端)         │
│                 │            │                 │
│  React + Vite   │            │  Node.js        │
│                 │            │  Express        │
└─────────────────┘            └─────────────────┘
                                        ↓
                               ┌─────────────────┐
                               │ Persistent Disk │
                               │  SQLite 数据库  │
                               │  /var/data      │
                               └─────────────────┘
```

---

## 💰 费用说明

| 服务类型 | 配置 | 费用 |
|---------|------|------|
| **前端 Static Site** | 全球 CDN + HTTPS | **免费** ✅ |
| **后端 Web Service** | 512MB RAM, 共享 CPU | **免费** ✅ (有休眠) |
| **后端 Web Service** | 512MB RAM, 不休眠 | **$7/月** |
| **Persistent Disk** | 1GB | **免费** ✅ |
| **自定义域名** | SSL 证书 | **免费** ✅ |

**推荐配置**:
- 测试阶段: 全部使用免费套餐 ($0/月)
- 生产环境: 后端升级到 Starter ($7/月)

---

## 🐛 常见问题速查

### Q1: 部署后无法访问？
**A**: 检查 Build 日志，确认构建成功。常见原因：
- Node.js 版本不匹配 (Render 使用 Node 18)
- 依赖安装失败 (检查 package.json)
- 构建命令错误

### Q2: 前端连接后端失败？
**A**: 检查 CORS 配置：
```bash
# 后端环境变量
CORS_ORIGIN=https://你的前端域名.onrender.com

# 前端环境变量
VITE_API_URL=https://你的后端域名.onrender.com
```

### Q3: 数据库数据丢失？
**A**: 确认持久化磁盘配置：
- Disk 已添加: `/var/data` (1GB)
- 环境变量: `DATABASE_PATH=/var/data/database.db`

### Q4: 免费套餐服务很慢？
**A**: 免费套餐会休眠，首次访问需要 15 秒启动。
- 解决方案1: 使用 UptimeRobot 每 5 分钟 ping 一次
- 解决方案2: 升级到 Starter ($7/月)

---

## 📞 需要帮助？

- 📖 详细指南: [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)
- ✅ 检查清单: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- 📚 Render 官方文档: https://render.com/docs
- 🐛 提交问题: 在 GitHub Issues 中提问

---

**准备好了吗？立即开始部署！** 🚀

1. 打开 [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)
2. 按照步骤操作
3. 使用 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 逐项检查

**祝你部署顺利！** 🎉
