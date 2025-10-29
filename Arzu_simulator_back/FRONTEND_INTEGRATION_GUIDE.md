# Arzu Simulator 前端集成指南

## 概述

本文档提供了将Arzu Simulator后端API集成到前端应用的完整指南。包括认证流程、API调用、错误处理、状态管理等各个方面。

## 目录

1. [环境配置](#环境配置)
2. [认证集成](#认证集成)
3. [任务管理集成](#任务管理集成)
4. [番茄钟功能集成](#番茄钟功能集成)
5. [错误处理](#错误处理)
6. [状态管理](#状态管理)
7. [性能优化](#性能优化)
8. [测试](#测试)
9. [部署](#部署)
10. [最佳实践](#最佳实践)

## 环境配置

### 1.1 安装依赖

```bash
npm install axios
npm install @tanstack/react-query  # 推荐用于数据获取和缓存
npm install zustand                # 推荐用于状态管理
npm install react-hook-form        # 推荐用于表单处理
```

### 1.2 环境变量配置

创建`.env`文件：

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_API_LOG=true
```

### 1.3 API客户端配置

使用提供的API客户端：

```typescript
import apiClient from './config/api-client';

// 基础配置已内置，可直接使用
const response = await apiClient.auth.login({
  username: 'testuser',
  password: 'Test123!@#'
});
```

## 认证集成

### 2.1 用户注册

```typescript
import apiClient from './config/api-client';
import { message } from 'antd'; // 或其他UI库

const handleRegister = async (userData: RegisterData) => {
  try {
    const response = await apiClient.auth.register(userData);
    
    if (response.success) {
      message.success('注册成功！');
      // 跳转到登录页面
      navigate('/login');
    }
  } catch (error) {
    message.error(error.message || '注册失败');
  }
};
```

### 2.2 用户登录

```typescript
const handleLogin = async (credentials: LoginCredentials) => {
  try {
    const response = await apiClient.auth.login(credentials);
    
    if (response.success) {
      // 令牌已自动保存到localStorage
      const { user, tokens } = response.data;
      
      // 更新应用状态
      setUser(user);
      setIsAuthenticated(true);
      
      message.success('登录成功！');
      navigate('/dashboard');
    }
  } catch (error) {
    message.error(error.message || '登录失败');
  }
};
```

### 2.3 自动令牌刷新

API客户端已内置自动令牌刷新功能，无需手动处理：

```typescript
// 当访问令牌过期时，会自动使用刷新令牌获取新的令牌
// 所有失败的请求会自动重试一次
```

### 2.4 用户登出

```typescript
const handleLogout = async () => {
  try {
    await apiClient.auth.logout();
    
    // 清除应用状态
    setUser(null);
    setIsAuthenticated(false);
    
    // 跳转到登录页面
    navigate('/login');
    message.success('登出成功！');
  } catch (error) {
    message.error('登出失败');
  }
};
```

## 任务管理集成

### 3.1 创建任务

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  dueDate?: string;
}

const CreateTaskForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      const response = await apiClient.tasks.create(data);
      
      if (response.success) {
        message.success('任务创建成功！');
        // 重置表单
        reset();
        // 刷新任务列表
        queryClient.invalidateQueries(['tasks']);
      }
    } catch (error) {
      message.error(error.message || '任务创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('title', { required: '任务标题不能为空' })}
        placeholder="任务标题"
      />
      {errors.title && <span>{errors.title.message}</span>}
      
      <textarea
        {...register('description')}
        placeholder="任务描述"
      />
      
      <select {...register('category')} >
        <option value="勤政">勤政</option>
        <option value="恕己">恕己</option>
        <option value="爱人">爱人</option>
      </select>
      
      <select {...register('priority')} >
        <option value="金">金级</option>
        <option value="银">银级</option>
        <option value="铜">铜级</option>
        <option value="石">石级</option>
      </select>
      
      <input
        type="datetime-local"
        {...register('dueDate')}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? '创建中...' : '创建任务'}
      </button>
    </form>
  );
};
```

### 3.2 任务列表和分页

```typescript
import { useQuery } from '@tanstack/react-query';

interface TaskListProps {
  page: number;
  limit: number;
  filters?: TaskFilters;
}

const TaskList: React.FC<TaskListProps> = ({ page, limit, filters }) => {
  const { data, isLoading, error } = useQuery(
    ['tasks', page, limit, filters],
    () => apiClient.tasks.getAll({ page, limit, ...filters }),
    {
      keepPreviousData: true, // 保持上一页数据，提升用户体验
      staleTime: 5 * 60 * 1000, // 5分钟内数据不过期
    }
  );

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  const { tasks, pagination } = data?.data || {};

  return (
    <div>
      {tasks?.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
      
      <Pagination
        current={pagination.page}
        total={pagination.totalPages}
        onChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};
```

### 3.3 任务搜索和过滤

```typescript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const TaskSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);

  const debouncedSearch = debounce(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiClient.tasks.search(term, 10);
      if (response.success) {
        setSearchResults(response.data.tasks);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm]);

  return (
    <div>
      <input
        type="text"
        placeholder="搜索任务..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(task => (
            <div key={task.id} className="search-result-item">
              {task.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3.4 任务统计和分析

```typescript
const TaskDashboard: React.FC = () => {
  const { data: stats } = useQuery(
    ['task-stats'],
    () => apiClient.tasks.getStats(),
    {
      refetchInterval: 5 * 60 * 1000, // 每5分钟刷新一次
    }
  );

  const { data: analytics } = useQuery(
    ['task-analytics', 30],
    () => apiClient.tasks.getAnalytics(30),
    {
      refetchInterval: 10 * 60 * 1000, // 每10分钟刷新一次
    }
  );

  if (!stats?.data || !analytics?.data) return null;

  return (
    <div className="dashboard">
      <div className="stats-cards">
        <StatCard
          title="总任务数"
          value={stats.data.totalTasks}
          icon="📋"
        />
        <StatCard
          title="已完成"
          value={stats.data.completedTasks}
          icon="✅"
        />
        <StatCard
          title="完成率"
          value={`${stats.data.completionRate}%`}
          icon="📊"
        />
      </div>
      
      <div className="charts">
        <CategoryChart data={stats.data.tasksByCategory} />
        <PriorityChart data={stats.data.tasksByPriority} />
        <TrendChart data={analytics.data.dailyStats} />
      </div>
    </div>
  );
};
```

## 番茄钟功能集成

### 4.1 创建番茄钟会话

```typescript
const PomodoroTimer: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const startPomodoro = async (task?: Task) => {
    try {
      const response = await apiClient.tasks.pomodoro.createSession(
        task?.id,
        25
      );

      if (response.success) {
        setCurrentTask(task || null);
        setIsActive(true);
        setTimeLeft(25 * 60);
        message.success('番茄钟会话开始！');
      }
    } catch (error) {
      if (error.message.includes('已有活跃的番茄钟会话')) {
        message.warning('已有活跃的番茄钟会话');
      } else {
        message.error('启动番茄钟失败');
      }
    }
  };

  const completePomodoro = async () => {
    try {
      // 获取活跃会话
      const activeResponse = await apiClient.tasks.pomodoro.getActiveSession();
      
      if (activeResponse.success && activeResponse.data.session) {
        const sessionId = activeResponse.data.session.id;
        
        const response = await apiClient.tasks.pomodoro.completeSession(sessionId);
        
        if (response.success) {
          setIsActive(false);
          setTimeLeft(0);
          message.success('番茄钟会话完成！');
          
          // 更新任务番茄钟计数
          if (currentTask) {
            queryClient.invalidateQueries(['tasks']);
          }
        }
      }
    } catch (error) {
      message.error('完成番茄钟失败');
    }
  };

  // 倒计时逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      completePomodoro();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pomodoro-timer">
      <div className="timer-display">{formatTime(timeLeft)}</div>
      
      {!isActive ? (
        <button onClick={() => startPomodoro()}>开始番茄钟</button>
      ) : (
        <button onClick={completePomodoro}>完成番茄钟</button>
      )}
      
      {currentTask && (
        <div className="current-task">
          当前任务: {currentTask.title}
        </div>
      )}
    </div>
  );
};
```

### 4.2 番茄钟统计

```typescript
const PomodoroStats: React.FC = () => {
  const { data: stats } = useQuery(
    ['pomodoro-stats'],
    () => apiClient.tasks.pomodoro.getStats(7),
    {
      refetchInterval: 5 * 60 * 1000,
    }
  );

  if (!stats?.data) return null;

  const { totalSessions, completedSessions, totalMinutes, dailyStats } = stats.data;

  return (
    <div className="pomodoro-stats">
      <div className="stat-cards">
        <StatCard
          title="总会话数"
          value={totalSessions}
          icon="🍅"
        />
        <StatCard
          title="完成会话"
          value={completedSessions}
          icon="✅"
        />
        <StatCard
          title="总时长"
          value={`${totalMinutes}分钟`}
          icon="⏱️"
        />
      </div>
      
      <div className="daily-chart">
        <BarChart
          data={dailyStats}
          xAxis="date"
          yAxis="sessions"
          title="每日番茄钟会话"
        />
      </div>
    </div>
  );
};
```

## 错误处理

### 5.1 全局错误边界

```typescript
import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 可以在这里发送错误到错误追踪服务
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出错了</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5.2 API错误处理

```typescript
// 创建错误处理Hook
const useApiError = () => {
  const [error, setError] = useState<string | null>(null);

  const handleApiError = (error: any) => {
    let errorMessage = '操作失败';

    if (error.response) {
      // 服务器返回的错误
      switch (error.response.status) {
        case 400:
          errorMessage = '输入数据验证失败';
          break;
        case 401:
          errorMessage = '未授权，请重新登录';
          // 清除认证状态并跳转到登录页
          break;
        case 403:
          errorMessage = '权限不足';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 409:
          errorMessage = '数据冲突';
          break;
        case 429:
          errorMessage = '请求过于频繁，请稍后重试';
          break;
        case 500:
          errorMessage = '服务器错误，请稍后重试';
          break;
        default:
          errorMessage = error.response.data?.message || '未知错误';
      }
    } else if (error.request) {
      // 网络错误
      errorMessage = '网络连接失败，请检查网络连接';
    } else {
      // 其他错误
      errorMessage = error.message || '操作失败';
    }

    setError(errorMessage);
    return errorMessage;
  };

  const clearError = () => setError(null);

  return { error, handleApiError, clearError };
};

// 在组件中使用
const SomeComponent = () => {
  const { error, handleApiError, clearError } = useApiError();

  const handleSomeAction = async () => {
    try {
      const response = await apiClient.tasks.getAll();
      // 处理响应
    } catch (error) {
      const errorMessage = handleApiError(error);
      message.error(errorMessage);
    }
  };

  return (
    <div>
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          closable
          onClose={clearError}
        />
      )}
      <button onClick={handleSomeAction}>执行操作</button>
    </div>
  );
};
```

## 状态管理

### 6.1 使用Zustand进行状态管理

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) => set({ user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setIsLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// store/taskStore.ts
interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  filters: TaskFilters;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: number, updates: Partial<Task>) => void;
  removeTask: (taskId: number) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: TaskFilters) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  filters: {
    category: '',
    priority: '',
    completed: undefined,
    search: '',
  },
  
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  })),
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== taskId),
  })),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setFilters: (filters) => set({ filters }),
}));
```

### 6.2 在组件中使用状态

```typescript
const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { clearAllData } = apiClient.utils;

  const handleLogout = async () => {
    await apiClient.auth.logout();
    logout();
    clearAllData();
    message.success('登出成功');
  };

  return (
    <header>
      {isAuthenticated ? (
        <div>
          <span>欢迎, {user?.username}</span>
          <button onClick={handleLogout}>登出</button>
        </div>
      ) : (
        <div>
          <link to="/login">登录</link>
          <link to="/register">注册</link>
        </div>
      )}
    </header>
  );
};
```

## 性能优化

### 7.1 React Query配置

```typescript
// config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 7.2 虚拟滚动优化长列表

```typescript
import { FixedSizeList as List } from 'react-window';

const TaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 7.3 图片懒加载

```typescript
import { useInView } from 'react-intersection-observer';

const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <div ref={ref} className="lazy-image-container">
      {inView ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="image-placeholder">加载中...</div>
      )}
    </div>
  );
};
```

## 测试

### 8.1 组件测试

```typescript
// __tests__/TaskList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskList from '../components/TaskList';
import { vi } from 'vitest';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock('../config/api-client', () => ({
  default: {
    tasks: {
      getAll: vi.fn().mockResolvedValue({
        success: true,
        data: {
          tasks: [
            { id: 1, title: '任务1', completed: false },
            { id: 2, title: '任务2', completed: true },
          ],
          pagination: { page: 1, total: 2 },
        },
      }),
    },
  },
}));

describe('TaskList', () => {
  it('renders task list correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskList page={1} limit={10} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('任务1')).toBeInTheDocument();
      expect(screen.getByText('任务2')).toBeInTheDocument();
    });
  });
});
```

### 8.2 API集成测试

```typescript
// __tests__/api/task.test.ts
import { describe, it, expect, vi } from 'vitest';
import apiClient from '../../config/api-client';

describe('Task API', () => {
  it('creates task successfully', async () => {
    const mockResponse = {
      success: true,
      data: { id: 1, title: '测试任务' },
    };

    vi.spyOn(apiClient.tasks, 'create').mockResolvedValue(mockResponse);

    const response = await apiClient.tasks.create({
      title: '测试任务',
      description: '测试描述',
    });

    expect(response.success).toBe(true);
    expect(response.data.title).toBe('测试任务');
  });

  it('handles API errors correctly', async () => {
    const mockError = {
      response: {
        status: 400,
        data: { message: '任务标题不能为空' },
      },
    };

    vi.spyOn(apiClient.tasks, 'create').mockRejectedValue(mockError);

    await expect(apiClient.tasks.create({ title: '' })).rejects.toEqual(mockError);
  });
});
```

## 部署

### 9.1 构建配置

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

### 9.2 环境配置

```typescript
// config/env.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_ENABLE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export const getEnvVar = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || defaultValue;
};

export const ENV = {
  API_URL: getEnvVar('VITE_API_URL', 'http://localhost:3001/api'),
  API_TIMEOUT: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000')),
  ENABLE_MOCK: getEnvVar('VITE_ENABLE_MOCK', 'false') === 'true',
  NODE_ENV: getEnvVar('MODE', 'development'),
};
```

### 9.3 Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## 最佳实践

### 10.1 代码组织

```
src/
├── api/                    # API客户端和配置
│   ├── api-client.ts
│   └── endpoints.ts
├── components/             # React组件
│   ├── common/            # 通用组件
│   ├── tasks/             # 任务相关组件
│   ├── auth/              # 认证相关组件
│   └── pomodoro/          # 番茄钟组件
├── hooks/                  # 自定义Hook
│   ├── useAuth.ts
│   ├── useTasks.ts
│   └── usePomodoro.ts
├── stores/                 # 状态管理
│   ├── authStore.ts
│   └── taskStore.ts
├── utils/                  # 工具函数
│   ├── formatters.ts
│   └── validators.ts
├── types/                  # TypeScript类型定义
│   ├── api.types.ts
│   └── models.ts
├── styles/                 # 样式文件
│   ├── globals.css
│   └── variables.css
└── config/                 # 配置文件
    ├── queryClient.ts
    └── constants.ts
```

### 10.2 开发规范

1. **组件设计**
   - 保持组件单一职责
   - 使用组合而非继承
   - 合理使用自定义Hook

2. **状态管理**
   - 优先使用React Query处理服务端状态
   - 使用Zustand管理客户端状态
   - 避免过度使用全局状态

3. **错误处理**
   - 统一的错误处理机制
   - 用户友好的错误消息
   - 适当的错误恢复策略

4. **性能优化**
   - 使用React.memo优化重渲染
   - 合理使用useCallback和useMemo
   - 实现虚拟滚动处理长列表

5. **安全性**
   - 输入验证和清理
   - XSS防护
   - 敏感信息加密存储

### 10.3 代码示例

```typescript
// 组件模板
import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/api-client';
import { useAuthStore } from '../stores/authStore';
import type { Task } from '../types/models';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

const TaskItem: React.FC<TaskItemProps> = memo(({ task, onUpdate, onDelete }) => {
  const { isAuthenticated } = useAuthStore();
  
  const handleUpdate = async () => {
    try {
      const response = await apiClient.tasks.update(task.id, { completed: !task.completed });
      if (response.success) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  return (
    <div className="task-item">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleUpdate}
        disabled={!isAuthenticated}
      />
      <span className={task.completed ? 'completed' : ''}>{task.title}</span>
      <button onClick={() => onDelete(task.id)}>删除</button>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
```

## 总结

本指南提供了Arzu Simulator前端集成的完整解决方案，包括：

1. **完整的认证流程** - 注册、登录、令牌管理
2. **丰富的任务管理功能** - CRUD操作、搜索、过滤、统计
3. **集成的番茄钟功能** - 会话管理、统计、分析
4. **健壮的错误处理** - 全局错误边界、API错误处理
5. **高效的状态管理** - 使用Zustand和React Query
6. **性能优化策略** - 缓存、虚拟滚动、懒加载
7. **完整的测试方案** - 组件测试、集成测试
8. **生产部署指南** - Docker、CI/CD、监控

通过遵循这些指南和最佳实践，您可以构建一个功能完善、性能优秀、用户体验良好的任务管理应用。

## 支持与反馈

如果您在集成过程中遇到问题或有改进建议，请通过以下方式联系我们：

- 提交Issue到项目仓库
- 发送邮件至：support@arzu.com
- 加入我们的开发者社区

祝您开发顺利！🚀