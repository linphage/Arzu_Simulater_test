# 📋 Arzu Simulator - Render 部署检查清单

> **打印此页面并逐项勾选，确保部署顺利！**

---

## ✅ 第一阶段：准备工作

### Git 仓库准备

- [ ] 代码已提交到本地 Git 仓库
  ```bash
  git status  # 检查状态
  git add .
  git commit -m "准备部署到 Render"
  ```

- [ ] 已创建 GitHub/GitLab 远程仓库
  - 仓库地址: ___________________________________

- [ ] 代码已推送到远程仓库
  ```bash
  git remote add origin <你的仓库地址>
  git push -u origin main
  ```

### 密钥生成

- [ ] 已生成 JWT_SECRET
  ```powershell
  # PowerShell 执行
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
  ```
  **JWT_SECRET**: ___________________________________

- [ ] 已生成 JWT_REFRESH_SECRET (必须与JWT_SECRET不同)
  **JWT_REFRESH_SECRET**: ___________________________________

### Render 账号

- [ ] 已注册 Render 账号 (https://render.com)
- [ ] 已绑定 GitHub/GitLab 账号
- [ ] 账号邮箱: ___________________________________

---

## ✅ 第二阶段：后端部署

### 创建 Web Service

- [ ] 登录 Render Dashboard
- [ ] 点击 "New +" → "Web Service"
- [ ] 选择 `Arzu_Simulater_test_backup` 仓库
- [ ] 授权 Render 访问仓库

### 基础配置

- [ ] **Name**: `arzu-simulator-backend` (或自定义名称)
  - 实际名称: ___________________________________

- [ ] **Region**: `Singapore` 或 `Oregon`
  - 选择的区域: ___________________________________

- [ ] **Branch**: `main`

- [ ] **Root Directory**: `Arzu_simulator_back`

- [ ] **Runtime**: `Node`

- [ ] **Build Command**: `npm install && npm run build`

- [ ] **Start Command**: `npm start`

- [ ] **Instance Type**: `Free` 或 `Starter`

### 环境变量配置

逐项添加以下环境变量 (在 Environment Variables 部分)：

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `JWT_SECRET` = *(使用上面生成的值)*
- [ ] `JWT_REFRESH_SECRET` = *(使用上面生成的值)*
- [ ] `JWT_EXPIRES_IN` = `15m`
- [ ] `JWT_REFRESH_EXPIRES_IN` = `7d`
- [ ] `DATABASE_PATH` = `/var/data/database.db`
- [ ] `CORS_ORIGIN` = `https://你的前端域名.onrender.com` *(稍后更新)*
- [ ] `LOG_LEVEL` = `info`
- [ ] `BCRYPT_ROUNDS` = `10`

### 持久化磁盘

- [ ] 点击 "Add Disk" 按钮
- [ ] **Name**: `arzu-data`
- [ ] **Mount Path**: `/var/data`
- [ ] **Size**: `1 GB`
- [ ] 点击 "Save"

### 部署

- [ ] 点击 "Create Web Service"
- [ ] 等待构建完成 (约 5-10 分钟)
- [ ] 部署状态显示 "Live"
- [ ] 复制后端 URL: ___________________________________

### 后端测试

- [ ] 访问健康检查: `https://你的后端URL/health`
  - 预期: 返回 JSON `{"status": "healthy", ...}`

- [ ] 访问 API 文档: `https://你的后端URL/api/docs`
  - 预期: 返回 API 文档 JSON

---

## ✅ 第三阶段：前端部署

### 创建 Static Site

- [ ] 回到 Render Dashboard
- [ ] 点击 "New +" → "Static Site"
- [ ] 选择同一个仓库

### 基础配置

- [ ] **Name**: `arzu-simulator-frontend` (或自定义名称)
  - 实际名称: ___________________________________

- [ ] **Branch**: `main`

- [ ] **Root Directory**: `Arzu_simulator_front`

- [ ] **Build Command**: `npm install && npm run build`

- [ ] **Publish Directory**: `dist`

### 环境变量配置

- [ ] `VITE_API_URL` = *(填写上面复制的后端 URL)*
- [ ] `VITE_APP_NAME` = `Arzu Simulator`
- [ ] `VITE_APP_VERSION` = `1.0.0`

### 重定向规则配置

- [ ] 在 Redirects/Rewrites 部分，点击 "Add Rule"
- [ ] **Source**: `/*`
- [ ] **Destination**: `/index.html`
- [ ] **Action**: `Rewrite`
- [ ] 点击 "Save"

### 部署

- [ ] 点击 "Create Static Site"
- [ ] 等待构建完成 (约 3-5 分钟)
- [ ] 部署状态显示 "Live"
- [ ] 复制前端 URL: ___________________________________

---

## ✅ 第四阶段：集成配置

### 更新后端 CORS

- [ ] 回到后端 Web Service 页面
- [ ] 点击 "Environment" 标签
- [ ] 找到 `CORS_ORIGIN` 变量
- [ ] 更新值为: *(上面复制的前端 URL)*
- [ ] 点击 "Save Changes"
- [ ] 等待后端自动重启 (约 1-2 分钟)

---

## ✅ 第五阶段：功能测试

### 基础功能测试

- [ ] 访问前端 URL，能看到登录页面
- [ ] 点击"注册"，创建测试账号
  - 用户名: ___________________________________
  - 邮箱: ___________________________________
  - 密码: ___________________________________ (保密)
- [ ] 使用测试账号登录成功
- [ ] 能看到首页（空任务列表）

### 任务功能测试

- [ ] 创建一个测试任务
  - 任务标题: ___________________________________
  - 类别: 勤政/恕己/爱人
  - 优先级: 金/银/铜/石
- [ ] 任务显示在列表中
- [ ] 编辑任务信息成功
- [ ] 删除任务 (填写删除原因) 成功

### 番茄钟功能测试

- [ ] 创建一个带 DDL 的任务
- [ ] 点击任务，进入番茄钟页面
- [ ] 选择时长 (5/15/25/45 分钟)
- [ ] 点击"开始"，计时器开始倒计时
- [ ] 完成或放弃番茄钟
- [ ] 返回首页，检查任务状态更新

### 数据持久化测试

- [ ] 创建 3-5 个测试任务
- [ ] 回到后端 Web Service 页面
- [ ] 点击右上角 "Manual Deploy" → "Clear build cache & deploy"
- [ ] 等待重启完成
- [ ] 刷新前端页面，登录
- [ ] **验证**: 之前创建的任务仍然存在

---

## ✅ 第六阶段：生产环境优化 (可选)

### 防止免费套餐休眠

- [ ] 注册 UptimeRobot (https://uptimerobot.com)
- [ ] 添加监控: `https://你的后端URL/health`
- [ ] 监控间隔: 5 分钟

### 自定义域名 (可选)

- [ ] 购买域名: ___________________________________
- [ ] 后端自定义域名: `api.你的域名.com`
  - [ ] 在 Render 添加自定义域名
  - [ ] 在 DNS 添加 CNAME 记录
  - [ ] 等待 SSL 证书签发
- [ ] 前端自定义域名: `app.你的域名.com`
  - [ ] 在 Render 添加自定义域名
  - [ ] 在 DNS 添加 CNAME 记录
- [ ] 更新环境变量中的域名

### 监控与告警

- [ ] 在 Render 配置邮件告警
- [ ] 测试告警是否正常工作

---

## ✅ 第七阶段：发布给测试用户

### 准备测试说明

- [ ] 创建测试用户指南
  - 访问地址: ___________________________________
  - 测试账号 (可选): ___________________________________
  - 功能说明: ___________________________________

### 发布

- [ ] 通过邮件/聊天工具发送测试链接
- [ ] 收集用户反馈
- [ ] 监控系统日志
- [ ] 记录问题和建议: ___________________________________

---

## 📊 部署信息汇总

| 项目 | 值 |
|------|-----|
| **后端 URL** | _____________________________________ |
| **前端 URL** | _____________________________________ |
| **后端 Render 服务名** | _____________________________________ |
| **前端 Render 服务名** | _____________________________________ |
| **Git 仓库地址** | _____________________________________ |
| **数据库路径** | `/var/data/database.db` |
| **部署日期** | _____________________________________ |
| **部署人员** | _____________________________________ |

---

## 🆘 常见问题快速参考

### 后端无法访问
1. 检查 Web Service 状态是否为 "Live"
2. 查看 Logs 标签，检查错误日志
3. 验证环境变量是否正确设置

### 前端无法连接后端
1. 检查 `VITE_API_URL` 是否正确
2. 检查后端 `CORS_ORIGIN` 是否正确
3. 在浏览器控制台检查网络请求

### 数据丢失
1. 确认已添加 Disk 且路径为 `/var/data`
2. 检查 `DATABASE_PATH` 环境变量
3. 在 Shell 中运行 `ls -la /var/data` 检查文件

### 首次访问很慢
- 免费套餐会在 15 分钟无请求后休眠
- 解决方案: 使用 UptimeRobot 或升级到付费套餐

---

**✅ 所有检查项完成！祝部署顺利！🎉**

---

**文档版本**: v1.0  
**最后更新**: 2025-10-29
