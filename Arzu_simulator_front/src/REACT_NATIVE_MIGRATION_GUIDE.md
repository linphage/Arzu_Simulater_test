# 青金石宫模拟器 React Native 迁移指南

## 📋 目录

1. [概述](#概述)
2. [环境准备](#环境准备)
3. [项目初始化](#项目初始化)
4. [核心组件映射](#核心组件映射)
5. [样式系统转换](#样式系统转换)
6. [导航系统迁移](#导航系统迁移)
7. [状态管理调整](#状态管理调整)
8. [资源文件处理](#资源文件处理)
9. [字体系统配置](#字体系统配置)
10. [平台特定功能](#平台特定功能)
11. [依赖库替换](#依赖库替换)
12. [逐步迁移流程](#逐步迁移流程)
13. [测试验证](#测试验证)
14. [性能优化](#性能优化)
15. [故障排除](#故障排除)

---

## 📖 概述

本指南将帮助你将"青金石宫模拟器"从React Web应用完整迁移到React Native移动应用。迁移后的应用将保持所有现有功能和设计，但使用原生移动组件提供更好的性能和用户体验。

### 迁移优势
- 🚀 **原生性能**: 使用原生组件，渲染性能更佳
- 📱 **移动体验**: 更好的手势支持和平台集成
- 🔋 **电池优化**: 更少的内存占用和CPU使用
- 📦 **应用分发**: 可以发布到App Store和Google Play
- 💾 **原生存储**: 使用原生存储API，数据持久化更可靠

---

## 🛠 环境准备

### 系统要求
- **Node.js**: 版本 18 或更高
- **npm/yarn**: 最新版本
- **React Native CLI**: `npm install -g @react-native-community/cli`

### iOS开发（仅限macOS）
```bash
# 安装Xcode（从App Store）
# 安装Xcode命令行工具
xcode-select --install

# 安装CocoaPods
sudo gem install cocoapods
```

### Android开发
```bash
# 下载并安装Android Studio
# 配置环境变量
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 🚀 项目初始化

### 1. 创建新的React Native项目
```bash
# 使用React Native CLI创建项目
npx react-native init QingJinShiGongSimulator

# 进入项目目录
cd QingJinShiGongSimulator

# 安装必要依赖
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-vector-icons react-native-svg
npm install @react-native-async-storage/async-storage
npm install react-native-device-info react-native-orientation-locker
```

### 2. iOS平台配置
```bash
cd ios && pod install && cd ..
```

### 3. 基础配置文件

**metro.config.js**
```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'ttf', 'otf', 'woff', 'woff2'],
    sourceExts: ['js', 'json', 'ts', 'tsx', 'svg'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

---

## 🔄 核心组件映射

### HTML → React Native 组件映射表

| Web组件 | React Native组件 | 导入语句 | 注意事项 |
|---------|------------------|----------|----------|
| `<div>` | `<View>` | `import {View} from 'react-native'` | 最常用的容器组件 |
| `<p>`, `<span>`, `<h1>~<h6>` | `<Text>` | `import {Text} from 'react-native'` | 所有文本必须包装在Text中 |
| `<button>` | `<TouchableOpacity>` | `import {TouchableOpacity} from 'react-native'` | 可点击的按钮组件 |
| `<input>` | `<TextInput>` | `import {TextInput} from 'react-native'` | 文本输入组件 |
| `<img>` | `<Image>` | `import {Image} from 'react-native'` | 图片显示组件 |
| `<textarea>` | `<TextInput multiline>` | `import {TextInput} from 'react-native'` | 多行文本输入 |
| `<ul>`, `<ol>` | `<FlatList>` 或 `<SectionList>` | `import {FlatList} from 'react-native'` | 列表渲染组件 |
| 滚动容器 | `<ScrollView>` | `import {ScrollView} from 'react-native'` | 可滚动容器 |

### 示例转换

**Web版本 (原始)**
```tsx
<div className="container">
  <h1 className="title">青金石宫模拟器</h1>
  <p className="description">任务管理应用</p>
  <button className="btn-primary" onClick={handleClick}>
    开始任务
  </button>
</div>
```

**React Native版本 (转换后)**
```tsx
import {View, Text, TouchableOpacity} from 'react-native';

<View style={styles.container}>
  <Text style={styles.title}>青金石宫模拟器</Text>
  <Text style={styles.description}>任务管理应用</Text>
  <TouchableOpacity style={styles.btnPrimary} onPress={handleClick}>
    <Text style={styles.btnText}>开始任务</Text>
  </TouchableOpacity>
</View>
```

---

## 🎨 样式系统转换

### Tailwind CSS → StyleSheet 转换

React Native使用StyleSheet.create()创建样式，而不是CSS类。

**创建样式转换工具 `src/utils/styles.ts`**
```typescript
import {StyleSheet, Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// 颜色常量
export const COLORS = {
  primary: '#DAE8F1', // 浅蓝色背景
  border: '#3A3F47', // 统一边框色
  text: '#3A3F47',
  white: '#FFFFFF',
  gray: '#6B7280',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
} as const;

// 尺寸常量
export const SIZES = {
  // 字体大小
  fontSize: 14,
  fontSizeSmall: 12,
  fontSizeLarge: 16,
  
  // 间距
  padding: 16,
  paddingSmall: 12,
  paddingLarge: 24,
  margin: 12,
  gap: 12,
  
  // 圆角
  borderRadius: 6,
  contentBorderRadius: 10,
  
  // 触摸目标最小尺寸
  touchTarget: 44,
  
  // 屏幕尺寸
  screenWidth,
  screenHeight,
} as const;

// 字体配置
export const FONTS = {
  regular: {
    fontFamily: 'ABeeZee-Regular',
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: 'ABeeZee-Regular',
    fontWeight: '500' as const,
  },
} as const;

// 统一基础样式
export const BASE_STYLES = StyleSheet.create({
  // 布局相关
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  // 边距和内边距
  padding: {
    padding: SIZES.padding,
  },
  paddingHorizontal: {
    paddingHorizontal: SIZES.padding,
  },
  paddingVertical: {
    paddingVertical: SIZES.padding,
  },
  margin: {
    margin: SIZES.margin,
  },
  
  // 文本样式
  text: {
    fontSize: SIZES.fontSize,
    color: COLORS.text,
    lineHeight: SIZES.fontSize * 1.5,
    ...FONTS.regular,
  },
  textMedium: {
    ...FONTS.medium,
  },
  
  // 按钮样式
  button: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: SIZES.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: SIZES.fontSize,
    ...FONTS.medium,
  },
  
  // 输入框样式
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    fontSize: SIZES.fontSize,
    backgroundColor: '#F3F3F5',
    minHeight: SIZES.touchTarget,
    ...FONTS.regular,
  },
  
  // 卡片样式
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.contentBorderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.padding,
  },
  
  // 阴影（仅在需要时使用）
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

// Tailwind类到React Native样式的映射函数
export const tw = (classNames: string): any => {
  const classes = classNames.split(' ');
  const styles: any = {};
  
  classes.forEach(className => {
    switch (className) {
      // Flexbox
      case 'flex':
        styles.display = 'flex';
        break;
      case 'flex-1':
        styles.flex = 1;
        break;
      case 'flex-row':
        styles.flexDirection = 'row';
        break;
      case 'flex-col':
        styles.flexDirection = 'column';
        break;
      case 'items-center':
        styles.alignItems = 'center';
        break;
      case 'justify-center':
        styles.justifyContent = 'center';
        break;
      case 'justify-between':
        styles.justifyContent = 'space-between';
        break;
      
      // 间距
      case 'gap-3':
        styles.gap = 12;
        break;
      case 'gap-4':
        styles.gap = 16;
        break;
      case 'p-4':
        styles.padding = 16;
        break;
      case 'px-4':
        styles.paddingHorizontal = 16;
        break;
      case 'py-3':
        styles.paddingVertical = 12;
        break;
      case 'm-3':
        styles.margin = 12;
        break;
      
      // 尺寸
      case 'w-full':
        styles.width = '100%';
        break;
      case 'h-full':
        styles.height = '100%';
        break;
      
      // 颜色
      case 'bg-white':
        styles.backgroundColor = COLORS.white;
        break;
      case 'text-gray-600':
        styles.color = COLORS.gray;
        break;
      
      // 边框
      case 'border':
        styles.borderWidth = 1;
        styles.borderColor = COLORS.border;
        break;
      case 'rounded-md':
        styles.borderRadius = SIZES.borderRadius;
        break;
      case 'rounded-lg':
        styles.borderRadius = SIZES.contentBorderRadius;
        break;
      
      default:
        break;
    }
  });
  
  return styles;
};
```

### 样式转换示例

**Web版本样式**
```tsx
<div className="flex flex-col gap-4 p-4 bg-white border border-[#3A3F47] rounded-lg">
  <h2 className="text-lg font-medium text-[#3A3F47]">任务标题</h2>
  <p className="text-sm text-gray-600">任务描述</p>
</div>
```

**React Native版本样式**
```tsx
const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.contentBorderRadius,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 27,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 21,
  },
});

<View style={styles.container}>
  <Text style={styles.title}>任务标题</Text>
  <Text style={styles.description}>任务描述</Text>
</View>
```

---

## 🧭 导航系统迁移

### React Navigation 配置

**安装依赖**
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler
```

**导航结构 `src/navigation/AppNavigator.tsx`**
```tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// 屏幕组件导入
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PomodoroScreen from '../screens/PomodoroScreen';
import RoseGardenScreen from '../screens/RoseGardenScreen';
import SettingsScreen from '../screens/SettingsScreen';

// 类型定义
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Pomodoro: {
    task: TaskData;
  };
  EditablePomodoro: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  RoseGarden: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 底部标签导航
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 89, // 与原设计保持一致
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.gray,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({color, size}) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RoseGarden"
        component={RoseGardenScreen}
        options={{
          tabBarLabel: '玫瑰园',
          tabBarIcon: ({color, size}) => (
            <Icon name="flower" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({color, size}) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 主导航器
function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isLoggedIn ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Pomodoro" component={PomodoroScreen} />
            <Stack.Screen name="EditablePomodoro" component={EditablePomodoroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
```

---

## 🗂 状态管理调整

### Context API转换

**创建应用上下文 `src/context/AppContext.tsx`**
```tsx
import React, {createContext, useContext, useReducer, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 类型定义（保持与Web版本一致）
interface TaskData {
  id: string;
  title: string;
  content: string;
  taskType: string;
  priority: string;
  dateTime?: {
    date: string;
    startTime: string;
  };
  isCompleted?: boolean;
  completedAt?: Date;
}

interface CompletedTask {
  id: string;
  title: string;
  content: string;
  taskType: string;
  priority: string;
  focusTime: number;
  completedAt: Date;
}

interface TaskStats {
  taskId: string;
  interruptions: number;
  abandonments: number;
  totalFocusTime: number;
}

interface AppState {
  isLoggedIn: boolean;
  tasks: TaskData[];
  completedTasks: CompletedTask[];
  taskStats: TaskStats[];
  currentView: 'home' | 'pomodoro' | 'editablePomodoro' | 'roseGarden' | 'settings';
  selectedTask: TaskData | null;
  isWeeklyView: boolean;
}

// Action类型
type AppAction =
  | {type: 'LOGIN'; payload: {email: string}}
  | {type: 'LOGOUT'}
  | {type: 'ADD_TASK'; payload: TaskData}
  | {type: 'UPDATE_TASK'; payload: {taskId: string; updates: Partial<TaskData>}}
  | {type: 'DELETE_TASK'; payload: string}
  | {type: 'COMPLETE_TASK'; payload: {taskId: string; focusTime: number}}
  | {type: 'SET_VIEW'; payload: AppState['currentView']}
  | {type: 'SELECT_TASK'; payload: TaskData | null}
  | {type: 'TOGGLE_WEEKLY_VIEW'}
  | {type: 'RESET_ALL_DATA'};

// 初始状态
const initialState: AppState = {
  isLoggedIn: false,
  tasks: [],
  completedTasks: [],
  taskStats: [],
  currentView: 'home',
  selectedTask: null,
  isWeeklyView: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {...task, ...action.payload.updates}
            : task
        ),
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        completedTasks: state.completedTasks.filter(task => task.id !== action.payload),
      };
    
    case 'COMPLETE_TASK':
      const taskToComplete = state.tasks.find(task => task.id === action.payload.taskId);
      if (!taskToComplete) return state;
      
      const completedTask: CompletedTask = {
        id: taskToComplete.id,
        title: taskToComplete.title,
        content: taskToComplete.content,
        taskType: taskToComplete.taskType,
        priority: taskToComplete.priority,
        focusTime: action.payload.focusTime,
        completedAt: new Date(),
      };
      
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {...task, isCompleted: true, completedAt: new Date()}
            : task
        ),
        completedTasks: [completedTask, ...state.completedTasks],
      };
    
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
      };
    
    case 'SELECT_TASK':
      return {
        ...state,
        selectedTask: action.payload,
      };
    
    case 'TOGGLE_WEEKLY_VIEW':
      return {
        ...state,
        isWeeklyView: !state.isWeeklyView,
      };
    
    case 'RESET_ALL_DATA':
      return initialState;
    
    default:
      return state;
  }
}

// Context创建
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider组件
export function AppProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 数据持久化
  React.useEffect(() => {
    // 加载保存的数据
    loadPersistedData();
  }, []);

  React.useEffect(() => {
    // 保存数据到本地存储
    saveDataToStorage();
  }, [state]);

  const loadPersistedData = async () => {
    try {
      const savedState = await AsyncStorage.getItem('appState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // 这里可以做版本兼容处理
        // dispatch({type: 'LOAD_PERSISTED_DATA', payload: parsedState});
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const saveDataToStorage = async () => {
    try {
      await AsyncStorage.setItem('appState', JSON.stringify(state));
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  };

  return (
    <AppContext.Provider value={{state, dispatch}}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

---

## 📸 资源文件处理

### 图片资源迁移

**目录结构**
```
src/
├── assets/
│   ├── images/
│   │   ├── character-2000312.png
│   │   ├── green-frame-bg.png
│   │   ├── nursery-background.png
│   │   └── ...
│   ├── fonts/
│   │   ├── ABeeZee-Regular.ttf
│   │   └── ...
│   └── svg/
│       ├── icons/
│       └── illustrations/
```

**图片导入和使用**
```tsx
// 静态图片导入
const images = {
  character: require('../assets/images/character-2000312.png'),
  greenFrame: require('../assets/images/green-frame-bg.png'),
  nurseryBackground: require('../assets/images/nursery-background.png'),
};

// 使用方式
<Image source={images.character} style={styles.characterImage} />
```

### SVG处理

**安装SVG支持**
```bash
npm install react-native-svg react-native-svg-transformer
```

**SVG组件示例**
```tsx
import React from 'react';
import Svg, {Path, Circle, Rect} from 'react-native-svg';

// 状态栏图标SVG组件
export const BatteryIcon = ({color = '#000', size = 24}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" />
    <Path d="M18 10v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// 使用SVG组件
<BatteryIcon color={COLORS.text} size={20} />
```

---

## 🔤 字体系统配置

### iOS字体配置

**`ios/QingJinShiGongSimulator/Info.plist`**
```xml
<key>UIAppFonts</key>
<array>
    <string>ABeeZee-Regular.ttf</string>
    <string>NotoSansSC-Regular.ttf</string>
    <string>NotoSansJP-Regular.ttf</string>
</array>
```

### Android字体配置

**将字体文件放在 `android/app/src/main/assets/fonts/` 目录下**

**字体使用方式**
```tsx
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'ABeeZee-Regular',
      android: 'ABeeZee-Regular',
      default: 'ABeeZee-Regular',
    }),
    fontSize: 14,
    lineHeight: 21,
  },
});
```

---

## 📱 平台特定功能

### 状态栏配置

```tsx
import {StatusBar, Platform} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        {/* 应用内容 */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
```

### 设备信息获取

```tsx
import DeviceInfo from 'react-native-device-info';

// 获取设备信息
const deviceInfo = {
  deviceId: await DeviceInfo.getUniqueId(),
  deviceName: await DeviceInfo.getDeviceName(),
  systemVersion: DeviceInfo.getSystemVersion(),
  appVersion: DeviceInfo.getVersion(),
};
```

### 屏幕方向锁定

```tsx
import Orientation from 'react-native-orientation-locker';

// 锁定为竖屏
Orientation.lockToPortrait();

// 在特定界面允许横屏
Orientation.unlockAllOrientations();
```

---

## 📦 依赖库替换

### 关键依赖映射表

| Web库 | React Native替代 | 说明 |
|-------|------------------|------|
| `react-router-dom` | `@react-navigation/native` | 导航路由 |
| `lucide-react` | `react-native-vector-icons` | 图标库 |
| `recharts` | `react-native-chart-kit` | 图表库 |
| `localStorage` | `@react-native-async-storage/async-storage` | 本地存储 |
| CSS Modules | StyleSheet API | 样式系统 |
| HTML5 Audio | `react-native-sound` | 音频播放 |
| Clipboard API | `@react-native-clipboard/clipboard` | 剪贴板 |
| Web Notifications | `@react-native-push-notification` | 推送通知 |

### 图标库配置

```bash
npm install react-native-vector-icons
```

**Android配置 `android/app/build.gradle`**
```gradle
apply from: file("../../node_modules/@react-native-vector-icons/fonts.gradle")
```

**使用图标**
```tsx
import Icon from 'react-native-vector-icons/MaterialIcons';

<Icon name="add" size={24} color={COLORS.text} />
```

---

## 📋 逐步迁移流程

### 第一阶段：基础架构搭建（1-2天）

1. **创建React Native项目**
   ```bash
   npx react-native init QingJinShiGongSimulator
   ```

2. **安装核心依赖**
   ```bash
   npm install @react-navigation/native @react-navigation/stack
   npm install react-native-screens react-native-safe-area-context
   npm install @react-native-async-storage/async-storage
   ```

3. **设置项目结构**
   ```
   src/
   ├── components/      # 组件目录
   ├── screens/         # 屏幕组件
   ├── navigation/      # 导航配置
   ├── context/         # 状态管理
   ├── utils/           # 工具函数
   ├── assets/          # 资源文件
   └── types/           # TypeScript类型
   ```

### 第二阶段：核心组件迁移（3-5天）

1. **登录界面迁移** (`src/screens/LoginScreen.tsx`)
   ```tsx
   import React, {useState} from 'react';
   import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
   import {useAppContext} from '../context/AppContext';

   const LoginScreen = () => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const {dispatch} = useAppContext();

     const handleLogin = () => {
       // 登录逻辑
       dispatch({type: 'LOGIN', payload: {email}});
     };

     return (
       <View style={styles.container}>
         <Text style={styles.title}>青金石宫模拟器</Text>
         <TextInput
           style={styles.input}
           placeholder="邮箱地址"
           value={email}
           onChangeText={setEmail}
           keyboardType="email-address"
         />
         <TextInput
           style={styles.input}
           placeholder="密码"
           value={password}
           onChangeText={setPassword}
           secureTextEntry
         />
         <TouchableOpacity style={styles.button} onPress={handleLogin}>
           <Text style={styles.buttonText}>登录</Text>
         </TouchableOpacity>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.primary,
       justifyContent: 'center',
       padding: SIZES.padding,
     },
     title: {
       fontSize: 24,
       fontWeight: '500',
       textAlign: 'center',
       marginBottom: 32,
       color: COLORS.text,
     },
     input: {
       ...BASE_STYLES.input,
       marginBottom: 16,
     },
     button: {
       ...BASE_STYLES.button,
       backgroundColor: COLORS.success,
     },
     buttonText: {
       ...BASE_STYLES.buttonText,
       color: COLORS.white,
     },
   });

   export default LoginScreen;
   ```

2. **首页界面迁移** (`src/screens/HomeScreen.tsx`)
   ```tsx
   import React from 'react';
   import {View, ScrollView, StyleSheet} from 'react-native';
   import {useAppContext} from '../context/AppContext';
   import TaskCard from '../components/TaskCard';
   import TaskOverview from '../components/TaskOverview';

   const HomeScreen = () => {
     const {state} = useAppContext();
     const {tasks, isWeeklyView} = state;

     return (
       <View style={styles.container}>
         <ScrollView style={styles.scrollView}>
           <TaskOverview />
           
           <View style={styles.tasksContainer}>
             {tasks.map(task => (
               <TaskCard key={task.id} task={task} />
             ))}
           </View>
         </ScrollView>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: COLORS.primary,
     },
     scrollView: {
       flex: 1,
       padding: SIZES.padding,
     },
     tasksContainer: {
       gap: SIZES.gap,
     },
   });

   export default HomeScreen;
   ```

3. **任务卡片组件迁移** (`src/components/TaskCard.tsx`)
   ```tsx
   import React from 'react';
   import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
   import Icon from 'react-native-vector-icons/MaterialIcons';

   interface Props {
     task: TaskData;
     onPress?: () => void;
     onEdit?: () => void;
     onDelete?: () => void;
   }

   const TaskCard: React.FC<Props> = ({task, onPress, onEdit, onDelete}) => {
     return (
       <TouchableOpacity style={styles.container} onPress={onPress}>
         <View style={styles.header}>
           <Text style={styles.title}>{task.title}</Text>
           <View style={styles.actions}>
             <TouchableOpacity onPress={onEdit}>
               <Icon name="edit" size={20} color={COLORS.text} />
             </TouchableOpacity>
             <TouchableOpacity onPress={onDelete}>
               <Icon name="delete" size={20} color={COLORS.error} />
             </TouchableOpacity>
           </View>
         </View>
         
         <Text style={styles.content}>{task.content}</Text>
         
         <View style={styles.meta}>
           <Text style={styles.taskType}>{task.taskType}</Text>
           <Text style={styles.priority}>{task.priority}</Text>
         </View>
       </TouchableOpacity>
     );
   };

   const styles = StyleSheet.create({
     container: {
       ...BASE_STYLES.card,
       marginBottom: SIZES.gap,
     },
     header: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 8,
     },
     title: {
       fontSize: 16,
       fontWeight: '500',
       color: COLORS.text,
       flex: 1,
     },
     actions: {
       flexDirection: 'row',
       gap: 12,
     },
     content: {
       fontSize: 14,
       color: COLORS.gray,
       lineHeight: 20,
       marginBottom: 12,
     },
     meta: {
       flexDirection: 'row',
       justifyContent: 'space-between',
     },
     taskType: {
       fontSize: 12,
       color: COLORS.text,
       backgroundColor: '#E3F2FD',
       paddingHorizontal: 8,
       paddingVertical: 4,
       borderRadius: 4,
     },
     priority: {
       fontSize: 12,
       color: COLORS.text,
       backgroundColor: '#FFF3E0',
       paddingHorizontal: 8,
       paddingVertical: 4,
       borderRadius: 4,
     },
   });

   export default TaskCard;
   ```

### 第三阶段：核心功能迁移（5-7天）

1. **番茄钟功能迁移**
2. **模态框组件迁移**
3. **数据持久化实现**
4. **统计分析功能**

### 第四阶段：高级功能和优化（3-5天）

1. **玫瑰园界面**
2. **设置界面**
3. **性能优化**
4. **测试和调试**

---

## 🧪 测试验证

### 功能测试清单

- [ ] 用户登录/注册
- [ ] 任务创建/编辑/删除
- [ ] 番茄钟计时功能
- [ ] 数据持久化
- [ ] 界面导航
- [ ] 响应式布局
- [ ] 设备兼容性

### 测试命令

```bash
# iOS模拟器运行
npx react-native run-ios

# Android模拟器运行
npx react-native run-android

# 真机调试
npx react-native run-ios --device
npx react-native run-android --device
```

---

## ⚡ 性能优化

### 1. 图片优化
```tsx
import FastImage from 'react-native-fast-image';

// 使用FastImage替代Image
<FastImage
  source={{uri: imageUrl}}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 2. 列表优化
```tsx
import {FlatList} from 'react-native';

// 使用FlatList渲染大量数据
<FlatList
  data={tasks}
  keyExtractor={item => item.id}
  renderItem={({item}) => <TaskCard task={item} />}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### 3. 内存管理
```tsx
// 组件卸载时清理定时器
useEffect(() => {
  const timer = setInterval(() => {
    // 定时器逻辑
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

---

## 🔧 故障排除

### 常见问题和解决方案

#### 1. Metro bundler缓存问题
```bash
npx react-native start --reset-cache
```

#### 2. iOS构建失败
```bash
cd ios && rm -rf Pods Podfile.lock && pod install
```

#### 3. Android构建失败
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

#### 4. 字体不显示
- 确保字体文件路径正确
- 检查Info.plist配置
- 重新构建应用

#### 5. 导航错误
```bash
npm install react-native-screens react-native-safe-area-context
npx pod-install # 仅iOS
```

---

## 📱 发布准备

### iOS发布
1. 配置App Store Connect
2. 设置证书和描述文件
3. 构建Archive
4. 提交审核

### Android发布
1. 生成签名密钥
2. 配置build.gradle
3. 构建APK/AAB
4. 上传到Google Play

---

## 🎯 总结

这个迁移指南提供了从React Web应用到React Native应用的完整转换流程。关键要点：

1. **组件映射**: 熟悉HTML到React Native组件的映射关系
2. **样式转换**: 从CSS/Tailwind转换到StyleSheet
3. **导航重构**: 使用React Navigation替代web路由
4. **状态管理**: 保持业务逻辑不变，调整实现方式
5. **平台适配**: 利用平台特定功能提升体验
6. **性能优化**: 针对移动端进行性能调优
7. **测试验证**: 确保功能完整性和用户体验

按照这个指南逐步迁移，你可以将"青金石宫模拟器"成功转换为原生移动应用，同时保持所有原有功能和设计风格。

---

**迁移指南版本**: v1.0  
**最后更新**: 2024年12月  
**维护者**: 开发团队

如有问题，请参考React Native官方文档或提交Issue。