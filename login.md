# 前端登录与注册功能实现计划 (login.md)

本文档基于对现有前后端代码的分析，为 `Arzu_simulator_front` 项目提供一个完整的登录和注册功能实现方案。

## 1. API 契约总结

通过分析后端代码，我们确定了以下API接口、请求和响应格式。

### 注册接口

- **Endpoint:** `POST /api/v1/auth/register`
- **说明:** 创建一个新用户。
- **请求体 (Request Body):**
  ```json
  {
    "mail": "user@example.com",
    "username": "your_nickname",
    "password": "your_password"
  }
  ```
- **成功响应 (201 Created):**
  ```json
  {
    "success": true,
    "message": "用户注册成功",
    "data": {
      "userId": 1,
      "username": "your_nickname",
      "mail": "user@example.com"
    }
  }
  ```
- **失败响应 (409 Conflict):** (邮箱或用户名已存在)
  ```json
  {
    "success": false,
    "message": "邮箱已存在" // 或 "用户名已存在"
  }
  ```

### 登录接口

- **Endpoint:** `POST /api/v1/auth/login/email`
- **说明:** 使用邮箱和密码进行用户身份验证。
- **请求体 (Request Body):**
  ```json
  {
    "mail": "user@example.com",
    "password": "your_password"
  }
  ```
- **成功响应 (200 OK):**
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "token": "<JWT_TOKEN>"
    }
  }
  ```
- **失败响应 (401 Unauthorized):** (凭证错误)
  ```json
  {
    "success": false,
    "message": "邮箱或密码无效"
  }
  ```

## 2. 实施步骤

### 步骤 1: 创建 API 服务层

为了代码的整洁和可复用性，我们首先在 `Arzu_simulator_front/src/` 目录下创建一个 `services` 文件夹，并在其中创建 `api.ts` 文件。

**`Arzu_simulator_front/src/services/api.ts`**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // 假设后端运行在3001端口，可按需修改

// 统一处理API请求的函数
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  const responseData = await response.json();

  if (!response.ok || !responseData.success) {
    throw new Error(responseData.message || 'API 请求失败');
  }

  return responseData.data;
}

// 注册接口
export const registerUser = (data: any) => {
  return fetchApi('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 登录接口
export const loginUser = (data: any) => {
  return fetchApi('/api/v1/auth/login/email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

```

### 步骤 2: 修改注册页面 (`RegisterScreen.tsx`)

我们将修改 `handleRegisterSubmit` 函数，调用真实的API接口。

```typescript
// 在文件顶部引入API服务
import { registerUser } from '../services/api'; // 假设 api.ts 在 ../services/ 目录下

// ...

// 🚀 处理注册提交
const handleRegisterSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ... (保留所有验证逻辑)

  setIsLoading(true);
  setErrorMessage('');

  try {
    // 调用后端注册接口
    const responseData = await registerUser({
      mail: email.trim(),
      username: nickname.trim(), // 后端需要 username 字段
      password: password,
    });

    console.log('✅ [注册成功] API响应:', responseData);

    // 模拟注册成功，调用成功回调
    const userData = {
      email: email.trim(),
      nickname: nickname.trim()
    };
    
    onRegisterSuccess(userData);
    
  } catch (error) {
    console.error('❌ 注册失败:', error);
    setErrorMessage(error instanceof Error ? error.message : '注册失败，请重试');
  } finally {
    setIsLoading(false);
  }
};

// ...
```

### 步骤 3: 修改登录页面 (`LoginScreen.tsx`)

同样，修改 `handleLoginSubmit` 函数以调用登录API，并在成功后存储Token。

```typescript
// 在文件顶部引入API服务
import { loginUser } from '../services/api'; // 假设 api.ts 在 ../services/ 目录下

// ...

// 🚀 处理登录提交
const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ... (保留所有验证逻辑)

  setIsLoading(true);
  setErrorMessage('');

  try {
    // 调用后端登录接口
    const responseData = await loginUser({
      mail: email.trim(),
      password: password,
    });

    // 从响应中获取token
    const token = responseData.token;
    if (!token) {
      throw new Error('未在响应中找到访问令牌');
    }

    console.log('🔐 [登录成功] 获取Token:', token);

    // 🔑 保存用户登录信息到本地存储
    localStorage.setItem('userToken', token);
    
    // 调用父组件的登录成功回调
    onStartWork({ email, password: '' }); // 不在组件间传递密码
    
  } catch (error) {
    console.error('❌ 登录失败:', error);
    setErrorMessage(error instanceof Error ? error.message : '登录失败，请重试');
  } finally {
    setIsLoading(false);
  }
};

// ...
```

## 3. 全局状态与认证管理

登录成功后，应用需要一种机制来“记住”用户状态，并在后续的API请求中携带认证信息。

### Token 存储与使用

- **存储:** `localStorage` 是一个简单有效的选择。当用户关闭并重新打开浏览器时，登录状态可以保持。
- **使用:** 在 `api.ts` 中，可以扩展 `fetchApi` 函数，使其自动从 `localStorage` 读取Token并附加到请求头中。

**更新 `Arzu_simulator_front/src/services/api.ts`**
```typescript
// ... (保留顶部代码)

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('userToken');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // ... (保留剩余逻辑)
}

// ... (保留导出函数)
```

### 全局状态 (推荐)

为了在整个应用中轻松访问用户登录状态（例如，在UI中显示/隐藏某些元素），建议使用 **React Context**。

1.  **创建 `AuthContext.tsx`:**
    ```typescript
    import React, { createContext, useState, useContext, useEffect } from 'react';

    interface AuthContextType {
      token: string | null;
      isLoggedIn: boolean;
      login: (token: string) => void;
      logout: () => void;
    }

    const AuthContext = createContext<AuthContextType | null>(null);

    export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
      const [token, setToken] = useState<string | null>(null);

      useEffect(() => {
        const storedToken = localStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
        }
      }, []);

      const login = (newToken: string) => {
        localStorage.setItem('userToken', newToken);
        setToken(newToken);
      };

      const logout = () => {
        localStorage.removeItem('userToken');
        setToken(null);
      };

      const value = {
        token,
        isLoggedIn: !!token,
        login,
        logout,
      };

      return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    };

    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };
    ```

2.  **在 `App.tsx` 中包裹应用:**
    ```typescript
    import { AuthProvider } from './contexts/AuthContext'; // 路径可能不同

    function App() {
      return (
        <AuthProvider>
          {/* 应用的其他部分 */}
        </AuthProvider>
      );
    }
    ```

3.  **在组件中使用:**
    现在，`LoginScreen.tsx` 可以调用 `useAuth().login(token)` 而不是直接操作 `localStorage`，其他组件也可以通过 `useAuth().isLoggedIn` 来判断用户是否登录。

完成以上步骤后，前端将拥有一个功能完整、代码结构清晰且易于扩展的登录和注册系统。
