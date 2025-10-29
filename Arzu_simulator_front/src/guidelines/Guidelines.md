# 任务管理应用设计系统指南

## 概述

本设计系统旨在为任务管理应用提供统一、一致的用户界面体验。所有组件都遵循极简设计理念，确保在移动端设备上提供最佳的用户体验。

---

## 1. 设计原则

### 1.1 极简主义
- 去除不必要的装饰元素
- 专注于功能性和可用性
- 使用简洁的几何形状
- 保持视觉层次清晰

### 1.2 一致性
- 统一的视觉语言
- 标准化的交互模式
- 可预测的用户体验

### 1.3 移动优先
- 触摸友好的交互设计
- 响应式布局
- 性能优化

---

## 2. 字体与排版

### 2.1 基础规范
- **基础字号**: 14px (var(--font-size))
- **字体家族**: ABeeZee, Noto Sans SC, Noto Sans JP, sans-serif
- **行高**: 1.5 (所有文本元素)

### 2.2 字重规范
- **普通文本**: 400 (var(--font-weight-normal))
- **强调文本**: 500 (var(--font-weight-medium))
- **按钮文本**: 500 (var(--font-weight-medium))

### 2.3 文本层级
```css
/* 标题层级 */
h1: font-size: 1.5rem, font-weight: medium
h2: font-size: 1.25rem, font-weight: medium  
h3: font-size: 1.125rem, font-weight: medium
h4: font-size: 1rem, font-weight: medium

/* 正文和输入 */
p: font-size: 1rem, font-weight: normal
input: font-size: 1rem, font-weight: normal
label: font-size: 1rem, font-weight: medium

/* 按钮 */
button: font-size: 14px, font-weight: medium
```

### 2.4 使用规范
- 所有按钮必须使用14px字号，不得使用Tailwind的字号类
- 保持原有字体颜色不变
- 间距和对齐方式统一使用设计系统变量

---

## 3. 颜色系统

### 3.1 核心颜色
- **统一边框色**: #3A3F47 (var(--unified-border-color))
- **背景色**: 保持现有配色方案
- **文字色**: 保持现有配色方案

### 3.2 使用原则
- 除边框颜色统一外，其他颜色保持原有设计
- 优先使用CSS变量定义的语义化颜色
- 确保足够的对比度以满足可访问性要求

---

## 4. 组件规范

### 4.1 按钮 (Button)

#### 基础规范
- **圆角**: 6px (var(--button-border-radius))
- **边框**: 1px solid #3A3F47
- **阴影**: 无阴影效果
- **字号**: 14px
- **字重**: 500 (medium)
- **内边距**: 12px 16px (var(--button-padding-y) var(--button-padding-x))

#### 实现方式

**方案一：使用统一按钮类（推荐）**
```tsx
<button className="unified-button bg-[#4CAF50] text-white">
  按钮文本
</button>
```

**方案二：使用Tailwind组合类**
```tsx
<button 
  className="inline-flex items-center justify-center px-4 py-3 border border-[#3A3F47] rounded-md bg-[#4CAF50] text-white font-medium text-sm leading-5 transition-all duration-200 shadow-none"
  style={{
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    boxShadow: 'none'
  }}
>
  按钮文本
</button>
```

#### 尺寸变体
```css
.unified-button-sm    /* 小按钮: 8px 12px, 12px字号 */
.unified-button       /* 标准按钮: 12px 16px, 14px字号 */
.unified-button-lg    /* 大按钮: 16px 24px, 16px字号 */
.unified-button-icon  /* 图标按钮: 40x40px */
```

#### 形状变体
```css
.unified-button-round   /* 圆形按钮 */
.unified-button-square  /* 方形按钮 */
```

#### 状态规范
- **默认**: 标准样式
- **悬停**: 保持原有悬停效果
- **激活**: 保持原有激活效果
- **禁用**: 50%透明度，禁用光标
- **聚焦**: 2px边框轮廓，偏移2px

### 4.2 信息呈现区域 (Content Areas)

#### 基础规范
- **圆角**: 10px (var(--content-border-radius))
- **边框**: 1px solid #3A3F47
- **内边距**: 16px (var(--content-padding))
- **阴影**: 无阴影效果

#### 实现方式

**方案一：使用统一内容类（推荐）**
```tsx
<div className="unified-content">
  内容区域
</div>
```

**方案二：使用Tailwind组合类**
```tsx
<div 
  className="border border-[#3A3F47] p-4 bg-white"
  style={{
    borderRadius: '10px',
    boxShadow: 'none'
  }}
>
  内容区域
</div>
```

#### 尺寸变体
```css
.unified-content-sm      /* 小内边距: 12px */
.unified-content         /* 标准内边距: 16px */
.unified-content-lg      /* 大内边距: 24px */
.unified-content-no-padding  /* 无内边距 */
```

#### 特殊变体
```css
.unified-content-no-border   /* 无边框版本 */
```

### 4.3 输入框 (Input)

#### 基础规范
- **圆角**: 6px (继承按钮圆角)
- **边框**: 1px solid #3A3F47
- **字号**: 14px
- **字重**: 400 (normal)
- **内边距**: 12px 16px

#### 实现方式

**方案一：使用统一输入类（推荐）**
```tsx
<input className="unified-input" />
<textarea className="unified-textarea" />
<select className="unified-select" />
```

**方案二：使用Tailwind组合类**
```tsx
<input 
  className="border border-[#3A3F47] px-4 py-3 bg-[#f3f3f5]"
  style={{
    fontSize: '14px',
    fontWeight: '400',
    borderRadius: '6px',
    boxShadow: 'none'
  }}
/>
```

### 4.4 任务卡片 (Task Card)

#### 实现方式

**方案一：使用任务卡片类（推荐）**
```tsx
<div className="task-card">
  任务内容
</div>
```

**方案二：使用Tailwind组合类**
```tsx
<div 
  className="border border-[#3A3F47] p-4 bg-white"
  style={{
    borderRadius: '10px',
    boxShadow: 'none'
  }}
>
  任务内容
</div>
```

### 4.5 模态框 (Modal)

#### 实现方式

**方案一：使用模态框类（推荐）**
```tsx
<div className="modal-content">
  模态框内容
</div>
```

**方案二：使用Tailwind组合类**
```tsx
<div 
  className="border border-[#3A3F47] p-4 bg-white"
  style={{
    borderRadius: '10px',
    boxShadow: 'none'
  }}
>
  模态框内容
</div>
```

---

## 5. 布局与空间

### 5.1 间距系统
- **基础间距**: 12px (var(--unified-gap))
- **小间距**: 8px
- **大间距**: 16px
- **特大间距**: 24px

### 5.2 间距工具类

**方案一：使用统一间距类**
```css
.unified-gap        /* 12px间距 */
.unified-gap-sm     /* 8px间距 */
.unified-gap-lg     /* 16px间距 */
.unified-gap-xl     /* 24px间距 */

.unified-padding    /* 16px内边距 */
.unified-margin     /* 12px外边距 */
```

**方案二：使用Tailwind标准类**
```tsx
<div className="gap-3">      {/* 12px间距 */}
<div className="gap-2">      {/* 8px间距 */}
<div className="gap-4">      {/* 16px间距 */}
<div className="gap-6">      {/* 24px间距 */}

<div className="p-4">        {/* 16px内边距 */}
<div className="m-3">        {/* 12px外边距 */}
```

### 5.3 网格系统
- 使用Flexbox和Grid进行布局
- 保持元素对齐的一致性
- 响应式设计优先

### 5.4 布局原则
- 垂直间距保持一致
- 水平对齐遵循网格系统
- 内容区域之间有清晰的分隔
- 触摸目标不小于44x44px

---

## 6. 图标与图形

### 6.1 图标规范
- **风格**: 极简线性图标
- **描边宽度**: 1.5px (默认)
- **大小**: 通常16px或24px
- **颜色**: 继承父元素文字颜色

### 6.2 图标工具类

**方案一：使用图标类**
```css
.minimal-icon       /* 标准描边宽度 1.5px */
.minimal-icon-bold  /* 粗描边 2px */
.minimal-icon-light /* 细描边 1px */
```

**方案二：直接设置样式**
```tsx
<Icon 
  className="w-4 h-4"
  style={{
    strokeWidth: '1.5',
    stroke: 'currentColor',
    fill: 'none'
  }}
/>
```

### 6.3 装饰元素

**方案一：使用装饰类**
```css
.minimal-divider    /* 极简分隔线 */
.minimal-badge      /* 极简徽章 */
```

**方案二：使用Tailwind组合**
```tsx
{/* 分隔线 */}
<hr 
  className="border-none h-px bg-[#3A3F47] my-3"
/>

{/* 徽章 */}
<span 
  className="inline-flex items-center px-2 py-1 border border-[#3A3F47] bg-transparent text-xs font-medium"
  style={{ borderRadius: '6px' }}
>
  徽章文本
</span>
```

---

## 7. 交互设计

### 7.1 触摸友好性
- 最小触摸目标: 44x44px
- 按钮间距: 至少8px
- 使用`.touch-friendly`类或`min-h-11 min-w-11`确保触摸目标大小

### 7.2 反馈机制
- 即时视觉反馈
- 加载状态指示
- 错误状态提示
- 成功状态确认

### 7.3 过渡动画
- 使用CSS过渡: `transition: all 0.2s ease-in-out`
- 避免过于复杂的动画
- 保持性能优化

---

## 8. 响应式设计

### 8.1 断点系统
遵循Tailwind默认断点:
- sm: 640px
- md: 768px  
- lg: 1024px
- xl: 1280px

### 8.2 移动优化

**方案一：使用优化类**
```css
.mobile-optimized   /* 移动端优化文本 */
.no-scroll         /* 禁用滚动 */
```

**方案二：使用Tailwind类**
```tsx
<div className="text-sm leading-relaxed touch-manipulation">
  移动端优化内容
</div>

<div className="overflow-hidden overscroll-none">
  禁用滚动内容
</div>
```

### 8.3 设计原则
- 移动优先设计
- 内容优先级清晰
- 导航简洁直观
- 加载性能优化

---

## 9. 实施指南

### 9.1 新组件开发
1. **优先使用统一样式类**: 如`.unified-button`、`.unified-content`等
2. **备选方案**: 如果统一类不可用，使用Tailwind组合类+内联样式
3. **遵循设计系统变量**: 使用CSS变量确保一致性
4. **添加必要的可访问性属性**: 确保组件支持屏幕阅读器等辅助技术

### 9.2 现有组件改造
1. **逐步应用统一样式类**: 优先使用`.unified-button`等预定义类
2. **保持功能不变**: 确保样式改造不影响组件功能
3. **测试各种状态和设备**: 验证在不同环境下的表现
4. **确保向后兼容**: 避免破坏性变更

### 9.3 质量检查
- [ ] 按钮字号为14px（强制要求）
- [ ] 按钮圆角为6px
- [ ] 边框颜色为#3A3F47
- [ ] 无不必要的阴影（box-shadow: none）
- [ ] 间距使用统一变量或标准间距
- [ ] 移动端触摸友好（最小44x44px）
- [ ] 可访问性符合标准

---

## 10. 快速实现指南

### 10.1 标准按钮

**推荐写法**
```tsx
<button className="unified-button bg-[#4CAF50] text-white">
  确认
</button>
```

**备选写法**
```tsx
<button 
  className="inline-flex items-center justify-center px-4 py-3 border border-[#3A3F47] bg-[#4CAF50] text-white font-medium transition-all duration-200"
  style={{
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    boxShadow: 'none'
  }}
>
  确认
</button>
```

### 10.2 任务卡片

**推荐写法**
```tsx
<div className="task-card gap-3">
  <h3>任务标题</h3>
  <p>任务描述</p>
  <div className="flex gap-2">
    <button className="unified-button-sm bg-blue-500 text-white">编辑</button>
    <button className="unified-button-sm bg-red-500 text-white">删除</button>
  </div>
</div>
```

**备选写法**
```tsx
<div 
  className="border border-[#3A3F47] p-4 bg-white gap-3"
  style={{
    borderRadius: '10px',
    boxShadow: 'none'
  }}
>
  <h3>任务标题</h3>
  <p>任务描述</p>
  <div className="flex gap-2">
    <button 
      className="px-3 py-2 border border-[#3A3F47] bg-blue-500 text-white font-medium"
      style={{
        fontSize: '12px',
        borderRadius: '6px',
        boxShadow: 'none'
      }}
    >
      编辑
    </button>
    <button 
      className="px-3 py-2 border border-[#3A3F47] bg-red-500 text-white font-medium"
      style={{
        fontSize: '12px', 
        borderRadius: '6px',
        boxShadow: 'none'
      }}
    >
      删除
    </button>
  </div>
</div>
```

### 10.3 表单组件

**推荐写法**
```tsx
<div className="unified-content gap-3">
  <label>任务标题</label>
  <input className="unified-input" type="text" />
  <textarea className="unified-textarea" placeholder="任务描述"></textarea>
  <button className="unified-button bg-green-500 text-white">保存</button>
</div>
```

**备选写法**
```tsx
<div 
  className="border border-[#3A3F47] p-4 bg-white flex flex-col gap-3"
  style={{
    borderRadius: '10px',
    boxShadow: 'none'
  }}
>
  <label className="font-medium">任务标题</label>
  <input 
    className="border border-[#3A3F47] px-4 py-3 bg-[#f3f3f5]"
    style={{
      fontSize: '14px',
      borderRadius: '6px',
      boxShadow: 'none'
    }}
    type="text" 
  />
  <textarea 
    className="border border-[#3A3F47] px-4 py-3 bg-[#f3f3f5] min-h-20 resize-y"
    style={{
      fontSize: '14px',
      borderRadius: '6px',
      boxShadow: 'none'
    }}
    placeholder="任务描述"
  />
  <button 
    className="inline-flex items-center justify-center px-4 py-3 border border-[#3A3F47] bg-green-500 text-white font-medium"
    style={{
      fontSize: '14px',
      borderRadius: '6px', 
      boxShadow: 'none'
    }}
  >
    保存
  </button>
</div>
```

---

## 11. 故障排除

### 11.1 如果统一样式类不生效

使用备选的Tailwind组合类+内联样式方案：

```tsx
// 替换这种写法：
<button className="unified-button bg-blue-500 text-white">点击</button>

// 使用这种写法：
<button 
  className="inline-flex items-center justify-center px-4 py-3 border border-[#3A3F47] bg-blue-500 text-white font-medium transition-all duration-200"
  style={{
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    boxShadow: 'none'
  }}
>
  点击
</button>
```

### 11.2 强制样式覆盖

如果需要强制覆盖现有样式：

```tsx
<button 
  className="your-existing-classes"
  style={{
    fontSize: '14px !important',
    fontWeight: '500 !important',
    borderRadius: '6px !important',
    border: '1px solid #3A3F47 !important',
    boxShadow: 'none !important'
  }}
>
  按钮
</button>
```

### 11.3 组件库组件适配

对于ShadCN或其他组件库的组件：

```tsx
import { Button } from './components/ui/button';

// 覆盖组件库默认样式
<Button 
  className="border-[#3A3F47] font-medium"
  style={{
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    boxShadow: 'none'
  }}
>
  按钮文本
</Button>
```

---

## 12. 注意事项

### 12.1 强制要求 ⚠️
- ✅ **所有按钮必须使用14px字号** - 这是非协商的要求
- ✅ **禁止使用Tailwind字号类** - 不要使用 `text-sm`, `text-lg` 等
- ✅ **必须使用6px按钮圆角** - 使用 `borderRadius: '6px'` 或统一类
- ✅ **必须使用#3A3F47边框颜色** - 所有边框使用这个颜色
- ✅ **禁止添加阴影效果** - 使用 `boxShadow: 'none'` 或 `shadow-none`

### 12.2 灵活调整 🎨
- 🎨 **背景颜色保持原有设计** - 不改变现有的背景色方案
- 🎨 **文字颜色保持原有设计** - 保持现有的文字颜色
- 🎨 **特殊功能按钮可以保持原有配色** - 功能色彩可以保留
- 🎨 **品牌相关视觉元素可以保持不变** - 品牌识别元素不变

### 12.3 实施优先级
1. **功能性 > 美观性** - 确保功能正常比视觉效果更重要
2. **用户体验 > 视觉效果** - 优先考虑交互体验
3. **一致性 > 个性化** - 统一性比个别特色更重要
4. **可访问性 > 装饰效果** - 无障碍访问比装饰更重要

### 12.4 开发建议
- 🔄 **优先尝试统一样式类** - 如 `.unified-button`、`.task-card` 等
- 🔄 **备选方案准备** - 准备Tailwind+内联样式的备选方案
- 🔄 **逐步迁移** - 不需要一次性改完，可以逐步应用
- 🔄 **测试验证** - 每次改动后都要测试功能是否正常

---

**设计系统版本**: v1.1  
**最后更新**: 2024年12月  
**维护者**: 开发团队  

这个设计系统将随着项目发展不断完善，请确保所有新功能都遵循这些规范。如果遇到技术问题导致统一样式类无法使用，请使用备选的Tailwind组合类方案，但必须保持设计规范的一致性。