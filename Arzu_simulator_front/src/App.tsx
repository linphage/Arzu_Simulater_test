import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TaskCreationModal } from './components/TaskCreationModal';
import { TaskEditModal } from './components/TaskEditModal';
import { TaskDeleteModal } from './components/TaskDeleteModal';
import { TaskCard } from './components/TaskCard';
import { RewardCard } from './components/RewardCard';
import { SimpleToggle } from './components/SimpleToggle';
import { WeeklyView } from './components/WeeklyView';
import { PomodoroView } from './components/PomodoroView';
import { EditablePomodoroView } from './components/EditablePomodoroView';
import { RoseGardenView } from './components/RoseGardenView';
import { SettingsView } from './components/SettingsView';
import { RewardView } from './components/RewardView';
import { StatusBar } from './components/StatusBar';
import { FixedBottomNavigation } from './components/BottomNavigation';
import { TaskCounts, TaskReminder } from './components/TaskOverview';
import { WeeklyTaskReminder, WeeklyRestCountdown, WeeklyOverdueRate } from './components/WeeklyOverview';
import { BackgroundElements } from './components/BackgroundElements';
import { taskService } from './services/taskService';
import { rewardService } from './services/rewardService';

interface TaskData {
  id: string;
  title: string;
  content: string;
  taskType: string;
  priority: string;
  focusTime?: number;
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
  focusTime: number; // 专注时间（毫秒）
  completedAt: Date;
}

interface TaskStats {
  taskId: string;
  interruptions: number; // 中断次数
  abandonments: number; // 放弃次数
  totalFocusTime: number; // 总专注时间
}

interface RewardCard {
  id: string;
  title: string;
  content: string;
  obtainedAt: Date;
  triggerTime: number;
  isViewed?: boolean;
}

export default function App() {
  // 登录状态管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);
  const [isTaskDeleteModalOpen, setIsTaskDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'pomodoro' | 'editablePomodoro' | 'roseGarden' | 'settings' | 'reward'>('home');
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardCard | null>(null);
  
  // 奖励卡系统状态
  const [rewardCards, setRewardCards] = useState<RewardCard[]>([]);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0); // 累计专注时间（毫秒）
  const [lastRewardTriggerTime, setLastRewardTriggerTime] = useState<number>(0); // 上次触发奖励时的累计时间

  // 🎁 奖励卡触发逻辑
  const generateRandomRewardTriggerTime = (): number => {
    const probabilities = [
      { time: 10 * 60 * 1000, prob: 0.1 },  // 10分钟，10%概率
      { time: 30 * 60 * 1000, prob: 0.4 },  // 30分钟，40%概率  
      { time: 45 * 60 * 1000, prob: 0.4 },  // 45分钟，40%概率
      { time: 60 * 60 * 1000, prob: 0.1 }   // 60分钟，10%概率
    ];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const { time, prob } of probabilities) {
      cumulative += prob;
      if (random <= cumulative) {
        console.log(`🎯 [奖励算法] 随机生成触发时间: ${Math.round(time / 60000)}分钟 (概率${prob * 100}%)`);
        return time;
      }
    }
    
    console.log(`🎯 [奖励算法] 使用默认触发时间: 30分钟`);
    return 30 * 60 * 1000; // 默认30分钟
  };

  const generateRewardCard = async (): Promise<RewardCard | null> => {
    try {
      const triggerTimeMinutes = Math.max(1, Math.round(totalFocusTime / 60000));
      console.log(`🎁 [奖励生成] 触发时间: ${triggerTimeMinutes}分钟 (原始: ${totalFocusTime}毫秒)`);
      
      const response = await rewardService.triggerReward(triggerTimeMinutes);
      
      if (response.success && response.data) {
        return {
          id: `reward-${Date.now()}`,
          title: response.data.title || '专注奖励',
          content: response.data.description || '',
          obtainedAt: new Date(),
          triggerTime: totalFocusTime,
          isViewed: false
        };
      }
      return null;
    } catch (error) {
      console.error('❌ [奖励生成] 触发奖励卡失败:', error);
      return null;
    }
  };

  const checkRewardTrigger = async (newTotalTime: number) => {
    const timeSinceLastReward = newTotalTime - lastRewardTriggerTime;
    
    const isTestMode = true;
    const testModeDivider = isTestMode ? 10 : 1;
    
    const nextRewardTime = generateRandomRewardTriggerTime() / testModeDivider;
    
    console.log(`🎁 [奖励检查] 当前累计时间: ${Math.round(newTotalTime / 60000)}分钟`);
    console.log(`🎁 [奖励检查] 距上次奖励时间: ${Math.round(timeSinceLastReward / 60000)}分钟`);
    console.log(`🎁 [奖励检查] 需要累计时间: ${Math.round(nextRewardTime / 60000)}分钟 ${isTestMode ? '(测试模式已开启)' : ''}`);
    
    if (timeSinceLastReward >= nextRewardTime) {
      const newRewardCard = await generateRewardCard();
      if (newRewardCard) {
        setRewardCards(prev => [newRewardCard, ...prev]);
        setLastRewardTriggerTime(newTotalTime);
        
        console.log(`🎉 [奖励触发] 获得奖励卡: ${newRewardCard.title}`);
        console.log(`🎉 [奖励触发] 奖励内容: ${newRewardCard.content}`);
        
        setTimeout(() => {
          alert(`🎉 恭喜获得奖励卡！\n\n${newRewardCard.title}\n${newRewardCard.content}`);
        }, 500);
      }
    }
  };

  const handleManualReward = async () => {
    const newRewardCard = await generateRewardCard();
    if (newRewardCard) {
      newRewardCard.isViewed = false;
      setRewardCards(prev => [newRewardCard, ...prev]);
      console.log(`🧪 [手动奖励] 生成测试奖励卡: ${newRewardCard.title}`);
      alert(`🧪 测试奖励卡已生成！\n\n${newRewardCard.title}\n${newRewardCard.content}`);
    }
  };

  const handleDeleteRewardCard = (cardId: string) => {
    if (window.confirm('确定要删除这张奖励卡吗？')) {
      setRewardCards(prev => prev.filter(card => card.id !== cardId));
      console.log(`🗑️ [奖励卡] 删除奖励卡: ${cardId}`);
    }
  };

  // 🔐 处理登录成功
  const handleStartWork = async (loginData: { email: string; password: string }) => {
    console.log('✅ [登录成功] 用户信息:', { 
      email: loginData.email, 
      loginTime: new Date().toISOString() 
    });
    
    setIsLoggedIn(true);
    
    console.log('📊 [分析] 用户登录事件已记录');
  };

  // 🔄 登录后加载用户任务和奖励卡数据
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn) return;
      
      try {
        console.log('📥 [加载数据] 开始获取用户数据...');
        
        const tasksResponse = await taskService.getUserTasks({ 
          completed: false, 
          limit: 100 
        });
        
        if (tasksResponse.success && tasksResponse.data) {
          const loadedTasks = tasksResponse.data.tasks.map((task: any) => ({
            id: task.id.toString(),
            title: task.title,
            content: task.description,
            taskType: task.category,
            priority: task.priority === '金' ? '金卡' : task.priority === '银' ? '银卡' : task.priority === '铜' ? '铜卡' : '石卡',
            focusTime: task.focus_time || 0,
            dateTime: task.due_date ? {
              date: formatDateToChinese(task.due_date),
              startTime: formatTimeToChinese(task.due_date)
            } : undefined,
            isCompleted: task.completed,
            completedAt: task.completed_at ? new Date(task.completed_at) : undefined
          }));
          
          setTasks(loadedTasks);
          console.log(`✅ [加载任务] 成功加载 ${loadedTasks.length} 个未完成任务`);
        }
      } catch (error: any) {
        console.error('❌ [加载数据] 获取数据失败:', error);
      }
    };
    
    loadUserData();
  }, [isLoggedIn]);

  // 日期格式转换辅助函数
  // 后端已设置TZ=Asia/Shanghai，返回的时间是东八区时间
  // 直接按字面值解析，不进行时区转换
  const parseDateWithoutTimezone = (dateStr: string): Date => {
    // 处理各种可能的格式
    // "2025-11-07T15:00:00.000Z" → "2025-11-07 15:00:00"
    // "2025-11-07 15:00:00" → "2025-11-07 15:00:00"
    let normalized = dateStr
      .replace('T', ' ')           // 替换T为空格
      .replace('Z', '')            // 移除Z时区标识
      .replace(/\.\d{3}/, '')      // 移除毫秒
      .trim();
    
    // 使用 Date 构造函数直接解析，浏览器会将其视为本地时间
    return new Date(normalized);
  };

  const formatDateToChinese = (isoDate: string): string => {
    const date = parseDateWithoutTimezone(isoDate);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTimeToChinese = (isoDate: string): string => {
    const date = parseDateWithoutTimezone(isoDate);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? '上午' : hours < 18 ? '下午' : '晚上';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${period}${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleAddTask = () => {
    setIsTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
  };

  const handleCreateTask = async (taskData: { title: string; content: string; dateTime?: any; taskType?: string; priority?: string }) => {
    try {
      console.log('🆕 创建新任务:', taskData);
      
      const response = await taskService.createTask(
        taskData.title,
        taskData.content,
        taskData.taskType || '勤政',
        taskData.priority || '铜卡',
        taskData.dateTime?.date || '1月1日',
        taskData.dateTime?.startTime || '00:00',
        taskData.dateTime?.reminder || '无',
        taskData.dateTime?.repeat || '无',
        taskData.dateTime?.selectedWeekdays || []
      );
      
      const newTask: TaskData = {
        id: response.data.id.toString(),
        title: taskData.title,
        content: taskData.content,
        taskType: taskData.taskType || '勤政',
        priority: taskData.priority || '铜卡',
        dateTime: taskData.dateTime
      };

      console.log('✅ 任务创建成功，后端返回ID:', response.data.id);
      setTasks(prev => [newTask, ...prev]);
      setIsTaskModalOpen(false);
    } catch (error: any) {
      console.error('❌ 创建任务失败:', error);
      alert(`创建任务失败: ${error.message}`);
    }
  };

  const handleShowDeleteModal = (task: TaskData) => {
    setDeletingTask(task);
    setIsTaskDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (taskId: string, deleteReason: string) => {
    try {
      console.log(`正在删除任务 "${deletingTask?.title || taskId}"...`);
      console.log(`删除原因: ${deleteReason}`);
      
      await taskService.deleteTask(taskId, deleteReason);
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setCompletedTasks(prev => prev.filter(task => task.id !== taskId));
      
      console.log(`✅ 任务 "${deletingTask?.title || taskId}" 已成功从后端删除`);
      setDeletingTask(null);
    } catch (error: any) {
      console.error('删除任务失败:', error);
      alert(`删除任务失败: ${error.message}`);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsTaskDeleteModalOpen(false);
    setDeletingTask(null);
  };

  const handleEditTask = (task: TaskData) => {
    setEditingTask(task);
    setIsTaskEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsTaskEditModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTask = async (taskId: string, updatedTask: Partial<TaskData>, changeReason: string) => {
    try {
      console.log(`正在更新任务 "${updatedTask.title || taskId}"...`);
      console.log(`修改原因: ${changeReason}`);
      console.log('更新内容:', updatedTask);

      const updates: any = {};
      
      if (updatedTask.taskType) {
        updates.category = updatedTask.taskType;
      }
      
      if (updatedTask.priority) {
        updates.priority = updatedTask.priority;
      }
      
      if (updatedTask.dateTime) {
        updates.dueDate = updatedTask.dateTime.date;
        updates.startTime = updatedTask.dateTime.startTime;
      }

      await taskService.updateTask(taskId, updates, changeReason);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...updatedTask }
          : task
      ));
      
      console.log(`✅ 任务 "${updatedTask.title || taskId}" 已成功更新`);
    } catch (error: any) {
      console.error('更新任务失败:', error);
      alert(`更新任务失败: ${error.message}`);
    }
  };

  const handleToggleView = (isRight: boolean) => {
    console.log('🔄 切换视图:', isRight ? '周视图' : '日视图');
    setIsWeeklyView(isRight);
  };

  const handleTaskClick = (task: TaskData) => {
    // 如果任务已完成，不允许进入番茄钟界面
    if (task.isCompleted) {
      console.log('已完成的任务不能再次进入番茄钟计时');
      return;
    }
    
    setSelectedTask(task);
    setCurrentView('pomodoro');
  };

  const handleBackFromPomodoro = () => {
    setCurrentView('home');
    setSelectedTask(null);
    setSelectedReward(null);
  };

  const handleRewardClick = (rewardCard: RewardCard) => {
    if (!rewardCard.isViewed) {
      setRewardCards(prev => prev.map(card => 
        card.id === rewardCard.id 
          ? { ...card, isViewed: true }
          : card
      ));
      console.log(`👁️ [奖励查看] 奖励卡 "${rewardCard.title}" 已标记为已查看`);
    }
    
    setSelectedReward({ ...rewardCard, isViewed: true });
    setCurrentView('reward');
  };

  const handleOfficeClick = () => {
    setCurrentView('editablePomodoro');
  };

  const handleSaveTaskFromOffice = (taskData: { 
    title: string; 
    content: string; 
    taskType: string; 
    priority: string;
    dateTime?: {
      date: string;
      startTime: string;
    };
    id?: string;
  }) => {
    const newTask: TaskData = {
      id: taskData.id || Date.now().toString(),
      title: taskData.title,
      content: taskData.content,
      taskType: taskData.taskType,
      priority: taskData.priority,
      dateTime: taskData.dateTime
    };

    console.log('🏢 [办公室] 创建新任务并进入番茄钟:', newTask);
    setTasks(prev => [newTask, ...prev]);
    
    // 🚀 新功能：创建任务后直接进入番茄钟页面
    setSelectedTask(newTask);
    setCurrentView('pomodoro');
  };

  const handleRoseGardenClick = () => {
    setCurrentView('roseGarden');
  };

  const handleSettingsClick = () => {
    setCurrentView('settings');
  };

  // 重置所有数据的函数
  const handleResetAllData = () => {
    if (window.confirm('⚠️ 确定要重置所有数据吗？\n\n这将会：\n• 清空所有任务\n• 清空已完成任务\n• 清空任务统计\n• 退出登录\n\n此操作不可恢复！')) {
      console.log('🔄 正在重置所有数据...');
      
      // 重置所有状态到初始值
      setTasks([]);
      setCompletedTasks([]);
      setTaskStats([]);
      setRewardCards([]);
      setTotalFocusTime(0);
      setLastRewardTriggerTime(0);
      setIsLoggedIn(false);
      setCurrentView('home');
      setSelectedTask(null);
      setEditingTask(null);
      setDeletingTask(null);
      setIsWeeklyView(false);
      
      // 关闭所有模态框
      setIsTaskModalOpen(false);
      setIsTaskEditModalOpen(false);
      setIsTaskDeleteModalOpen(false);
      
      console.log('✅ 所有数据已重置完成');
      alert('✅ 数据重置完成！应用已返回初始状态。');
    }
  };

  const handleTaskComplete = (taskId: string, focusTime: number) => {
    // 找到完成的任务
    const completedTask = tasks.find(task => task.id === taskId);
    if (completedTask) {
      // 添加到已完成任务列表
      const newCompletedTask: CompletedTask = {
        id: completedTask.id,
        title: completedTask.title,
        content: completedTask.content,
        taskType: completedTask.taskType,
        priority: completedTask.priority,
        focusTime: focusTime,
        completedAt: new Date()
      };
      setCompletedTasks(prev => [newCompletedTask, ...prev]);
      
      // 更新任务统计
      setTaskStats(prev => {
        const existingStat = prev.find(stat => stat.taskId === taskId);
        if (existingStat) {
          return prev.map(stat => 
            stat.taskId === taskId 
              ? { ...stat, totalFocusTime: stat.totalFocusTime + focusTime }
              : stat
          );
        } else {
          return [...prev, {
            taskId,
            interruptions: 0,
            abandonments: 0,
            totalFocusTime: focusTime
          }];
        }
      });
      
      // 🎁 更新累计专注时间并检查奖励触发
      const newTotalTime = totalFocusTime + focusTime;
      setTotalFocusTime(newTotalTime);
      checkRewardTrigger(newTotalTime);
      
      // 🔧 修复重复计数问题：只标记为已完成，不再重复添加到completedTasks
      // 统计时只使用completedTasks列表，避免重复计数
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: true, completedAt: new Date() }
          : task
      ));
      
      console.log(`✅ 任务 "${completedTask.title}" 已完成，专注时间：${Math.round(focusTime / 60000)}分钟`);
      console.log(`🔧 [修复] 任务已添加到completedTasks列表，避免重复计数`);
    }
  };

  const handleTaskInterrupted = (taskId: string, focusTime: number) => {
    // 更新任务统计 - 中断次数加1
    setTaskStats(prev => {
      const existingStat = prev.find(stat => stat.taskId === taskId);
      if (existingStat) {
        return prev.map(stat => 
          stat.taskId === taskId 
            ? { ...stat, interruptions: stat.interruptions + 1, totalFocusTime: stat.totalFocusTime + focusTime }
            : stat
        );
      } else {
        return [...prev, {
          taskId,
          interruptions: 1,
          abandonments: 0,
          totalFocusTime: focusTime
        }];
      }
    });
    
    // 🎁 更新累计专注时间并检查奖励触发（中断也算专注时间）
    const newTotalTime = totalFocusTime + focusTime;
    setTotalFocusTime(newTotalTime);
    checkRewardTrigger(newTotalTime);
    
    console.log(`任务 ${taskId} 中断一次，已专注：${Math.round(focusTime / 60000)}分钟`);
  };

  const handleTaskAbandoned = (taskId: string, focusTime: number) => {
    // 更新任务统计 - 放弃次数加1
    setTaskStats(prev => {
      const existingStat = prev.find(stat => stat.taskId === taskId);
      if (existingStat) {
        return prev.map(stat => 
          stat.taskId === taskId 
            ? { ...stat, abandonments: stat.abandonments + 1, totalFocusTime: stat.totalFocusTime + focusTime }
            : stat
        );
      } else {
        return [...prev, {
          taskId,
          interruptions: 0,
          abandonments: 1,
          totalFocusTime: focusTime
        }];
      }
    });
    
    // 🎁 更新累计专注时间并检查奖励触发（放弃也算专注时间）
    const newTotalTime = totalFocusTime + focusTime;
    setTotalFocusTime(newTotalTime);
    checkRewardTrigger(newTotalTime);
    
    console.log(`任务 ${taskId} 结束一次，计时计入总计时：${Math.round(focusTime / 60000)}分钟`);
  };

  // 解析中文日期并转换为Date对象的辅助函数
  const parseChineseDate = (dateStr: string, timeStr: string): Date => {
    try {
      const currentYear = new Date().getFullYear();
      
      // 解析日期：例如 "9月13日" -> 9, 13
      const dateMatch = dateStr.match(/(\d+)月(\d+)日/);
      if (!dateMatch) return new Date(2099, 11, 31); // 如果解析失败，返回未来日期作为最低优先级
      
      const month = parseInt(dateMatch[1]) - 1; // JavaScript月份从0开始
      const day = parseInt(dateMatch[2]);
      
      // 解析时间：例如 "下午12:00" -> 12, 0
      let hour = 0;
      let minute = 0;
      
      const timeMatch = timeStr.match(/(上午|下午|晚上)(\d+):(\d+)/);
      if (timeMatch) {
        const period = timeMatch[1];
        hour = parseInt(timeMatch[2]);
        minute = parseInt(timeMatch[3]);
        
        // 转换为24小时制
        if (period === '下午' && hour !== 12) {
          hour += 12;
        } else if (period === '上午' && hour === 12) {
          hour = 0;
        } else if (period === '晚上') {
          hour += 12;
        }
      }
      
      return new Date(currentYear, month, day, hour, minute);
    } catch (error) {
      console.warn('日期解析失败:', dateStr, timeStr, error);
      return new Date(2099, 11, 31); // 解析失败时返回未来日期，排在最后
    }
  };

  // 检查任务是否为当天完成
  const isCompletedToday = (task: TaskData): boolean => {
    if (!task.isCompleted || !task.completedAt) return false;
    
    const today = new Date();
    const completedDate = task.completedAt;
    
    return today.getFullYear() === completedDate.getFullYear() &&
           today.getMonth() === completedDate.getMonth() &&
           today.getDate() === completedDate.getDate();
  };

  // 按截止时间和完成状态排序任务的函数
  const sortTasksByDeadline = (tasks: TaskData[]): TaskData[] => {
    return [...tasks]
      .filter(task => !task.isCompleted || isCompletedToday(task)) // 只显示未完成的任务和当天完成的任务
      .sort((a, b) => {
        // 已完成的任务排在最后
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        if (a.isCompleted && b.isCompleted) return 0; // 都已完成时保持原有顺序
        
        // 未完成任务按截止时间排序
        if (!a.dateTime && !b.dateTime) return 0;
        if (!a.dateTime) return 1;
        if (!b.dateTime) return -1;
        
        const dateA = parseChineseDate(a.dateTime.date, a.dateTime.startTime);
        const dateB = parseChineseDate(b.dateTime.date, b.dateTime.startTime);
        
        // 截止时间越近的排在越前面
        return dateA.getTime() - dateB.getTime();
      });
  };

  // 🎯 综合排序函数：奖励卡和任务的混合排序
  // 排序规则：未查看奖励卡 → 未完成任务 → 已查看奖励卡 → 已完成任务
  const getSortedItemsForDisplay = () => {
    const sortedTasks = sortTasksByDeadline(tasks);
    const unviewedRewards = rewardCards.filter(card => !card.isViewed);
    const viewedRewards = rewardCards.filter(card => card.isViewed);
    const uncompletedTasks = sortedTasks.filter(task => !task.isCompleted);
    const completedTasks = sortedTasks.filter(task => task.isCompleted);

    // 按时间排序奖励卡（最新的在前）
    const sortedUnviewedRewards = [...unviewedRewards].sort((a, b) => 
      b.obtainedAt.getTime() - a.obtainedAt.getTime()
    );
    const sortedViewedRewards = [...viewedRewards].sort((a, b) => 
      b.obtainedAt.getTime() - a.obtainedAt.getTime()
    );

    console.log(`📋 [排序结果] 未查看奖励: ${sortedUnviewedRewards.length}, 未完成任务: ${uncompletedTasks.length}, 已查看奖励: ${sortedViewedRewards.length}, 已完成任务: ${completedTasks.length}`);

    return {
      unviewedRewards: sortedUnviewedRewards,
      uncompletedTasks,
      viewedRewards: sortedViewedRewards,
      completedTasks
    };
  };

  // 调试信息
  React.useEffect(() => {
    if (isWeeklyView) {
      console.log('📊 当前周视图状态:');
      console.log('- 任务总数:', tasks.length);
      console.log('- 任务列表:', tasks.map(t => ({ 
        title: t.title, 
        date: t.dateTime?.date,
        time: t.dateTime?.startTime 
      })));
    }
  }, [isWeeklyView, tasks]);

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <LoginScreen onStartWork={handleStartWork} />;
  }

  // 如果在番茄钟视图，显示番茄钟页面
  if (currentView === 'pomodoro' && selectedTask) {
    return (
      <PomodoroView 
        task={selectedTask} 
        onBack={handleBackFromPomodoro}
        onTaskComplete={handleTaskComplete}
        onTaskInterrupted={handleTaskInterrupted}
        onTaskAbandoned={handleTaskAbandoned}
      />
    );
  }

  // 如果在可编辑番茄钟视图，显示可编辑番茄钟页面
  if (currentView === 'editablePomodoro') {
    return (
      <EditablePomodoroView
        onBack={handleBackFromPomodoro}
        onSaveTask={handleSaveTaskFromOffice}
      />
    );
  }

  // 如果在玫瑰园视图，显示玫瑰园页面
  if (currentView === 'roseGarden') {
    return (
      <RoseGardenView
        onBack={handleBackFromPomodoro}
        onParliamentClick={handleBackFromPomodoro}
        onOfficeClick={handleOfficeClick}
        onSettingsClick={handleSettingsClick}
        onAddTaskClick={handleAddTask}
        tasks={tasks}
        completedTasks={completedTasks}
        taskStats={taskStats}
      />
    );
  }

  // 如果在奖励视图，显示奖励页面
  if (currentView === 'reward' && selectedReward) {
    return (
      <RewardView
        rewardCard={selectedReward}
        onBack={handleBackFromPomodoro}
      />
    );
  }

  // 如果在设置视图，显示设置页面
  if (currentView === 'settings') {
    return (
      <SettingsView 
        onBack={handleBackFromPomodoro}
        onAddClick={handleAddTask}
        onOfficeClick={handleOfficeClick}
        onRoseGardenClick={handleRoseGardenClick}
        onParliamentClick={handleBackFromPomodoro}
        onResetAllData={handleResetAllData}
        onLogout={() => setIsLoggedIn(false)}
        onManualReward={handleManualReward}
        tasks={tasks}
        completedTasks={completedTasks}
      />
    );
  }

  return (
    <div className="mobile-fullscreen mobile-app-container">
      {/* 全屏背景容器 */}
      <div 
        className="absolute inset-0 bg-[#DAE8F1] w-full h-full" 
        data-name="全屏背景"
        style={{
          width: '100vw',
          height: '100dvh',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* 主应用容器 */}
      <div 
        className="responsive-container bg-[#DAE8F1] relative overflow-hidden" 
        data-name="首页"
        style={{
          height: '100dvh',
          minHeight: '100dvh'
        }}
      >
        <BackgroundElements tasks={tasks} completedTasks={completedTasks} />

        {/* 统一的可滚动内容区域 */}
        <div 
          className="absolute overflow-y-auto unified-scroll-container"
          style={{ 
            top: "299px", 
            bottom: "89px",
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(412px, calc(100vw - 20px))', // 响应式宽度，保持边距
            maxWidth: '412px',
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
          data-name="统一滚动内容区域"
        >
          <style>{`
            .unified-scroll-container::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <div className="flex flex-col gap-4 pb-4">
            {/* 任务量显示区域 */}
            <div className="relative" style={{ height: isWeeklyView ? '153px' : '145px' }}>
              {/* Daily View Components */}
              {!isWeeklyView && (
                <>
                  <div className="absolute left-0" style={{ width: 'min(222px, calc(100% - 150px))' }}>
                    <TaskReminder tasks={tasks} isVisible={true} />
                  </div>
                  <div className="absolute right-0" style={{ width: 'min(132px, 132px)' }}>
                    <TaskCounts tasks={tasks} isVisible={true} />
                  </div>
                </>
              )}

              {/* Weekly View Components */}
              {isWeeklyView && (
                <div className="flex gap-3 h-full">
                  {/* 左侧：任务完成率组件 - 允许压缩 */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <WeeklyTaskReminder tasks={tasks} isVisible={true} />
                  </div>
                  
                  {/* 右侧：上下排列的两个小组件 - 响应式宽度确保完整显示 */}
                  <div className="flex flex-col gap-3 flex-shrink-0 w-[100px] sm:w-[120px] md:w-[132px]">
                    <WeeklyRestCountdown tasks={tasks} isVisible={true} />
                    <WeeklyOverdueRate tasks={tasks} isVisible={true} />
                  </div>
                </div>
              )}
            </div>

            {/* 视图切换按钮 */}
            <div className="flex justify-center">
              <SimpleToggle isRight={isWeeklyView} onToggle={handleToggleView} />
            </div>

            {/* 主内容区域 */}
            <div 
              className={`rounded-lg ${isWeeklyView ? 'border-2 border-[#3a3f47]' : ''} flex-1`}
              data-name="主内容区域"
            >
              {isWeeklyView ? (
                <WeeklyView tasks={tasks} onTaskClick={handleTaskClick} />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(() => {
                    const { unviewedRewards, uncompletedTasks, viewedRewards, completedTasks } = getSortedItemsForDisplay();
                    return (
                      <>
                        {/* 1. 未查看的奖励卡 - 最高优先级，显示在最顶端 */}
                        {unviewedRewards.map((rewardCard) => (
                          <RewardCard 
                            key={rewardCard.id} 
                            rewardCard={rewardCard} 
                            onDelete={handleDeleteRewardCard}
                            onRewardClick={handleRewardClick}
                          />
                        ))}
                        
                        {/* 2. 未完成的任务 - 第二优先级 */}
                        {uncompletedTasks.map((task) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onDelete={() => handleShowDeleteModal(task)}
                            onTaskClick={handleTaskClick}
                            onEdit={handleEditTask}
                          />
                        ))}
                        
                        {/* 3. 已查看的奖励卡 - 第三优先级 */}
                        {viewedRewards.map((rewardCard) => (
                          <RewardCard 
                            key={rewardCard.id} 
                            rewardCard={rewardCard} 
                            onDelete={handleDeleteRewardCard}
                            onRewardClick={handleRewardClick}
                          />
                        ))}
                        
                        {/* 4. 已完成的任务 - 最低优先级，显示在最后 */}
                        {completedTasks.map((task) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onDelete={() => handleShowDeleteModal(task)}
                            onTaskClick={handleTaskClick}
                            onEdit={handleEditTask}
                          />
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <StatusBar />
        <FixedBottomNavigation 
          onAddClick={handleAddTask} 
          onOfficeClick={handleOfficeClick} 
          onRoseGardenClick={handleRoseGardenClick} 
          onSettingsClick={handleSettingsClick}
        />
        
        {/* Task Creation Modal */}
        <TaskCreationModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleCreateTask}
        />

        {/* Task Edit Modal */}
        <TaskEditModal
          isOpen={isTaskEditModalOpen}
          task={editingTask}
          onClose={handleCloseEditModal}
          onUpdate={handleUpdateTask}
        />

        {/* Task Delete Modal */}
        <TaskDeleteModal
          isOpen={isTaskDeleteModalOpen}
          task={deletingTask}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}