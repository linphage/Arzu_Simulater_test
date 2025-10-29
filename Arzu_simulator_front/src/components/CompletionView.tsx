import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { completionService } from '../services/completionService';

interface Task {
  id: string;
  title: string;
  content: string;
  taskType: string;
  priority: string;
  dateTime?: {
    date: string;
    startTime: string;
  };
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

interface CompletionViewProps {
  tasks: Task[];
  completedTasks?: CompletedTask[];
}

export function CompletionView({ tasks, completedTasks = [] }: CompletionViewProps) {
  const [backendStats, setBackendStats] = useState<{
    weeklyStats: {
      completionRate: number;
      overdueRate: number;
      totalTasks: number;
    };
    trendData: Array<{
      week: string;
      completionRate: number;
      overdueRate: number;
    }>;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await completionService.getCompletionStats();
        setBackendStats(response.data);
      } catch (error) {
        console.error('获取完成度统计失败:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);
  // 移除了selectedCell状态，因为不再需要逾期原因词云功能

  // 优先级映射
  const priorityMap = {
    '金卡': '重要/紧急',
    '银卡': '重要不紧急', 
    '铜卡': '紧急不重要',
    '石卡': '不重要不紧急'
  };

  // 解析中文日期格式的辅助函数
  const parseChineseDate = (chineseDateStr: string): Date => {
    try {
      // 解析"9月11日"格式
      const match = chineseDateStr.match(/(\d+)月(\d+)日/);
      if (match) {
        const currentYear = new Date().getFullYear();
        const month = parseInt(match[1]) - 1; // JavaScript月份从0开始
        const day = parseInt(match[2]);
        return new Date(currentYear, month, day);
      }
      // 如果不是中文格式，尝试直接解析
      return new Date(chineseDateStr);
    } catch (error) {
      console.warn('日期解析失败:', chineseDateStr, error);
      return new Date(); // 返回当前日期作为默认值
    }
  };

  // 计算本周任务完成率
  const calculateWeeklyCompletionRate = (): string => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log('🗓️ 本周时间范围:', {
      weekStart: weekStart.toLocaleDateString(),
      weekEnd: weekEnd.toLocaleDateString(),
      today: now.toLocaleDateString()
    });
    
    // 获取本周的待完成任务
    const weeklyTasks = tasks.filter(task => {
      if (!task.dateTime?.date) return false;
      const taskDate = parseChineseDate(task.dateTime.date);
      const inWeek = taskDate >= weekStart && taskDate < weekEnd;
      console.log('📋 检查任务:', {
        title: task.title,
        dateStr: task.dateTime.date,
        parsedDate: taskDate.toLocaleDateString(),
        inWeek,
        isCompleted: task.isCompleted
      });
      return inWeek && !task.isCompleted; // 只计算未完成的任务
    });
    
    // 🔧 修复重复计数：优先使用completedTasks列表
    const weeklyCompletedTasks = completedTasks.filter(task => {
      const completedDate = new Date(task.completedAt);
      const inWeek = completedDate >= weekStart && completedDate < weekEnd;
      console.log('✅ 检查已完成任务:', {
        title: task.title,
        completedAt: completedDate.toLocaleDateString(),
        inWeek
      });
      return inWeek;
    });
    
    // 🔧 只检查那些不在completedTasks中的已完成任务（避免重复计数）
    const completedInTasks = tasks.filter(task => {
      if (!task.isCompleted || !task.dateTime?.date) return false;
      
      // 检查这个任务是否已经在completedTasks中
      const alreadyInCompletedTasks = completedTasks.some(completedTask => completedTask.id === task.id);
      if (alreadyInCompletedTasks) {
        console.log('🔧 [避免重复] 任务已在completedTasks中，跳过:', task.title);
        return false;
      }
      
      const taskDate = parseChineseDate(task.dateTime.date);
      const inWeek = taskDate >= weekStart && taskDate < weekEnd;
      console.log('✅ 检查tasks中已完成任务:', {
        title: task.title,
        dateStr: task.dateTime.date,
        parsedDate: taskDate.toLocaleDateString(),
        inWeek,
        isCompleted: task.isCompleted,
        alreadyInCompletedTasks
      });
      return inWeek;
    });
    
    const totalCompletedTasks = weeklyCompletedTasks.length + completedInTasks.length;
    const totalWeeklyTasks = weeklyTasks.length + totalCompletedTasks;
    
    console.log('📊 [修复后] 完成度计算结果:', {
      weeklyTasks: weeklyTasks.length,
      weeklyCompletedTasks: weeklyCompletedTasks.length,
      completedInTasks: completedInTasks.length,
      totalCompletedTasks,
      totalWeeklyTasks,
      note: '已修复重复计数问题'
    });
    
    if (totalWeeklyTasks === 0) {
      return "——"; // 如果没有任务，返回"——"
    }
    
    // 计算完成率
    const completionRate = Math.round((totalCompletedTasks / totalWeeklyTasks) * 100);
    return `${completionRate}%`;
  };

  const weeklyCompletionRate = backendStats && !loadingStats 
    ? `${backendStats.weeklyStats.completionRate}%` 
    : calculateWeeklyCompletionRate();

  // 计算本周任务逾期率
  const calculateWeeklyOverdueRate = (): string => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // 获取本周有设置时间的任务（未完成的）
    const weeklyTasksWithTime = tasks.filter(task => {
      if (!task.dateTime?.date || !task.dateTime?.startTime || task.isCompleted) return false;
      const taskDate = parseChineseDate(task.dateTime.date);
      return taskDate >= weekStart && taskDate < weekEnd;
    });
    
    // 如果没有任务，返回"——"
    if (weeklyTasksWithTime.length === 0) {
      return "——";
    }
    
    // 计算逾期任务数量
    const overdueTasksCount = weeklyTasksWithTime.filter(task => {
      if (!task.dateTime?.date || !task.dateTime?.startTime) return false;
      
      // 解析任务的日期和时间
      const taskDate = parseChineseDate(task.dateTime.date);
      const timeMatch = task.dateTime.startTime.match(/(上午|下午|晚上)(\d+):(\d+)/);
      
      if (timeMatch) {
        const period = timeMatch[1];
        let hour = parseInt(timeMatch[2]);
        const minute = parseInt(timeMatch[3]);
        
        // 转换为24小时制
        if (period === '下午' && hour !== 12) {
          hour += 12;
        } else if (period === '上午' && hour === 12) {
          hour = 0;
        } else if (period === '晚上') {
          hour += 12;
        }
        
        const taskDateTime = new Date(taskDate.getTime());
        taskDateTime.setHours(hour, minute, 0, 0);
        
        // 如果任务时间已经过了，但任务还在待完成列表中，说明逾期了
        return now > taskDateTime;
      }
      
      return false;
    }).length;
    
    // 计算逾期率
    const overdueRate = Math.round((overdueTasksCount / weeklyTasksWithTime.length) * 100);
    return `${overdueRate}%`;
  };

  const weeklyOverdueRate = backendStats && !loadingStats
    ? `${backendStats.weeklyStats.overdueRate}%`
    : calculateWeeklyOverdueRate();

  // 计算本周任务总数
  const calculateWeeklyTaskCount = (): string => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // 获取本周的待完成任务
    const weeklyTasks = tasks.filter(task => {
      if (!task.dateTime?.date) return false;
      const taskDate = parseChineseDate(task.dateTime.date);
      return taskDate >= weekStart && taskDate < weekEnd && !task.isCompleted;
    });
    
    // 获取本周的已完成任务
    const weeklyCompletedTasks = completedTasks.filter(task => {
      const completedDate = new Date(task.completedAt);
      return completedDate >= weekStart && completedDate < weekEnd;
    });
    
    // 获取tasks中标记为已完成的本周任务
    const completedInTasks = tasks.filter(task => {
      if (!task.isCompleted || !task.dateTime?.date) return false;
      const taskDate = parseChineseDate(task.dateTime.date);
      return taskDate >= weekStart && taskDate < weekEnd;
    });
    
    const totalWeeklyTasks = weeklyTasks.length + weeklyCompletedTasks.length + completedInTasks.length;
    
    return totalWeeklyTasks === 0 ? "——" : totalWeeklyTasks.toString();
  };

  const weeklyTaskCount = backendStats && !loadingStats
    ? (backendStats.weeklyStats.totalTasks === 0 ? "——" : backendStats.weeklyStats.totalTasks.toString())
    : calculateWeeklyTaskCount();

  // 计算本周任务优先级完成情况热力图数据
  const calculateMatrixData = () => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // 优先级映射
    const priorityMappings: { [key: string]: string } = {
      '金卡': '重要/紧急',
      '银卡': '重要不紧急', 
      '铜卡': '紧急不重要',
      '石卡': '不重要不紧急'
    };
    
    const priorities = ['重要/紧急', '重要不紧急', '紧急不重要', '不重要不紧急'];
    const statuses = ['已完成', '进行中', '逾期未完成'];
    
    const matrixData = [];
    let idCounter = 1;
    
    console.log('🔥 开始计算热力图数据');
    console.log('📅 本周范围:', {
      weekStart: weekStart.toLocaleDateString(),
      weekEnd: weekEnd.toLocaleDateString()
    });
    
    priorities.forEach(priority => {
      statuses.forEach(status => {
        let count = 0;
        let overdueRate = 0;
        
        if (status === '已完成') {
          // 🔧 修复重复计数：优先使用completedTasks列表
          const completedFromCompletedTasks = completedTasks.filter(task => {
            const completedDate = new Date(task.completedAt);
            const taskPriority = priorityMappings[task.priority] || task.priority;
            const inWeek = completedDate >= weekStart && completedDate < weekEnd;
            const matchPriority = taskPriority === priority;
            return inWeek && matchPriority;
          });
          
          // 🔧 只统计那些不在completedTasks中的已完成任务（避免重复计数）
          const completedFromTasks = tasks.filter(task => {
            if (!task.isCompleted || !task.dateTime?.date) return false;
            
            // 检查这个任务是否已经在completedTasks中
            const alreadyInCompletedTasks = completedTasks.some(completedTask => completedTask.id === task.id);
            if (alreadyInCompletedTasks) return false;
            
            const taskDate = parseChineseDate(task.dateTime.date);
            const taskPriority = priorityMappings[task.priority] || task.priority;
            const inWeek = taskDate >= weekStart && taskDate < weekEnd;
            const matchPriority = taskPriority === priority;
            return inWeek && matchPriority;
          });
          
          count = completedFromCompletedTasks.length + completedFromTasks.length;
          overdueRate = Math.min(count * 8, 30); // 已完成任务的"逾期率"用于颜色渐变，较低的颜色
          
          console.log(`✅ ${priority} 已完成 [修复重复计数]:`, {
            completedFromCompletedTasks: completedFromCompletedTasks.length,
            completedFromTasks: completedFromTasks.length,
            total: count,
            note: '已排除completedTasks中重复的任务'
          });
          
        } else {
          // 统计本周的待完成任务
          const weeklyTasks = tasks.filter(task => {
            if (!task.dateTime?.date || task.isCompleted) return false; // 排除已完成的任务
            const taskDate = parseChineseDate(task.dateTime.date);
            const taskPriority = priorityMappings[task.priority] || task.priority;
            const inWeek = taskDate >= weekStart && taskDate < weekEnd;
            const matchPriority = taskPriority === priority;
            
            console.log(`📋 检查${priority}任务:`, {
              title: task.title,
              dateStr: task.dateTime.date,
              parsedDate: taskDate.toLocaleDateString(),
              priority: task.priority,
              mappedPriority: taskPriority,
              inWeek,
              matchPriority,
              isCompleted: task.isCompleted
            });
            
            return inWeek && matchPriority;
          });
          
          if (status === '进行中') {
            // 进行中：有设置时间但还未逾期的任务，或者没设置具体时间的任务
            count = weeklyTasks.filter(task => {
              if (!task.dateTime?.startTime) return true; // 没设置具体时间的算进行中
              
              // 解析时间
              const taskDate = parseChineseDate(task.dateTime.date);
              const timeMatch = task.dateTime.startTime.match(/(上午|下午|晚上)(\d+):(\d+)/);
              if (timeMatch) {
                const period = timeMatch[1];
                let hour = parseInt(timeMatch[2]);
                const minute = parseInt(timeMatch[3]);
                
                // 转换为24小时制
                if (period === '下午' && hour !== 12) {
                  hour += 12;
                } else if (period === '上午' && hour === 12) {
                  hour = 0;
                } else if (period === '晚上') {
                  hour += 12;
                }
                
                const taskDateTime = new Date(taskDate.getTime());
                taskDateTime.setHours(hour, minute, 0, 0);
                
                return now <= taskDateTime;
              }
              return true; // 时间解析失败的情况下算进行中
            }).length;
            overdueRate = Math.min(count * 12 + 25, 60); // 进行中任务的颜色渐变
            
            console.log(`🟡 ${priority} 进行中:`, { count });
            
          } else if (status === '逾期未完成') {
            // 逾期未完成：设置了时间且已经超过设定时间的任务
            count = weeklyTasks.filter(task => {
              if (!task.dateTime?.startTime) return false; // 没设置具体时间的不算逾期
              
              // 解析时间
              const taskDate = parseChineseDate(task.dateTime.date);
              const timeMatch = task.dateTime.startTime.match(/(上午|下午|晚上)(\d+):(\d+)/);
              if (timeMatch) {
                const period = timeMatch[1];
                let hour = parseInt(timeMatch[2]);
                const minute = parseInt(timeMatch[3]);
                
                // 转换为24小时制
                if (period === '下午' && hour !== 12) {
                  hour += 12;
                } else if (period === '上午' && hour === 12) {
                  hour = 0;
                } else if (period === '晚上') {
                  hour += 12;
                }
                
                const taskDateTime = new Date(taskDate.getTime());
                taskDateTime.setHours(hour, minute, 0, 0);
                
                return now > taskDateTime;
              }
              return false; // 时间解析失败的情况下不算逾期
            }).length;
            overdueRate = Math.min(count * 15 + 70, 100); // 逾期任务的颜色渐变，较高的颜色
            
            console.log(`🔴 ${priority} 逾期未完成:`, { count });
          }
        }
        
        matrixData.push({
          id: idCounter.toString(),
          priority,
          status,
          count,
          overdueRate
        });
        
        idCounter++;
      });
    });
    
    console.log('🔥 热力图数据计算完成:', matrixData);
    return matrixData;
  };

  // 计算本周任务分布数据
  const calculateWeeklyData = () => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    console.log('📊 [WeeklyData] 开始计算本周任务分布 [修复重复计数版本]');
    console.log('📊 [WeeklyData] 本周开始日期:', weekStart.toLocaleDateString());
    console.log('📊 [WeeklyData] 当前任务总数:', tasks.length);
    console.log('📊 [WeeklyData] 已完成任务总数:', completedTasks.length);
    console.log('📊 [WeeklyData] 任务列表:', tasks.map(t => ({ 
      title: t.title, 
      type: t.taskType,
      date: t.dateTime?.date,
      time: t.dateTime?.startTime,
      isCompleted: t.isCompleted
    })));
    console.log('📊 [WeeklyData] 已完成任务列表:', completedTasks.map(t => ({ 
      title: t.title, 
      type: t.taskType,
      completedAt: t.completedAt
    })));
    
    // 生成本周七天的日期
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weeklyData = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      
      // 🔧 修复重复计数：只统计当天的待完成任务（排除已完成任务）
      const chineseDateStr = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
      const dayTasks = tasks.filter(task => {
        if (!task.dateTime?.date || task.isCompleted) return false; // 排除已完成任务
        // 支持两种格式："9月11日" 和 "9月11日，周四"
        const isMatch = task.dateTime.date === chineseDateStr || task.dateTime.date.startsWith(chineseDateStr + '，');
        return isMatch;
      });
      
      console.log(`📊 [WeeklyData] ${days[i]} (${chineseDateStr}) 待完成任务:`, dayTasks.map(t => t.title));
      
      // 统计当天的已完成任务
      const completedDateStr = currentDate.toDateString();
      const dayCompletedTasks = completedTasks.filter(task => {
        const completedDate = new Date(task.completedAt);
        return completedDate.toDateString() === completedDateStr;
      });
      
      // 统计tasks中标记为已完成的当天任务
      // 🔧 修复重复计数：只统计不在completedTasks中的已完成任务
      const completedInTasks = tasks.filter(task => {
        if (!task.isCompleted || !task.dateTime?.date) return false;
        
        // 检查这个任务是否已经在completedTasks中
        const alreadyInCompletedTasks = completedTasks.some(completedTask => completedTask.id === task.id);
        if (alreadyInCompletedTasks) return false;
        
        // 支持两种格式："9月11日" 和 "9月11日，周四"
        return task.dateTime.date === chineseDateStr || task.dateTime.date.startsWith(chineseDateStr + '，');
      });
      
      // 合并所有任务（待完成+已完成）
      const allDayTasks = [...dayTasks, ...dayCompletedTasks, ...completedInTasks];
      
      // 按任务类型统计数量
      const taskCounts = {
        勤政: allDayTasks.filter(task => task.taskType === '勤政').length,
        恕己: allDayTasks.filter(task => task.taskType === '恕己').length,
        爱人: allDayTasks.filter(task => task.taskType === '爱人').length
      };
      
      console.log(`📊 [WeeklyData] ${days[i]} 任务统计 [修复重复计数]:`, {
        待完成任务: dayTasks.length,
        已完成任务_从completedTasks: dayCompletedTasks.length,
        已完成任务_从tasks: completedInTasks.length,
        总任务数: allDayTasks.length,
        勤政: taskCounts.勤政,
        恕己: taskCounts.恕己,
        爱人: taskCounts.爱人,
        任务详情: allDayTasks.map(t => ({ 
          title: t.title, 
          type: t.taskType, 
          source: dayTasks.includes(t) ? '待完成' : dayCompletedTasks.includes(t) ? 'completedTasks' : 'tasks中已完成'
        }))
      });
      
      weeklyData.push({
        day: days[i],
        勤政: taskCounts.勤政,
        恕己: taskCounts.恕己,
        爱人: taskCounts.爱人
      });
    }
    
    console.log('📊 [WeeklyData] 最终周数据:', weeklyData);
    return weeklyData;
  };

  // 计算逾期/完成率趋势数据（过去4周）
  const calculateTrendData = () => {
    const now = new Date();
    const trendData = [];
    
    // 计算过去4周的数据
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      // 计算每周的开始和结束时间
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (weekOffset * 7));
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // 获取该周的待完成任务
      const weekTasks = tasks.filter(task => {
        if (!task.dateTime?.date || task.isCompleted) return false;
        const taskDate = parseChineseDate(task.dateTime.date);
        return taskDate >= weekStart && taskDate < weekEnd;
      });
      
      // 获取该周的已完成任务
      const weekCompletedTasks = completedTasks.filter(task => {
        const completedDate = new Date(task.completedAt);
        return completedDate >= weekStart && completedDate < weekEnd;
      });
      
      // 🔧 修复重复计数：只统计不在completedTasks中的已完成任务
      const completedInTasks = tasks.filter(task => {
        if (!task.isCompleted || !task.dateTime?.date) return false;
        
        // 检查这个任务是否已经在completedTasks中
        const alreadyInCompletedTasks = completedTasks.some(completedTask => completedTask.id === task.id);
        if (alreadyInCompletedTasks) return false;
        
        const taskDate = parseChineseDate(task.dateTime.date);
        return taskDate >= weekStart && taskDate < weekEnd;
      });
      
      // 计算总任务数
      const totalCompletedTasks = weekCompletedTasks.length + completedInTasks.length;
      const totalTasks = weekTasks.length + totalCompletedTasks;
      
      // 计算完成率
      let completionRate = 0;
      if (totalTasks > 0) {
        completionRate = Math.round((totalCompletedTasks / totalTasks) * 100);
      }
      
      // 计算逾期率（只统计有设置时间的任务）
      let overdueRate = 0;
      const tasksWithTime = weekTasks.filter(task => 
        task.dateTime?.date && task.dateTime?.startTime
      );
      
      if (tasksWithTime.length > 0) {
        const overdueTasksCount = tasksWithTime.filter(task => {
          const taskDate = parseChineseDate(task.dateTime!.date);
          const timeMatch = task.dateTime!.startTime.match(/(上午|下午|晚上)(\d+):(\d+)/);
          
          if (timeMatch) {
            const period = timeMatch[1];
            let hour = parseInt(timeMatch[2]);
            const minute = parseInt(timeMatch[3]);
            
            // 转换为24小时制
            if (period === '下午' && hour !== 12) {
              hour += 12;
            } else if (period === '上午' && hour === 12) {
              hour = 0;
            } else if (period === '晚上') {
              hour += 12;
            }
            
            const taskDateTime = new Date(taskDate.getTime());
            taskDateTime.setHours(hour, minute, 0, 0);
            
            // 如果当前时间超过任务时间，且任务仍在待完成列表中，算作逾期
            return now > taskDateTime;
          }
          
          return false;
        }).length;
        
        overdueRate = Math.round((overdueTasksCount / tasksWithTime.length) * 100);
      }
      
      // 生成周标签
      const weekLabel = weekOffset === 0 ? '本周' : `前${weekOffset}周`;
      
      trendData.push({
        week: weekLabel,
        completionRate,
        overdueRate
      });
    }
    
    return trendData;
  };

  // 移除了逾期原因词云数据，因为应用中没有收集逾期原因的功能

  const matrixData = calculateMatrixData();
  const weeklyData = calculateWeeklyData();
  const trendData = backendStats && !loadingStats
    ? backendStats.trendData
    : calculateTrendData();

  // 热力图颜色计算 - 根据状态和任务数量智能调色
  const getHeatmapColor = (overdueRate: number, status: string, count: number) => {
    // 特殊处理"逾期未完成"状态
    if (status === '逾期未完成') {
      if (count === 0) {
        // 没有逾期任务时显示深灰色
        console.log(`🔵 [热力图颜色] ${status}: 无逾期任务，使用深灰色`);
        return '#6b7280'; // 深灰色
      } else {
        // 有逾期任务时显示红色预警
        console.log(`🔴 [热力图颜色] ${status}: 发现${count}个逾期任务，使用红色预警`);
        return '#ef4444'; // 红色预警
      }
    }
    
    // 其他状态的颜色逻辑
    if (status === '已完成') {
      // 已完成任务使用绿色系
      if (count === 0) return '#e5e7eb'; // 浅灰色 - 无任务
      if (count >= 5) return '#16a34a'; // 深绿色 - 高完成量
      if (count >= 3) return '#22c55e'; // 中绿色 - 中等完成量
      return '#4ade80'; // 浅绿色 - 少量完成
    }
    
    if (status === '进行中') {
      // 进行中任务使用橙色系
      if (count === 0) return '#e5e7eb'; // 浅灰色 - 无任务
      if (count >= 5) return '#ea580c'; // 深橙色 - 大量进行中
      if (count >= 3) return '#f97316'; // 中橙色 - 中等进行中
      return '#fb923c'; // 浅橙色 - 少量进行中
    }
    
    // 兜底：使用原有逻辑
    if (overdueRate > 60) return '#ff6b6b';
    if (overdueRate > 30) return '#ffa726';
    if (overdueRate > 15) return '#66bb6a';
    return '#4caf50';
  };

  const taskTypeColors = {
    '勤政': '#d2b48c',
    '恕己': '#a9a9a9', 
    '爱人': '#dda0dd'
  };

  return (
    <div 
      className="h-full bg-[#FAFAFA] overflow-y-auto completion-scroll-container"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        padding: "12px"
      }}
    >
      <style>{`
        .completion-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* 标题 */}
      <div style={{ marginBottom: "12px", padding: "0 12px" }}>
        <h2 className="text-[18px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]" style={{ marginBottom: "8px" }}>
          任务完成度分析
        </h2>
        <p className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
          本周任务完成情况热力图分析
        </p>
      </div>

      {/* 主要统计数据 */}
      <div className="grid grid-cols-3 gap-3" style={{ marginBottom: "12px", padding: "0 12px" }}>
        <div 
          className="unified-content bg-white"
          style={{
            borderRadius: '10px',
            border: '1px solid #3A3F47',
            padding: '12px',
            boxShadow: 'none'
          }}
        >
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#4CAF50]">
            {weeklyCompletionRate}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            本周完成率
          </div>
        </div>
        <div 
          className="unified-content bg-white"
          style={{
            borderRadius: '10px',
            border: '1px solid #3A3F47',
            padding: '12px',
            boxShadow: 'none'
          }}
        >
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#ff6b6b]">
            {weeklyOverdueRate}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            本周逾期率
          </div>
        </div>
        <div 
          className="unified-content bg-white"
          style={{
            borderRadius: '10px',
            border: '1px solid #3A3F47',
            padding: '12px',
            boxShadow: 'none'
          }}
        >
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#2196F3]">
            {weeklyTaskCount}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            本周任务
          </div>
        </div>
      </div>

      {/* 优先级-完成状态矩阵热力图 */}
      <div 
        className="unified-content bg-white"
        style={{
          borderRadius: '10px',
          border: '1px solid #3A3F47',
          padding: '12px',
          marginBottom: "12px",
          boxShadow: 'none'
        }}
      >
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]" style={{ marginBottom: "12px" }}>
          任务优先级完成情况热力图
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {['重要/紧急', '重要不紧急', '紧急不重要', '不重要不紧急'].map(priority => (
            <div key={priority} className="text-center">
              <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-2">
                {priority}
              </div>
              <div className="space-y-1">
                {['已完成', '进行中', '逾期未完成'].map(status => {
                  const cellData = matrixData.find(d => d.priority === priority && d.status === status);
                  const count = cellData?.count || 0;
                  const overdueRate = cellData?.overdueRate || 0;
                  const backgroundColor = getHeatmapColor(overdueRate, status, count);
                  
                  // 根据背景颜色决定文字颜色，确保对比度
                  const textColor = backgroundColor === '#e5e7eb' ? '#374151' : '#ffffff'; // 浅灰背景用深色文字，其他用白色
                  
                  return (
                    <div
                      key={`${priority}-${status}`}
                      className="h-12 rounded border border-[#ddd] flex flex-col items-center justify-center"
                      style={{ backgroundColor }}
                    >
                      <div 
                        className="text-[10px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]"
                        style={{ color: textColor }}
                      >
                        {count}
                      </div>
                      <div 
                        className="text-[8px] opacity-80 font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]"
                        style={{ color: textColor }}
                      >
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 移除了逾期原因词云功能，因为应用中没有收集逾期原因的功能 */}

      {/* 本周任务分布 */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4">
          本周任务分布
        </h3>
        <div className="flex justify-center">
          <div style={{ height: '166px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '12px', 
                    border: '1px solid #3a3f47',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="勤政" fill={taskTypeColors['勤政']} />
                <Bar dataKey="恕己" fill={taskTypeColors['恕己']} />
                <Bar dataKey="爱人" fill={taskTypeColors['爱人']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 逾期/完成率趋势线 */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4">
          逾期/完成率趋势
        </h3>
        <div className="flex justify-center">
          <div style={{ height: '166px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 10, fill: '#666' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#666' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '12px', 
                    border: '1px solid #3a3f47',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  name="完成率(%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="overdueRate" 
                  stroke="#ff6b6b" 
                  strokeWidth={2}
                  name="逾期率(%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 改进建议 */}
      <div className="bg-[#C9E3B0] rounded-lg p-4 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-3">
          贤王的建议
        </h3>
        <p className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
          阿尔图，我暂时还没有建议，你做的很棒。
        </p>
      </div>
    </div>
  );
}