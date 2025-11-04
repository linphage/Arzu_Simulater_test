# 使用 Navicat 连接 Render PostgreSQL 数据库

本文档说明如何使用 Navicat 连接到 Render 上的 `arzu-simulator-db` PostgreSQL 数据库。

## 前提条件

- 已安装 Navicat Premium 或 Navicat for PostgreSQL
- 有 Render 账号访问权限

## 步骤 1：获取 Render 数据库连接信息

1. 登录 [Render Dashboard](https://dashboard.render.com/)

2. 在左侧导航栏中，找到并点击 **PostgreSQL** 部分

3. 选择你的数据库实例 `arzu-simulator-db`

4. 在数据库详情页面，找到 **Connections** 部分，你会看到以下信息：

   - **Internal Database URL**: 内部连接地址（仅供 Render 内部服务使用）
   - **External Database URL**: 外部连接地址（用于外部工具连接）

5. 点击 **External Database URL** 右侧的 **Copy** 按钮复制连接字符串

   连接字符串格式类似：
   ```
   postgres://username:password@dpg-xxxxxxxxxxxxx-a.oregon-postgres.render.com/database_name
   ```

6. 或者，你也可以在页面下方找到单独的连接参数：
   - **Hostname**: `dpg-xxxxxxxxxxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: 数据库名称
   - **Username**: 用户名
   - **Password**: 点击 **Show** 按钮查看密码

## 步骤 2：配置 Navicat 连接

### 方法 A：使用连接 URL（推荐）

1. 打开 Navicat

2. 点击左上角 **连接** → **PostgreSQL**

3. 在弹出的连接配置窗口中：
   - **连接名**: 输入一个便于识别的名称，如 `Arzu Simulator - Render Production`
   
4. 从复制的 URL 中解析参数并填入：
   
   假设你的 URL 是：
   ```
   postgres://arzu_user:abc123password@dpg-ct12345abcdefg-a.oregon-postgres.render.com/arzu_simulator_db
   ```
   
   则配置如下：
   - **主机**: `dpg-ct12345abcdefg-a.oregon-postgres.render.com`
   - **端口**: `5432`
   - **初始数据库**: `arzu_simulator_db`（URL 最后的部分）
   - **用户名**: `arzu_user`（`postgres://` 后面到 `:` 之间的部分）
   - **密码**: `abc123password`（`:` 后面到 `@` 之间的部分）

### 方法 B：直接输入参数

1. 打开 Navicat

2. 点击左上角 **连接** → **PostgreSQL**

3. 在弹出的连接配置窗口中填写：
   - **连接名**: `Arzu Simulator - Render Production`
   - **主机**: 从 Render 复制的 Hostname
   - **端口**: `5432`
   - **初始数据库**: 从 Render 复制的 Database 名称
   - **用户名**: 从 Render 复制的 Username
   - **密码**: 从 Render 复制的 Password

## 步骤 3：配置 SSL 连接（重要）

Render 的 PostgreSQL 数据库**要求使用 SSL 连接**，必须正确配置：

1. 在连接配置窗口中，点击 **SSL** 标签页

2. 配置以下选项：
   - **使用 SSL**: ✅ 勾选
   - **认证**: 选择 **自签名证书** 或 **SSL/TLS**
   - **SSL 版本**: 选择 **TLSv1.2** 或更高版本

3. 如果提示需要证书文件，可以选择：
   - **不验证服务器证书**（适用于开发/测试环境）
   - 或从 Render 下载 CA 证书（如果提供）

## 步骤 4：测试连接

1. 在连接配置窗口底部，点击 **测试连接** 按钮

2. 如果连接成功，会显示 **"连接成功"** 的提示

3. 如果连接失败，请检查：
   - 网络是否正常（Render 服务器在美国，确保可以访问）
   - SSL 是否已启用
   - 用户名、密码、主机名是否正确
   - 防火墙是否阻止了连接

4. 点击 **确定** 保存连接配置

## 步骤 5：打开连接并浏览数据库

1. 在 Navicat 左侧连接列表中，双击你刚创建的连接

2. 展开数据库节点，你应该能看到：
   - `public` schema
   - 数据库表：`users`, `tasks`, `pomodoro_sessions`, `focus_periods`, `task_brieflogs` 等

3. 现在你可以：
   - 查看表结构
   - 运行 SQL 查询
   - 查看和编辑数据
   - 执行数据库维护操作

## 常见问题排查

### 问题 1：连接超时

**原因**: 
- 网络问题
- Render 服务器位置较远（美国）

**解决方案**:
- 检查网络连接
- 增加 Navicat 的连接超时时间：工具 → 选项 → 其他 → 超时设置
- 使用 VPN（如果网络有限制）

### 问题 2：SSL 连接错误

**错误信息**: `SSL connection has been requested but SSL is not supported`

**解决方案**:
- 确保在 SSL 标签页中勾选了 **使用 SSL**
- 尝试不同的 SSL 版本（TLSv1.2, TLSv1.3）
- 选择 **不验证服务器证书** 选项

### 问题 3：身份验证失败

**错误信息**: `password authentication failed for user`

**解决方案**:
- 重新从 Render Dashboard 复制密码（注意不要有多余空格）
- 确认用户名正确
- 检查数据库 URL 是否使用了 **External Database URL**

### 问题 4：数据库不存在

**错误信息**: `database "xxx" does not exist`

**解决方案**:
- 检查 **初始数据库** 字段是否填写正确
- 从 Render Dashboard 确认数据库名称

## 安全提示

1. **不要分享连接信息**: 数据库连接字符串包含敏感信息，切勿公开分享

2. **限制访问权限**: 
   - 仅在需要时使用外部连接
   - 考虑使用 Render 的 IP 白名单功能（如果可用）

3. **使用强密码**: 确保 Render 数据库使用强密码

4. **定期备份**: 在进行任何数据库修改操作前，先备份数据

## 相关链接

- [Render PostgreSQL 文档](https://render.com/docs/databases)
- [Navicat 官方文档](https://www.navicat.com/manual)
- [PostgreSQL SSL 连接文档](https://www.postgresql.org/docs/current/ssl-tcp.html)

## 获取帮助

如果遇到连接问题：
1. 查看 Render Dashboard 中的数据库状态
2. 检查 Render 服务日志
3. 联系 Render 技术支持
