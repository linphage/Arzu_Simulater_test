# Render 环境变量配置指南

## 必需的环境变量

在 Render Dashboard → 你的 Web Service → Environment 中添加以下变量：

### 1. 基础配置
```
NODE_ENV=production
PORT=3001
```

### 2. 数据库配置（重要！）
```
DB_PATH=/var/data/arzu.db
```
**说明**：必须使用持久化磁盘路径 `/var/data/`，否则数据会在每次重启时丢失

### 3. JWT 密钥（必须修改！）
```
JWT_SECRET=请替换为至少32位的随机字符串
JWT_REFRESH_SECRET=请替换为另一个至少32位的随机字符串
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**生成强密钥的方法**：
```bash
# 方法1: 使用 openssl
openssl rand -base64 32

# 方法2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 安全配置
```
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://你的前端域名.onrender.com
```

### 5. 日志配置
```
LOG_LEVEL=warn
```

## 持久化磁盘配置

1. 在 Web Service 页面，找到 **"Disks"** 部分
2. 点击 **"Add Disk"**
3. 配置：
   - **Name**: `arzu-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (免费)
4. 保存后，Render 会重新部署

## 数据库初始化

部署后，数据库会自动初始化：
- `npm run prestart` 执行 `init-db` 脚本
- 创建所有必需的表结构
- 数据保存在 `/var/data/arzu.db`

## 验证部署

部署成功后，访问：
```
https://你的服务名.onrender.com/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-11-03T..."
}
```

## 常见问题

### Q: 数据库初始化失败？
**A**: 检查 Logs，确认：
1. 持久化磁盘已挂载到 `/var/data`
2. 环境变量 `DB_PATH=/var/data/arzu.db` 已设置
3. `scripts/final-migration.sql` 文件存在

### Q: 每次重启数据丢失？
**A**: 检查：
1. 是否添加了持久化磁盘
2. `DB_PATH` 是否指向 `/var/data/` 目录

### Q: CORS 错误？
**A**: 在环境变量中正确设置前端域名：
```
CORS_ORIGIN=https://你的前端域名.onrender.com
```
