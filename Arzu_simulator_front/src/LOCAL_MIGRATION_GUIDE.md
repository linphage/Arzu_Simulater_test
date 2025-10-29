# 任务管理应用本地化迁移指南

这是一个详细的指南，帮助您将这个Figma Make任务管理应用项目迁移到本地开发环境进行进一步开发。

## 📋 项目概览

这是一个功能完整的移动端任务管理应用，包含以下核心功能：
- 任务创建、管理和删除
- 番茄钟专注计时器
- 玫瑰园任务视图
- 设置和统计分析
- 完整的UI/UX设计系统

## 🚀 快速开始

### 1. 环境要求

确保您的开发环境具备以下条件：
- Node.js 18+ 
- npm 或 yarn 或 pnpm
- Git
- 现代代码编辑器（推荐 VS Code）

### 2. 创建新的React项目

```bash
# 使用Vite创建React+TypeScript项目
npm create vite@latest task-manager-app -- --template react-ts
cd task-manager-app
```

### 3. 安装依赖包

```bash
# 基础依赖
npm install react react-dom
npm install -D @types/react @types/react-dom typescript

# Tailwind CSS v4 (最新版本)
npm install tailwindcss@next @tailwindcss/vite@next

# UI库和工具
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge

# 表单和验证
npm install react-hook-form@7.55.0

# 通知系统
npm install sonner@2.0.3

# 动画库
npm install motion framer-motion

# 图表库
npm install recharts

# 轮播组件
npm install react-slick
npm install -D @types/react-slick

# 瀑布流布局
npm install react-responsive-masonry

# 拖拽功能
npm install react-dnd react-dnd-html5-backend

# 可调整大小组件
npm install re-resizable

# 开发工具（可选）
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 4. 配置Tailwind CSS v4

创建 `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'abeezee': ['ABeeZee', 'Noto Sans SC', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

更新 `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
```

## 📁 创建项目文件结构

在 `src` 目录下创建以下文件夹结构：

```bash
mkdir -p src/components/ui
mkdir -p src/components/figma
mkdir -p src/imports
mkdir -p src/styles
mkdir -p src/guidelines
mkdir -p public/images
```

## 📄 文件迁移清单

### 核心文件
- [x] `App.tsx` → `src/App.tsx`
- [x] `styles/globals.css` → `src/styles/globals.css`
- [x] `guidelines/Guidelines.md` → `src/guidelines/Guidelines.md`

### 主要组件 (components/)
- [x] `BackgroundElements.tsx`
- [x] `BottomNavigation.tsx`
- [x] `CalendarView.tsx`
- [x] `CompletionView.tsx`
- [x] `DateTimeModal.tsx`
- [x] `EditablePomodoroView.tsx`
- [x] `FocusAnalysisView.tsx`
- [x] `HabitAnalysisView.tsx`
- [x] `PomodoroView.tsx`
- [x] `RoseGardenView.tsx`
- [x] `SettingsView.tsx`
- [x] `SimpleToggle.tsx`
- [x] `StatusBar.tsx`
- [x] `TaskCard.tsx`
- [x] `TaskCreationModal.tsx`
- [x] `TaskOverview.tsx`
- [x] `TaskTypeModal.tsx`
- [x] `WeeklyOverview.tsx`
- [x] `WeeklyView.tsx`

### UI组件库 (components/ui/)
所有 ShadCN 组件：
- [x] `accordion.tsx` 到 `utils.ts`

### Figma组件 (components/figma/)
- [x] `ImageWithFallback.tsx`

### 导入文件 (imports/)
- [x] 所有 SVG 和 TSX 组件文件

## ⚙️ 配置文件设置

### 1. 更新 package.json

添加以下脚本：
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### 2. 更新 main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 3. 字体配置

在 `public/index.html` 或 `src/styles/globals.css` 顶部添加：

```css
@import url('https://fonts.googleapis.com/css2?family=ABeeZee:ital,wght@0,400;1,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');
```

## 🔧 导入路径更新

### 1. 组件导入路径规则

```typescript
// 相对导入（同级或子级）
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';

// 绝对导入（从src开始）
import { TaskCard } from '../components/TaskCard';

// 使用别名（需要配置）
import { TaskCard } from '@/components/TaskCard';
```

### 2. 图片和资源处理

如果有使用 `figma:asset` 路径的图片：

```typescript
// 原来的导入
import imgA from "figma:asset/76faf8f617b56e6f079c5a7ead8f927f5a5fee32.png";

// 更新为
import imgA from "/images/image-a.png";
// 或
import imgA from "@/assets/images/image-a.png";
```

## 📱 移动端优化配置

### 1. 视口配置

在 `index.html` 中确保有：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 2. PWA支持（可选）

如需要PWA功能，安装：
```bash
npm install -D vite-plugin-pwa
```

## 🐛 常见问题和解决方案

### 问题1: Tailwind样式不生效
**解决方案:**
- 确保 `globals.css` 正确导入
- 检查 `tailwind.config.ts` 的 content 路径
- 重启开发服务器

### 问题2: 组件导入错误
**解决方案:**
- 检查文件路径大小写
- 确保所有组件都有默认导出
- 检查 TypeScript 类型定义

### 问题3: 字体不显示
**解决方案:**
```css
/* 临时回退方案 */
font-family: system-ui, -apple-system, sans-serif;
```

### 问题4: ShadCN组件报错
**解决方案:**
- 确保安装了所有必要依赖
- 检查组件版本兼容性
- 参考 [ShadCN文档](https://ui.shadcn.com/)

### 问题5: 移动端样式问题
**解决方案:**
- 使用 Chrome DevTools 移动端模式测试
- 检查 CSS 单位使用（推荐使用 rem/em）
- 确保触摸事件正确处理

## 🔄 开发流程

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 构建生产版本
```bash
npm run build
```

### 3. 预览构建结果
```bash
npm run preview
```

## 🚀 部署选项

### Vercel (推荐)
1. 将代码推送到GitHub
2. 连接Vercel账户
3. 自动部署

### Netlify
1. 拖拽 `dist` 文件夹到Netlify
2. 或连接Git仓库自动部署

### 传统服务器
1. 运行 `npm run build`
2. 将 `dist` 文件夹上传到服务器

## 📈 性能优化建议

### 1. 代码分割
```typescript
import { lazy, Suspense } from 'react';

const PomodoroView = lazy(() => import('./components/PomodoroView'));
```

### 2. 图片优化
- 使用 WebP 格式
- 添加图片懒加载
- 压缩图片资源

### 3. 缓存策略
- 使用 PWA Service Worker
- 实现本地存储

## 📚 进一步开发建议

### 1. 数据持久化
```typescript
// 使用localStorage示例
const saveTasksToLocal = (tasks: TaskData[]) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

const loadTasksFromLocal = (): TaskData[] => {
  const saved = localStorage.getItem('tasks');
  return saved ? JSON.parse(saved) : [];
};
```

### 2. 状态管理
考虑使用：
- Redux Toolkit
- Zustand
- Jotai

### 3. 后端集成
- Supabase
- Firebase
- 自建API

### 4. 测试
```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

## 🎯 项目特色功能

### 1. 番茄钟计时器
- 高精度计时
- 后台运行支持
- 音效提醒

### 2. 任务管理系统
- 三种任务类型（勤政、恕己、爱人）
- 四种优先级（金卡、银卡、铜卡、石卡）
- 完整的统计分析

### 3. 响应式设计
- 移动优先设计
- 适配各种屏幕尺寸
- 触摸友好的交互

## 📞 技术支持

如果在迁移过程中遇到问题：

1. **检查控制台错误** - 大多数问题都能从错误信息中找到线索
2. **逐步迁移** - 先迁移核心功能，再添加复杂特性
3. **版本兼容** - 确保依赖包版本兼容
4. **参考文档** - 查看各个库的官方文档

## 🎉 完成检查清单

- [ ] 开发环境搭建完成
- [ ] 所有依赖包安装成功
- [ ] 文件结构创建完整
- [ ] 组件文件迁移完成
- [ ] 样式配置正确
- [ ] 字体加载正常
- [ ] 开发服务器运行正常
- [ ] 构建过程无错误
- [ ] 移动端测试通过
- [ ] 核心功能验证完成

---

**祝您迁移顺利！如有任何问题，请仔细检查每个步骤或参考相关技术文档。**