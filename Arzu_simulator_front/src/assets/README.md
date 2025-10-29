# 项目素材管理

这个文件夹包含项目的所有素材文件，包括图片和SVG图标。所有素材都按照统一的命名规范和文件夹结构进行组织。

## 文件夹结构

```
/assets/
├── README.md                 # 素材使用指南（本文件）
├── index.ts                 # 统一素材导出文件
├── MIGRATION_GUIDE.md       # 迁移指南
├── images/                  # 图片资源
│   ├── nursery-background.png      # 苗圃背景图
│   ├── character-2000312.png       # 角色图片
│   ├── rectangle-mask.png          # 矩形遮罩
│   ├── progress-bar-bg.png         # 进度条背景
│   ├── green-frame-bg.png          # 绿色边框背景
│   ├── delete-icon.png             # 删除图标
│   ├── task-type-qinzheng.png      # 勤政任务类型图标
│   ├── task-type-shujie.png        # 恕己任务类型图标
│   └── task-type-airen.png         # 爱人任务类型图标
└── svg/                     # SVG图标
    ├── rose-garden-icons.ts        # 玫瑰园相关图标
    ├── status-bar-icons.ts         # 状态栏图标
    └── calendar-icons.ts           # 日历相关图标
```

## 使用方法

### 方法一：直接导入（推荐）

```tsx
// 导入图片
import nurseryBg from "../assets/images/nursery-background.png";
import deleteIcon from "../assets/images/delete-icon.png";

// 导入SVG图标
import roseGardenIcons from "../assets/svg/rose-garden-icons";

// 使用
<img src={nurseryBg} alt="苗圃背景" />
<path d={roseGardenIcons.p1234567} />
```

### 方法二：通过统一导出文件

```tsx
// 导入统一管理的素材
import { images, roseGardenIcons } from "../assets";

// 使用
<img src={images.nurseryBackground} alt="苗圃背景" />
<path d={roseGardenIcons.p1234567} />
```

### 方法三：动态导入

```tsx
// 适用于需要动态选择素材的场景
import { images } from "../assets";

const getTaskTypeIcon = (taskType: string) => {
  switch (taskType) {
    case '勤政': return images.taskTypeQinzheng;
    case '恕己': return images.taskTypeShujie;
    case '爱人': return images.taskTypeAiren;
    default: return images.taskTypeQinzheng;
  }
};
```

## 命名规范

### 图片文件命名

- **功能描述-用途.png**：如 `nursery-background.png`
- **组件名-类型.png**：如 `task-type-qinzheng.png`
- **action-icon.png**：如 `delete-icon.png`

### SVG文件命名

- **功能区域-icons.ts**：如 `rose-garden-icons.ts`
- **组件名-icons.ts**：如 `status-bar-icons.ts`

## 添加新素材

### 添加新图片

1. 将图片文件放入 `/assets/images/` 文件夹
2. 按命名规范重命名文件
3. 在 `/assets/index.ts` 中添加导出

```tsx
// 在 images 对象中添加新图片
export const images = {
  // ... 现有图片
  newImage: "/assets/images/new-image.png",
};
```

### 添加新SVG图标集

1. 创建新的图标文件 `/assets/svg/new-icons.ts`
2. 按照现有格式定义图标路径

```tsx
export default {
  iconName1: "M...", // SVG路径数据
  iconName2: "M...",
};
```

3. 在 `/assets/index.ts` 中添加导出

```tsx
export { default as newIcons } from "./svg/new-icons";
```

## 性能优化建议

### 图片优化

1. **格式选择**
   - 照片类图片：使用 JPEG
   - 图标类图片：使用 PNG
   - 简单图形：考虑使用 SVG

2. **尺寸优化**
   - 提供多种尺寸版本：`@1x`、`@2x`、`@3x`
   - 使用响应式图片：`srcset` 和 `sizes`

3. **压缩**
   - 使用工具压缩图片文件
   - 移除不必要的元数据

### SVG优化

1. **精简代码**
   - 移除不必要的属性和注释
   - 合并相同的路径

2. **复用策略**
   - 将常用图标提取为独立组件
   - 使用 SVG Sprite 技术

## 维护指南

### 定期检查

1. **文件使用情况**
   ```bash
   # 检查未使用的图片文件
   grep -r "image-name" components/
   ```

2. **文件大小监控**
   ```bash
   # 查找大文件
   find assets/ -size +100k -type f
   ```

### 清理策略

1. **删除未使用的文件**
   - 定期检查并删除不再使用的素材文件
   - 更新 `/assets/index.ts` 中的导出

2. **版本控制**
   - 保留重要素材的多个版本
   - 使用有意义的版本命名

## 故障排除

### 常见问题

1. **图片不显示**
   - 检查文件路径是否正确
   - 确认文件是否存在
   - 检查文件权限

2. **SVG图标不渲染**
   - 确认SVG路径数据正确
   - 检查导入路径
   - 验证SVG语法

3. **性能问题**
   - 检查图片文件大小
   - 考虑使用懒加载
   - 优化图片格式

### 调试技巧

```tsx
// 调试图片加载
<img 
  src={images.nurseryBackground} 
  onLoad={() => console.log('图片加载成功')}
  onError={() => console.log('图片加载失败')}
  alt="苗圃背景" 
/>

// 调试SVG路径
console.log('SVG路径数据:', roseGardenIcons.p1234567);
```

## 贡献指南

### 提交新素材

1. 确保素材符合项目设计规范
2. 按照命名规范重命名文件
3. 更新相关文档
4. 提交PR并说明用途

### 素材质量要求

1. **图片要求**
   - 分辨率适中（避免过大文件）
   - 格式正确（PNG/JPEG/WebP）
   - 内容清晰，符合设计规范

2. **SVG要求**
   - 路径数据简洁
   - 无语法错误
   - 符合可访问性标准

---

**最后更新**：2024年12月  
**维护者**：开发团队

如有问题或建议，请联系项目维护者。