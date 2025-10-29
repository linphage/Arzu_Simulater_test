# 登录功能后端集成指南

## 概述

本文档详细说明了青金石宫模拟器登录功能所需的后端接口和集成要点。

## 🔥 需要实现的后端接口

### 1. 用户登录接口

**接口地址**: `POST /api/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**成功响应** (HTTP 200):
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "nickname": "用户昵称",
      "avatar": "https://example.com/avatar.jpg",
      "createdAt": "2024-01-01T00:00:00Z",
      "preferences": {
        "theme": "light",
        "pomodoroTime": 25,
        "shortBreakTime": 5,
        "longBreakTime": 15
      }
    },
    "expiresIn": 3600
  }
}
```

**失败响应** (HTTP 400/401):
```json
{
  "success": false,
  "message": "邮箱或密码错误",
  "code": "INVALID_CREDENTIALS"
}
```

### 2. 用户注册接口

**接口地址**: `POST /api/auth/register`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "userPassword123",
  "nickname": "用户昵称",
  "confirmPassword": "userPassword123"
}
```

**成功响应** (HTTP 201):
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "user456",
      "email": "user@example.com",
      "nickname": "用户昵称",
      "avatar": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "emailVerified": false
    },
    "requiresVerification": true
  }
}
```

**失败响应** (HTTP 400):
```json
{
  "success": false,
  "message": "邮箱已被注册",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

**其他错误代码**:
- `WEAK_PASSWORD`: 密码强度不够
- `INVALID_EMAIL`: 邮箱格式错误
- `PASSWORD_MISMATCH`: 密码确认不匹配

### 3. 令牌验证接口

**接口地址**: `GET /api/auth/verify`

**请求头**:
```
Authorization: Bearer <token>
```

### 4. 用户数据同步接口

**接口地址**: `POST /api/user/sync`

**功能**: 同步用户的任务数据、设置等信息

## 📁 需要修改的前端文件

### 1. `/components/LoginScreen.tsx`

**位置**: 第43-78行的 `handleLoginSubmit` 函数

**需要取消注释的代码块**:
```typescript
// 🔥 TODO: 添加后端登录接口调用
// 这里需要调用后端 API 进行登录验证
/*
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: email.trim(),
    password: password
  })
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || '登录失败');
}

const userData = await response.json();

// 🔑 保存用户登录信息到本地存储
localStorage.setItem('userToken', userData.token);
localStorage.setItem('userInfo', JSON.stringify(userData.user));

// 📝 可选：保存用户偏好设置
localStorage.setItem('userPreferences', JSON.stringify(userData.preferences || {}));
*/
```

### 2. `/components/RegisterScreen.tsx`

**位置**: 第59-150行的 `handleRegisterSubmit` 函数

**需要实现的注册功能**:
```typescript
// 🔥 TODO: 添加后端注册接口调用
// 这里需要调用后端 API 进行用户注册
/*

注册功能后端实现指南：

1. 后端注册接口 (POST /api/auth/register)
   - 接收参数：email, password, confirmPassword, nickname（必填）
   - 验证邮箱格式和唯一性
   - 验证密码强度（长度、复杂度等）
   - 验证两次密码是否一致
   - 对密码进行加密存储（推荐使用bcrypt）
   - 创建用户记录并保存到数据库
   - 生成邮箱验证令牌（可选）
   - 发送验证邮件（可选）
   - 返回注册结果

示例API调用：
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email.trim().toLowerCase(),
    password: password,
    confirmPassword: confirmPassword,
    nickname: nickname.trim()
  })
});
*/
```

### 3. `/components/LoginScreen.tsx`

**位置**: 第150-190行的 `handleRegisterSuccess` 函数

**需要实现的注册成功处理**:
```typescript
// 🔥 TODO: 处理注册成功后的逻辑
// 这里可以选择：
// 1. 直接登录用户（如果后端返回了登录令牌）
// 2. 显示邮箱验证提示页面
// 3. 返回登录页面提示用户登录
/*

注册成功后的处理选项：

选项1：直接登录（推荐）
if (userData.token) {
  localStorage.setItem('userToken', userData.token);
  localStorage.setItem('userInfo', JSON.stringify(userData.user));
  onStartWork({ email: userData.email, password: '' });
}

选项2：邮箱验证流程
if (userData.requiresVerification) {
  setIsEmailVerificationMode(true);
  setVerificationEmail(userData.email);
}

选项3：返回登录页面
setIsRegisterMode(false);
setEmail(userData.email);
setSuccessMessage('注册成功！请使用邮箱和密码登录。');
*/
```

### 4. `/App.tsx`

**位置**: 第31-50行的 `handleStartWork` 函数

**需要取消注释的代码块**:
```typescript
// 🔥 TODO: 添加用户数据持久化存储
// 如果需要数据持久化，可以在这里添加：
/*
// 保存到 localStorage
localStorage.setItem('userEmail', loginData.email);
localStorage.setItem('loginTime', new Date().toISOString());

// 或者保存到 IndexedDB 以支持更复杂的数据结构
// 或者定期同步到后端服务器
*/
```

## 🗄️ 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);
```

### 用户偏好设置表 (user_preferences)

```sql
CREATE TABLE user_preferences (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  theme VARCHAR(20) DEFAULT 'light',
  pomodoro_time INT DEFAULT 25,
  short_break_time INT DEFAULT 5,
  long_break_time INT DEFAULT 15,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preferences (user_id)
);
```

### 用户会话表 (user_sessions)

```sql
CREATE TABLE user_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### 任务数据表 (user_tasks)

```sql
CREATE TABLE user_tasks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  task_type ENUM('勤政', '恕己', '爱人') DEFAULT '勤政',
  priority ENUM('金卡', '银卡', '铜卡', '石卡') DEFAULT '铜卡',
  due_date DATE,
  due_time TIME,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  focus_time INT DEFAULT 0, -- 专注时间（秒）
  interruptions INT DEFAULT 0, -- 中断次数
  abandonments INT DEFAULT 0, -- 放弃次数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_due_date (due_date),
  INDEX idx_is_completed (is_completed),
  INDEX idx_created_at (created_at)
);
```

### 邮箱验证表 (email_verifications)

```sql
CREATE TABLE email_verifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_verification_code (verification_code),
  INDEX idx_expires_at (expires_at)
);
```

## 🛠️ 集成步骤

### 第一步：设置API基础URL

在项目中创建 `/src/config/api.ts` 文件：

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    SYNC: '/api/user/sync'
  }
};
```

### 第二步：创建API服务

创建 `/src/services/authService.ts` 文件：

```typescript
import { API_CONFIG } from '../config/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      nickname: string;
      avatar?: string;
      preferences?: any;
    };
    expiresIn: number;
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登录失败');
    }

    return response.json();
  },

  async verify(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
```

### 第三步：更新LoginScreen组件

将 `/components/LoginScreen.tsx` 中的注释代码替换为：

```typescript
import { authService } from '../services/authService';

// 在 handleLoginSubmit 函数中替换 TODO 部分：
const userData = await authService.login({
  email: email.trim(),
  password: password
});

// 保存用户信息
localStorage.setItem('userToken', userData.data.token);
localStorage.setItem('userInfo', JSON.stringify(userData.data.user));
```

### 第四步：添加应用启动时的登录状态检查

在 `/App.tsx` 的组件初始化时添加：

```typescript
React.useEffect(() => {
  const checkLoginStatus = async () => {
    const token = localStorage.getItem('userToken');
    if (token) {
      const isValid = await authService.verify(token);
      if (isValid) {
        setIsLoggedIn(true);
        console.log('🔐 用户已登录，自动恢复登录状态');
      } else {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        console.log('🔐 登录令牌无效，已清除');
      }
    }
  };

  checkLoginStatus();
}, []);
```

## 🔒 安全建议

1. **令牌过期处理**: 实现令牌自动刷新机制
2. **敏感信息保护**: 密码传输使用HTTPS
3. **输入验证**: 前后端都要验证邮箱格式和密码强度
4. **防暴力破解**: 添加登录频率限制
5. **CSRF保护**: 使用CSRF令牌防护

## 📊 数据持久化选项

### 选项1：localStorage（当前实现）
- ✅ 简单易用
- ❌ 刷新页面数据丢失
- ❌ 无法跨设备同步

### 选项2：IndexedDB
- ✅ 更大存储空间
- ✅ 支持复杂数据结构
- ❌ 仍然是本地存储

### 选项3：后端数据库
- ✅ 数据永久保存
- ✅ 跨设备同步
- ✅ 数据备份和恢复
- ❌ 需要服务器开发

## 🎯 注册页面功能说明

### 当前实现状态

✅ **已完成的前端功能**:
- 完整的注册页面UI，与登录页面设计风格一致
- 表单验证（邮箱格式、密码长度、密码确认等）
- 用户体验优化（加载状态、错误提示、成功处理）
- 服务条款和隐私政策入口
- 注册成功后的流程处理

🔥 **需要后端支持的功能**:
- 用户注册API接口
- 邮箱唯一性验证
- 密码安全存储
- 用户数据持久化
- 邮箱验证流程（可选）

### 注册页面文件位置

**主要文件**:
- `/components/RegisterScreen.tsx` - 注册页面主组件
- `/components/LoginScreen.tsx` - 集成了注册页面的登录组件

**核心功能流程**:
1. 用户在登录页面点击"立即注册"
2. 切换到注册页面（RegisterScreen组件）
3. 用户填写注册信息（邮箱、昵称、密码）并提交
4. 调用后端注册接口（需要实现）
5. 注册成功后处理用户体验（已实现多种选项）

**注册字段说明**:
- **邮箱地址**: 必填，用于登录和账户验证
- **昵称**: 必填，2-20个字符，用于显示用户身份
- **密码**: 必填，至少6位字符，用于账户安全
- **确认密码**: 必填，需要与密码一致

- **服务条款同���**: 必选，用户必须同意才能注册



## 📱 注册组件实现示例

### 创建 `/components/RegisterModal.tsx`

```typescript
import React, { useState } from 'react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (userData: any) => void;
}

export function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基础验证
    if (!email || !password || !confirmPassword) {
      setErrorMessage('请填写所有必填项');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('请输入有效的邮箱地址');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('密码至少需要6位字符');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('请同意服务条款和隐私政策');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 🔥 TODO: 添加后端注册接口调用
      /*
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          confirmPassword: confirmPassword,
          nickname: nickname.trim() || email.split('@')[0]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '注册失败');
      }

      const userData = await response.json();
      
      // 🎉 注册成功处理
      alert('注册成功！请检查邮���验证邮件。');
      onRegisterSuccess(userData);
      onClose();
      */

      // 🧪 临时模拟注册成功
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('🔥 [TODO] 注册功能需要后端支持');
      alert('注册功能开发中，请使用登录功能体验应用。');
      onClose();
      
    } catch (error) {
      console.error('❌ 注册失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="unified-content bg-white w-full max-w-sm"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif]" 
              style={{ fontSize: '18px', fontWeight: '500' }}>
            注册账号
          </h2>
          <button
            onClick={onClose}
            className="text-[#3A3F47] hover:text-[#1E3A8A] transition-colors"
            style={{ fontSize: '24px', fontWeight: '400' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {/* 错误信息 */}
          {errorMessage && (
            <div className="unified-content bg-red-50 border-red-200 text-red-700 text-center"
                 style={{ fontSize: '14px', padding: '12px' }}>
              {errorMessage}
            </div>
          )}

          {/* 邮箱 */}
          <div>
            <label htmlFor="register-email" className="block mb-2" 
                   style={{ fontSize: '14px', fontWeight: '500' }}>
              邮箱地址 *
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              className="unified-input w-full"
              disabled={isLoading}
              required
            />
          </div>

          {/* 昵称 */}
          <div>
            <label htmlFor="register-nickname" className="block mb-2"
                   style={{ fontSize: '14px', fontWeight: '500' }}>
              昵称 (可选)
            </label>
            <input
              id="register-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称，留空则使用邮箱前缀"
              className="unified-input w-full"
              disabled={isLoading}
            />
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="register-password" className="block mb-2"
                   style={{ fontSize: '14px', fontWeight: '500' }}>
              密码 *
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
              className="unified-input w-full"
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label htmlFor="register-confirm-password" className="block mb-2"
                   style={{ fontSize: '14px', fontWeight: '500' }}>
              确认密码 *
            </label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              className="unified-input w-full"
              disabled={isLoading}
              required
            />
          </div>

          {/* 服务条款 */}
          <div className="flex items-start gap-2">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
              disabled={isLoading}
              required
            />
            <label htmlFor="agree-terms" 
                   className="text-[#3A3F47] opacity-80"
                   style={{ fontSize: '12px', fontWeight: '400' }}>
              我已阅读并同意
              <span className="text-[#1E3A8A] underline cursor-pointer ml-1">
                服务条款
              </span>
              和
              <span className="text-[#1E3A8A] underline cursor-pointer ml-1">
                隐私政策
              </span>
            </label>
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="unified-button w-full bg-[#1E3A8A] text-white hover:bg-[#1E40AF] disabled:opacity-50"
            style={{ marginTop: '24px' }}
          >
            {isLoading ? '注册中...' : '立即注册'}
          </button>
        </form>

        {/* 登录链接 */}
        <div className="text-center mt-4">
          <p className="text-[#3A3F47] opacity-70" style={{ fontSize: '12px' }}>
            已有账号？
            <button
              onClick={onClose}
              className="ml-1 text-[#1E3A8A] hover:text-[#1E40AF] underline"
              style={{ fontSize: '12px', fontWeight: '500', background: 'none', border: 'none' }}
            >
              立即登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 注册页面集成说明

**当前实现方式**:
注册页面已作为独立的全屏页面集成到LoginScreen组件中，用户点击"立即注册"后会完整切换到注册页面，体验类似于原生应用的页面切换。

**主要特点**:
- 🎨 **设计一致性**: 注册页面完全遵循登录页面的设计风格
- 📱 **移动端优化**: 全屏设计，适配各种移动设备
- 🔄 **页面切换**: 平滑的页面切换体验
- ✅ **表单验证**: 完整的前端验证逻辑
- 🔒 **安全考虑**: 密码确认、服务条款同意等

**页面切换逻辑**:
```typescript
// LoginScreen.tsx 中的状态管理
const [isRegisterMode, setIsRegisterMode] = useState(false);

// 显示注册页面
const handleRegisterClick = () => {
  setIsRegisterMode(true);
};

// 返回登录页面
const handleBackToLogin = () => {
  setIsRegisterMode(false);
};

// 根据状态渲染不同页面
if (isRegisterMode) {
  return <RegisterScreen />;
}
return <LoginPage />;
```

## 🧪 测试用例

### 登录功能测试
- [ ] 正确邮箱和密码登录成功
- [ ] 错误邮箱格式提示
- [ ] 错误密码提示
- [ ] 空字段验证
- [ ] 网络错误处理
- [ ] 登录状态保持

### 注册功能测试
- [ ] 正确信息注册成功
- [ ] 邮箱格式验证
- [ ] 昵称必填验证（2-20字符）
- [ ] 密码长度验证（至少6位）
- [ ] 密码确认匹配验证

- [ ] 邮箱重复注册检测（需要后端）
- [ ] 服务条款同意验证
- [ ] 注册成功后的流程处理

### 页面切换测试
- [ ] 登录页面到注册页面切换
- [ ] 注册页面返回登录页面
- [ ] 页面切换时表单数据清空
- [ ] 注册成功后返回登录页面并预填邮箱

### 用户体验测试
- [ ] 加载状态显示
- [ ] 错误信息显示
- [ ] 自动登录功能
- [ ] 移动端兼容性
- [ ] 表单字段自动完成
- [ ] 服务条款和隐私政策链接（需要实现页面）

## 📝 环境变量配置

在 `.env` 文件中添加：

```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_JWT_SECRET=your-jwt-secret-key
```

## 🔄 后续优化建议

1. **添加忘记密码功能**
2. **支持第三方登录（微信、QQ等）**
3. **添加用户注册功能**
4. **实现离线数据同步**
5. **添加多设备登录管理**

---

**注意**: 所有标记为 `🔥 TODO` 的代码注释都需要在后端接口准备好后进行替换和激活。