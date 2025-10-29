# 素材文件迁移指南

本指南说明如何将项目中的素材文件从分散的位置迁移到统一的 `/assets` 文件夹中。

## 文件夹结构

```
/assets/
├── index.ts              # 统一素材管理文件
├── images/               # 图片资源文件夹
│   ├── nursery-background.png
│   ├── character-2000312.png
│   ├── rectangle-mask.png
│   ├── progress-bar-bg.png
│   └── green-frame-bg.png
└── svg/                  # SVG图标文件夹
    ├── rose-garden-icons.ts
    ├── status-bar-icons.ts
    └── calendar-icons.ts
```

## 迁移映射表

### 图片文件迁移

| 原路径 | 新路径 | 描述 |
|--------|--------|------|
| `figma:asset/1dc71bd62c1ce2116211c9f2619109da420fc338.png` | `/assets/images/nursery-background.png` | 苗圃背景图 |
| `figma:asset/6ccd74f326c6127a1242cc03fb5659aa209f5e54.png` | `/assets/images/character-2000312.png` | 角色图片 |
| `figma:asset/43b5eee8b9ef3c1f2cc90442f5116678db2da58f.png` | `/assets/images/rectangle-mask.png` | 矩形遮罩 |
| `figma:asset/6e511b6a9335ffcbd635916ed741841241f7001e.png` | `/assets/images/progress-bar-bg.png` | 进度条背景 |
| `figma:asset/b69b0f9f6604e8cbc961d3915695b4fd7203c7c8.png` | `/assets/images/green-frame-bg.png` | 绿色边框背景 |

### SVG文件迁移

| 原路径 | 新路径 | 描述 |
|--------|--------|------|
| `../imports/svg-p45xihpjhc` | `../assets/svg/rose-garden-icons` | 玫瑰园图标 |
| `../imports/svg-j3e87w7dyb` | `../assets/svg/status-bar-icons` | 状态栏图标 |
| `../imports/svg-7jh1qw4fhc` | `../assets/svg/calendar-icons` | 日历图标 |
| `../imports/svg-ktaaro5dmo` | `../assets/svg/calendar-icons` | 日历图标（重复） |
| `../imports/svg-y2ssk1vz7b` | `../assets/svg/calendar-icons` | 日历图标（重复） |

## 代码更新示例

### 图片引用更新

**更新前：**
```tsx
import img from "figma:asset/1dc71bd62c1ce2116211c9f2619109da420fc338.png";
import img200031211 from "figma:asset/6ccd74f326c6127a1242cc03fb5659aa209f5e54.png";
```

**更新后：**
```tsx
import img from "../assets/images/nursery-background.png";
import img200031211 from "../assets/images/character-2000312.png";

// 或者使用统一管理方式：
import { images } from "../assets";
// 然后使用 images.nurseryBackground 和 images.character2000312
```

### SVG引用更新

**更新前：**
```tsx
import svgPaths from "../imports/svg-p45xihpjhc";
```

**更新后：**
```tsx
import svgPaths from "../assets/svg/rose-garden-icons";

// 或者使用统一管理方式：
import { roseGardenIcons } from "../assets";
// 然后使用 roseGardenIcons.p1234567
```

## 已完成迁移的文件

✅ **RoseGardenView.tsx**
- SVG路径: `../imports/svg-p45xihpjhc` → `../assets/svg/rose-garden-icons`
- 图片1: `figma:asset/1dc71bd62c1ce2116211c9f2619109da420fc338.png` → `../assets/images/nursery-background.png`
- 图片2: `figma:asset/6ccd74f326c6127a1242cc03fb5659aa209f5e54.png` → `../assets/images/character-2000312.png`

✅ **BackgroundElements.tsx**
- 图片1: `figma:asset/43b5eee8b9ef3c1f2cc90442f5116678db2da58f.png` → `../assets/images/rectangle-mask.png`
- 图片2: `figma:asset/6e511b6a9335ffcbd635916ed741841241f7001e.png` → `../assets/images/progress-bar-bg.png`
- 图片3: `figma:asset/b69b0f9f6604e8cbc961d3915695b4fd7203c7c8.png` → `../assets/images/green-frame-bg.png`

✅ **StatusBar.tsx**
- SVG路径: `../imports/svg-j3e87w7dyb` → `../assets/svg/status-bar-icons`

✅ **TaskCard.tsx**
- SVG路径: `../imports/svg-7jh1qw4fhc` → `../assets/svg/calendar-icons`
- 删除图标: `figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png` → `../assets/images/delete-icon.png`
- 爱人任务图标: `figma:asset/b97483069f151bb18d9e3e16d09bdec9a832ba18.png` → `../assets/images/task-type-airen.png`
- 勤政任务图标: `figma:asset/a6c466edcfc15b1b3db48bdf6993661a98e84ddd.png` → `../assets/images/task-type-qinzheng.png`
- 恕己任务图标: `figma:asset/77dfb21b6ae5b3e017b8309d5b6bc1907545c62e.png` → `../assets/images/task-type-shujie.png`

## 待迁移的文件

需要检查以下文件是否使用了素材引用：
- EditablePomodoroView.tsx
- TaskCard.tsx
- TaskCreationModal.tsx
- SettingsView.tsx
- WeeklyView.tsx
- 其他组件文件

## 迁移步骤

1. **检查文件引用**
   ```bash
   # 搜索 figma:asset 引用
   grep -r "figma:asset" components/
   
   # 搜索 imports/ 引用
   grep -r "../imports/" components/
   ```

2. **替换引用路径**
   - 使用编辑器的查找替换功能
   - 或者手动逐个文件更新

3. **验证更新**
   - 确保所有路径都正确指向新的assets文件夹
   - 测试应用是否正常加载素材

4. **清理旧文件**
   - 在确认迁移完成后，可以删除 `/imports` 文件夹
   - 删除不再使用的素材文件

## 注意事项

1. **占位符文件**：当前 `/assets/images/` 中的文件是占位符，实际部署时需要替换为真实的图片文件。

2. **路径一致性**：确保所有引用路径都使用相对路径，以保证在不同环境下的兼容性。

3. **TypeScript类型**：如果使用TypeScript，可能需要在 `types.d.ts` 中声明图片模块类型。

4. **构建工具配置**：确保构建工具（如Webpack、Vite等）能够正确处理新的资源路径。

## 测试检查清单

- [ ] 所有图片都能正常显示
- [ ] 所有SVG图标都能正常渲染
- [ ] 没有控制台错误或404请求
- [ ] 应用在开发和生产环境下都正常工作
- [ ] 新的assets文件夹结构清晰明了

## 后续维护

1. **新素材添加**：所有新的素材文件都应该放在 `/assets` 文件夹中
2. **命名规范**：使用有意义的文件名，避免使用哈希值或随机字符
3. **文档更新**：在添加新素材时，更新 `/assets/index.ts` 文件
4. **定期清理**：定期检查并清理不再使用的素材文件