# 本地 PostgreSQL 环境搭建与数据迁移指南

本文档详细说明如何在本地搭建 PostgreSQL 开发/测试环境，并从 Render 线上数据库导出数据同步到本地。

---

## 📋 目录

1. [环境准备](#1-环境准备)
2. [从 Render 导出线上数据](#2-从-render-导出线上数据)
3. [在本地安装 PostgreSQL](#3-在本地安装-postgresql)
4. [创建本地数据库](#4-创建本地数据库)
5. [导入线上数据到本地](#5-导入线上数据到本地)
6. [配置项目使用本地 PostgreSQL](#6-配置项目使用本地-postgresql)
7. [验证与测试](#7-验证与测试)
8. [常见问题](#8-常见问题)

---

## 1. 环境准备

### 1.1 所需工具

- **PostgreSQL** (推荐版本 14 或以上)
- **pgAdmin** (可选，图形化管理工具)
- **Navicat** (可选，数据库管理工具)
- **命令行工具**: `psql`, `pg_dump`, `pg_restore`

### 1.2 检查现有环境

检查是否已安装 PostgreSQL：

```bash
psql --version
```

如果显示版本号，说明已安装。

---

## 2. 从 Render 导出线上数据

### 2.1 方法 A: 使用 Render Dashboard（推荐）

#### 步骤 1: 登录 Render

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 登录你的账号

#### 步骤 2: 获取数据库连接信息

1. 在左侧导航栏点击 **PostgreSQL**
2. 选择数据库 `arzu-simulator-db`
3. 在 **Connections** 部分，找到：
   - **External Database URL** (外部连接 URL)
   - 或单独的连接参数：
     - Hostname
     - Port (通常是 5432)
     - Database
     - Username
     - Password

示例连接 URL：
```
postgres://username:password@dpg-xxxxx.oregon-postgres.render.com/database_name
```

#### 步骤 3: 使用 pg_dump 导出数据

在本地命令行执行（Windows 使用 PowerShell 或 CMD）：

```bash
# 设置环境变量避免密码提示
set PGPASSWORD=your_password

# 导出完整数据库（包含结构和数据）
pg_dump -h dpg-xxxxx.oregon-postgres.render.com -p 5432 -U username -d database_name -F c -f render_backup.dump

# 或者导出为 SQL 文本格式（推荐用于查看和编辑）
pg_dump -h dpg-xxxxx.oregon-postgres.render.com -p 5432 -U username -d database_name -f render_backup.sql
```

**参数说明：**
- `-h`: 主机名
- `-p`: 端口
- `-U`: 用户名
- `-d`: 数据库名
- `-F c`: 自定义格式（二进制压缩）
- `-f`: 输出文件名

**注意：** Render 数据库需要 SSL 连接，可能需要添加 SSL 参数：

```bash
pg_dump -h dpg-xxxxx.oregon-postgres.render.com -p 5432 -U username -d database_name --no-password -f render_backup.sql
```

如果提示 SSL 错误，添加：
```bash
set PGSSLMODE=require
```

#### 步骤 4: 验证备份文件

检查导出的文件：

```bash
# Windows
dir render_backup.sql

# 查看文件内容（前几行）
type render_backup.sql | more
```

### 2.2 方法 B: 使用 Navicat 导出（图形化操作）

1. 按照 [Navicat 连接指南](./Arzu_simulator_back/docs/NAVICAT_POSTGRESQL_CONNECTION.md) 连接到 Render 数据库

2. 右键点击数据库 → **转储 SQL 文件** → **结构和数据**

3. 选择保存位置：`C:\Users\Amber\Desktop\Arzu_Simulater_test_backup\render_backup.sql`

4. 点击 **开始** 导出

### 2.3 仅导出特定表的数据

如果只需要导出部分表：

```bash
pg_dump -h dpg-xxxxx.oregon-postgres.render.com -p 5432 -U username -d database_name -t users -t tasks -t pomodoro_sessions -f render_data_only.sql
```

---

## 3. 在本地安装 PostgreSQL

### 3.1 Windows 安装

#### 下载

访问 [PostgreSQL 官方下载页](https://www.postgresql.org/download/windows/)

推荐使用 **EDB 安装器**：
- 下载链接：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- 选择最新版本（如 PostgreSQL 16）

#### 安装步骤

1. 运行安装程序 `postgresql-16-windows-x64.exe`

2. **安装组件选择**（全部勾选）：
   - PostgreSQL Server
   - pgAdmin 4（图形化管理工具）
   - Stack Builder（扩展工具）
   - Command Line Tools

3. **数据目录**：
   ```
   C:\Program Files\PostgreSQL\16\data
   ```

4. **设置超级用户密码**：
   - 用户名：`postgres`（默认）
   - 密码：**请设置一个强密码并记住**（例如：`admin123`）
   
5. **端口号**：
   - 默认 `5432`（保持默认）

6. **区域设置**：
   - 选择 `Chinese, China` 或 `Default locale`

7. 点击 **Next** 完成安装

#### 验证安装

打开 PowerShell 或 CMD：

```bash
# 检查版本
psql --version

# 登录 PostgreSQL（使用安装时设置的密码）
psql -U postgres
```

成功登录后会显示：
```
postgres=#
```

输入 `\q` 退出。

### 3.2 添加环境变量（如果需要）

如果 `psql` 命令无法识别，需要添加环境变量：

1. 右键 **此电脑** → **属性** → **高级系统设置** → **环境变量**

2. 在 **系统变量** 中找到 `Path`，点击 **编辑**

3. 添加：
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```

4. 点击 **确定** 保存

5. **重启命令行工具**使环境变量生效

---

## 4. 创建本地数据库

### 4.1 使用命令行创建

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE arzu_simulator_local;

# 创建专用用户（可选，推荐）
CREATE USER arzu_user WITH PASSWORD 'local_password_123';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE arzu_simulator_local TO arzu_user;

# 切换到新数据库
\c arzu_simulator_local

# 授予 schema 权限
GRANT ALL ON SCHEMA public TO arzu_user;

# 退出
\q
```

### 4.2 使用 pgAdmin 创建（图形化）

1. 打开 pgAdmin 4

2. 连接到本地服务器：
   - 右键 **Servers** → **Create** → **Server**
   - **Name**: `Local PostgreSQL`
   - **Connection** 标签：
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: （你设置的密码）

3. 创建数据库：
   - 右键 **Databases** → **Create** → **Database**
   - **Database**: `arzu_simulator_local`
   - **Owner**: `postgres` 或 `arzu_user`
   - 点击 **Save**

---

## 5. 导入线上数据到本地

### 5.1 方法 A: 先导入表结构，再导入数据

#### 步骤 1: 初始化表结构

使用项目自带的初始化脚本：

```bash
# 进入项目后端目录
cd C:\Users\Amber\Desktop\Arzu_Simulater_test_backup\Arzu_simulator_back

# 导入表结构
psql -U postgres -d arzu_simulator_local -f src/database/init-postgres.sql
```

#### 步骤 2: 导入线上数据

**如果你导出的是 SQL 文本格式：**

```bash
# 导入完整备份
psql -U postgres -d arzu_simulator_local -f render_backup.sql
```

**如果你导出的是自定义格式（.dump）：**

```bash
pg_restore -U postgres -d arzu_simulator_local -c -v render_backup.dump
```

**参数说明：**
- `-c`: 在导入前清理（删除）现有对象
- `-v`: 详细输出
- `--no-owner`: 忽略原始所有者
- `--no-acl`: 忽略访问权限

### 5.2 方法 B: 直接导入完整备份

如果你的备份包含完整的表结构和数据：

```bash
psql -U postgres -d arzu_simulator_local -f render_backup.sql
```

### 5.3 方法 C: 使用 Navicat 导入（最简单）

1. 在 Navicat 中连接到本地 PostgreSQL：
   - 新建连接 → PostgreSQL
   - 主机：`localhost`
   - 端口：`5432`
   - 数据库：`arzu_simulator_local`
   - 用户名：`postgres`
   - 密码：（你的密码）

2. 右键数据库 → **运行 SQL 文件**

3. 选择你导出的 `render_backup.sql`

4. 点击 **开始** 执行

### 5.4 验证数据导入

```bash
# 登录数据库
psql -U postgres -d arzu_simulator_local

# 查看所有表
\dt

# 查看用户表数据
SELECT * FROM users LIMIT 5;

# 查看任务表数据
SELECT * FROM tasks LIMIT 5;

# 统计各表数据量
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'pomodoro_sessions', COUNT(*) FROM pomodoro_sessions
UNION ALL
SELECT 'focus_periods', COUNT(*) FROM focus_periods
UNION ALL
SELECT 'task_brieflogs', COUNT(*) FROM task_brieflogs;

# 退出
\q
```

---

## 6. 配置项目使用本地 PostgreSQL

### 6.1 修改 `.env` 文件

编辑文件：`C:\Users\Amber\Desktop\Arzu_Simulater_test_backup\Arzu_simulator_back\.env`

```bash
# 服务器配置
NODE_ENV=development
PORT=3002

# 安全配置
JWT_SECRET=your_super_secret_and_random_string_here_12345_change_this_immediately
JWT_REFRESH_SECRET=your_refresh_token_secret_here_67890_change_this_too
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000

# ✅ 数据库配置 - 使用 PostgreSQL
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/arzu_simulator_local

# ❌ 注释掉 SQLite 配置
# DB_PATH=./database_new_2025-09-25T08-54-04-778Z.db

# 日志配置
LOG_LEVEL=info
```

**注意替换：**
- `postgres`: 你的 PostgreSQL 用户名
- `admin123`: 你的 PostgreSQL 密码
- `localhost`: 主机（本地就是 localhost）
- `5432`: 端口
- `arzu_simulator_local`: 数据库名

### 6.2 连接字符串格式说明

```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]
```

示例：
```bash
# 使用默认用户
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/arzu_simulator_local

# 使用专用用户
DATABASE_URL=postgresql://arzu_user:local_password_123@localhost:5432/arzu_simulator_local
```

### 6.3 创建 `.env.local` 备份（推荐）

创建一个专门的本地环境配置：

```bash
# 复制 .env 文件
cp .env .env.local
```

编辑 `.env.local`：
```bash
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/arzu_simulator_local
JWT_SECRET=local_dev_secret_key_123
JWT_REFRESH_SECRET=local_dev_refresh_secret_456
CORS_ORIGIN=http://localhost:3000
```

在启动时指定配置文件：
```bash
# package.json 中修改启动脚本
"scripts": {
  "dev:local": "NODE_ENV=development ts-node-dev --respawn --transpile-only src/server.ts"
}
```

---

## 7. 验证与测试

### 7.1 启动后端服务

```bash
cd C:\Users\Amber\Desktop\Arzu_Simulater_test_backup\Arzu_simulator_back

# 安装依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

查看启动日志，应该看到：
```
PostgreSQL连接成功
Server is running on port 3002
```

### 7.2 测试 API 接口

使用 Postman 或 curl 测试：

```bash
# 测试健康检查
curl http://localhost:3002/api/health

# 测试登录（替换为你数据库中的真实用户）
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"mail\":\"test@example.com\",\"password\":\"password123\"}"

# 测试获取任务列表（需要先登录获取 token）
curl http://localhost:3002/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7.3 检查数据库连接类型

在代码中验证当前使用的数据库：

编辑 `src/server.ts`，添加日志：

```typescript
import { DB_TYPE } from './database/connection';

console.log('🗄️ 当前使用的数据库类型:', DB_TYPE);
```

启动后应该显示：
```
🗄️ 当前使用的数据库类型: postgres
```

### 7.4 运行测试（如果有）

```bash
npm test
```

---

## 8. 常见问题

### 8.1 连接错误：`ECONNREFUSED`

**错误信息：**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**原因：** PostgreSQL 服务未启动

**解决方案：**

**Windows：**
1. 打开 **服务** (Win + R → 输入 `services.msc`)
2. 找到 `postgresql-x64-16`
3. 右键 → **启动**

或使用命令行（以管理员身份运行）：
```bash
net start postgresql-x64-16
```

### 8.2 密码认证失败

**错误信息：**
```
password authentication failed for user "postgres"
```

**解决方案：**
1. 确认密码正确
2. 检查 `.env` 中的 `DATABASE_URL` 格式
3. 重置 postgres 用户密码：

```bash
# 登录为系统用户（Windows 需要以管理员运行）
psql -U postgres

# 修改密码
ALTER USER postgres PASSWORD 'new_password';
```

### 8.3 数据库不存在

**错误信息：**
```
database "arzu_simulator_local" does not exist
```

**解决方案：**
返回 [步骤 4](#4-创建本地数据库) 创建数据库。

### 8.4 表已存在错误

**错误信息：**
```
ERROR: relation "users" already exists
```

**解决方案：**

**方案 A: 删除现有表并重新导入**
```bash
# 登录数据库
psql -U postgres -d arzu_simulator_local

# 删除所有表（谨慎操作！）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

# 退出并重新导入
\q
psql -U postgres -d arzu_simulator_local -f render_backup.sql
```

**方案 B: 使用 pg_restore 的 --clean 选项**
```bash
pg_restore -U postgres -d arzu_simulator_local --clean -v render_backup.dump
```

### 8.5 权限错误

**错误信息：**
```
ERROR: permission denied for schema public
```

**解决方案：**
```bash
psql -U postgres -d arzu_simulator_local

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### 8.6 SSL 连接问题（从 Render 导出时）

**错误信息：**
```
SSL connection has been requested but SSL is not supported
```

**解决方案：**
设置环境变量：
```bash
# Windows PowerShell
$env:PGSSLMODE="require"

# Windows CMD
set PGSSLMODE=require

# 然后重新执行 pg_dump
```

### 8.7 导入数据时编码错误

**错误信息：**
```
ERROR: invalid byte sequence for encoding "UTF8"
```

**解决方案：**
1. 确保数据库使用 UTF8 编码：
```bash
CREATE DATABASE arzu_simulator_local 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='Chinese_China.UTF-8' 
  LC_CTYPE='Chinese_China.UTF-8';
```

2. 或在导入时指定编码：
```bash
psql -U postgres -d arzu_simulator_local -f render_backup.sql --set client_encoding=UTF8
```

---

## 9. 最佳实践

### 9.1 定期备份

创建定期备份脚本 `backup-local-db.bat`：

```batch
@echo off
set PGPASSWORD=admin123
set BACKUP_FILE=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
pg_dump -U postgres -d arzu_simulator_local -f "C:\backups\%BACKUP_FILE%"
echo Backup completed: %BACKUP_FILE%
```

### 9.2 使用数据库迁移工具

考虑使用迁移工具管理数据库变更：
- **node-pg-migrate**
- **Knex.js**
- **TypeORM** (如果使用 TypeScript)

### 9.3 区分开发和生产数据

```bash
# .env.development (本地)
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/arzu_simulator_local

# .env.production (Render)
DATABASE_URL=postgresql://user:pass@dpg-xxx.render.com/arzu_simulator_db
```

### 9.4 使用 Docker（可选）

创建 `docker-compose.yml` 统一开发环境：

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: arzu_simulator_local
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

启动：
```bash
docker-compose up -d
```

---

## 10. 相关文档

- [Navicat PostgreSQL 连接指南](./Arzu_simulator_back/docs/NAVICAT_POSTGRESQL_CONNECTION.md)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [pg_dump 文档](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore 文档](https://www.postgresql.org/docs/current/app-pgrestore.html)

---

## 11. 快速命令参考

### 常用 psql 命令

```bash
# 登录数据库
psql -U postgres -d arzu_simulator_local

# 列出所有数据库
\l

# 切换数据库
\c arzu_simulator_local

# 列出所有表
\dt

# 查看表结构
\d users

# 查看表索引
\di

# 执行 SQL 文件
\i path/to/file.sql

# 退出
\q
```

### 导出/导入命令快速参考

```bash
# 导出整个数据库（SQL 格式）
pg_dump -U postgres -d database_name -f backup.sql

# 导出整个数据库（压缩格式）
pg_dump -U postgres -d database_name -F c -f backup.dump

# 导出仅数据（不包含表结构）
pg_dump -U postgres -d database_name --data-only -f data.sql

# 导出仅表结构（不包含数据）
pg_dump -U postgres -d database_name --schema-only -f schema.sql

# 导入 SQL 文件
psql -U postgres -d database_name -f backup.sql

# 导入 dump 文件
pg_restore -U postgres -d database_name -v backup.dump

# 导入并清理现有数据
pg_restore -U postgres -d database_name --clean -v backup.dump
```

---

## 🎉 完成！

按照以上步骤，你已经成功：
✅ 从 Render 导出了线上数据库数据  
✅ 在本地安装并配置了 PostgreSQL  
✅ 创建了本地开发数据库  
✅ 导入了线上数据到本地  
✅ 配置项目使用本地 PostgreSQL  
✅ 验证了数据库连接和功能  

现在你可以在本地进行开发和测试，数据与线上保持同步！

**下次更新数据：**
```bash
# 1. 从 Render 重新导出
pg_dump -h dpg-xxx.render.com -U username -d database_name -f render_backup_new.sql

# 2. 清空本地数据库并导入
psql -U postgres -d arzu_simulator_local -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U postgres -d arzu_simulator_local -f render_backup_new.sql
```
