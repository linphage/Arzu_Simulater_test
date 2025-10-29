import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, ComposedChart } from 'recharts';
import { focusAnalysisService, KeyMetrics, DailyData } from '../services/focusAnalysisService';
import exampleImage from 'figma:asset/39e7de7b530705a4ebc47d325fa07c7b8fc8be92.png';

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
  focusTime: number; // 专注时间（毫秒）
  completedAt: Date;
}

interface TaskStats {
  taskId: string;
  interruptions: number; // 中断次数
  abandonments: number; // 放弃次数
  totalFocusTime: number; // 总专注时间
}

interface FocusAnalysisViewProps {
  tasks: Task[];
  completedTasks: CompletedTask[];
  taskStats: TaskStats[];
}

export function FocusAnalysisView({ tasks, completedTasks, taskStats }: FocusAnalysisViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');
  const [backendData, setBackendData] = useState<{ keyMetrics: KeyMetrics; dailyData: DailyData[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFocusStats = async () => {
      try {
        setLoading(true);
        const response = await focusAnalysisService.getFocusStats(selectedTimeframe);
        setBackendData(response.data);
      } catch (error) {
        console.error('获取专注度统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFocusStats();
  }, [selectedTimeframe]);

  // 计算关键指标
  const calculateKeyMetrics = () => {
    if (completedTasks.length === 0) {
      return {
        avgFocusTime: 0,
        avgInterruptions: 0,
        focusIndex: 0
      };
    }

    // 平均专注时长（转换为分钟）
    const totalFocusTime = completedTasks.reduce((sum, task) => sum + task.focusTime, 0);
    const avgFocusTime = Math.round(totalFocusTime / completedTasks.length / 60000); // 毫秒转分钟

    // 平均中断频率
    const totalInterruptions = taskStats.reduce((sum, stat) => sum + stat.interruptions, 0);
    const avgInterruptions = taskStats.length > 0 ? (totalInterruptions / taskStats.length).toFixed(1) : '0';

    // 专注指数计算：有效专注时长 / (有效专注时长 + 中断损失时长) × 100%
    // 假设每次中断平均损失2分钟
    const totalInterruptionLoss = totalInterruptions * 2 * 60 * 1000; // 毫秒
    const totalEffectiveTime = totalFocusTime + totalInterruptionLoss;
    const focusIndex = totalEffectiveTime > 0 ? Math.round((totalFocusTime / totalEffectiveTime) * 100) : 0;

    return { avgFocusTime, avgInterruptions, focusIndex };
  };

  // 处理真实的专注时长数据（按日期分组）
  const processFocusSessionData = () => {
    const timeframeDays = selectedTimeframe === 'week' ? 7 : 30;
    const now = new Date();
    const dateMap = new Map();

    // 初始化日期数据
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = selectedTimeframe === 'week' 
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : `${date.getMonth() + 1}/${date.getDate()}`;
      
      dateMap.set(dateKey, {
        date: dateKey,
        sessionDuration: 0,
        interruptions: 0,
        sessions: 0,
        focusIndex: 0,
        taskCount: 0
      });
    }

    // 聚合完成任务数据
    completedTasks.forEach(task => {
      const taskDate = new Date(task.completedAt);
      const dateKey = selectedTimeframe === 'week'
        ? `${taskDate.getMonth() + 1}/${taskDate.getDate()}`
        : `${taskDate.getMonth() + 1}/${taskDate.getDate()}`;
      
      if (dateMap.has(dateKey)) {
        const dayData = dateMap.get(dateKey);
        const taskStat = taskStats.find(stat => stat.taskId === task.id);
        
        dayData.sessions += 1;
        dayData.sessionDuration += Math.round(task.focusTime / 60000); // 转换为分钟
        dayData.interruptions += taskStat ? taskStat.interruptions : 0;
        dayData.taskCount += 1;
      }
    });

    // 计算平均值和专注指数
    dateMap.forEach((dayData, dateKey) => {
      if (dayData.taskCount > 0) {
        dayData.sessionDuration = Math.round(dayData.sessionDuration / dayData.taskCount);
        dayData.interruptions = Math.round(dayData.interruptions / dayData.taskCount * 10) / 10;
        
        // 专注指数：基于中断次数计算，中断越少指数越高
        const maxInterruptions = 5; // 假设最大中断次数为5
        dayData.focusIndex = Math.max(60, 100 - (dayData.interruptions / maxInterruptions) * 40);
      } else {
        // 没有数据的日期使用默认值
        dayData.sessionDuration = 0;
        dayData.interruptions = 0;
        dayData.focusIndex = 0;
      }
    });

    return Array.from(dateMap.values());
  };

  // 处理中断原因分布数据（基于真实中断数据模拟分布）
  const processInterruptionData = () => {
    const totalInterruptions = taskStats.reduce((sum, stat) => sum + stat.interruptions, 0);
    
    if (totalInterruptions === 0) {
      return [
        { name: '暂无数据', value: 100, color: '#e0e0e0' }
      ];
    }

    // 基于常见中断原因分布模拟
    return [
      { name: '手机社交', value: 35, color: '#ff6b6b' },
      { name: '临时事务', value: 28, color: '#4ecdc4' },
      { name: '生理需求', value: 20, color: '#45b7d1' },
      { name: '外部打扰', value: 17, color: '#96ceb4' }
    ];
  };

  // 🔧 修复专注指数趋势数据的日期计算问题
  const processFocusIndexData = () => {
    const days = selectedTimeframe === 'week' 
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : Array.from({length: 30}, (_, i) => `${i+1}日`);
    
    const timeframeDays = selectedTimeframe === 'week' ? 7 : 30;
    const now = new Date();
    const dateMap = new Map();

    console.log('🔧 [专注指数] 开始修复日期计算问题');
    console.log('🔧 [专注指数] 当前时间:', now.toLocaleString());
    console.log('🔧 [专注指数] 当前是周几:', now.getDay()); // 0=周日, 1=周一, ..., 6=周六
    console.log('🔧 [专注指数] 已完成任务数量:', completedTasks.length);
    console.log('🔧 [专注指数] 任务统计数量:', taskStats.length);

    if (selectedTimeframe === 'week') {
      // 🔧 修复周视图的日期计算
      const currentDay = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
      const currentDayIndex = currentDay === 0 ? 6 : currentDay - 1; // 转换为我们的数组索引 (0=周一, ..., 6=周日)
      
      console.log('🔧 [专注指数] 当前是', days[currentDayIndex]);
      
      // 初始化本周每一天的数据
      days.forEach((day, index) => {
        dateMap.set(day, {
          day,
          focusIndex: 0,
          avgDuration: 0,
          interruptionRate: 0,
          taskCount: 0
        });
      });

      // 聚合数据
      completedTasks.forEach(task => {
        const taskDate = new Date(task.completedAt);
        const taskDay = taskDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
        const taskDayIndex = taskDay === 0 ? 6 : taskDay - 1; // 转换为我们的数组索引
        
        // 检查是否在本周内
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - currentDayIndex);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        if (taskDate >= weekStart && taskDate < weekEnd) {
          const dayKey = days[taskDayIndex];
          
          console.log('🔧 [专注指数] 任务分配:', {
            taskTitle: task.title,
            taskDate: taskDate.toLocaleDateString(),
            taskDay: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][taskDay],
            assignedTo: dayKey,
            focusTime: Math.round(task.focusTime / 60000) + '分钟'
          });
          
          if (dateMap.has(dayKey)) {
            const dayData = dateMap.get(dayKey);
            const taskStat = taskStats.find(stat => stat.taskId === task.id);
            
            dayData.avgDuration += Math.round(task.focusTime / 60000);
            dayData.interruptionRate += taskStat ? taskStat.interruptions : 0;
            dayData.taskCount += 1;
          }
        }
      });
    } else {
      // 月视图保持原有逻辑
      days.forEach((day, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (timeframeDays - 1 - index));
        
        dateMap.set(day, {
          day,
          focusIndex: 0,
          avgDuration: 0,
          interruptionRate: 0,
          taskCount: 0
        });
      });

      // 聚合数据
      completedTasks.forEach(task => {
        const taskDate = new Date(task.completedAt);
        const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < timeframeDays) {
          const dayIndex = timeframeDays - 1 - daysDiff;
          const dayKey = days[dayIndex];
          
          if (dateMap.has(dayKey)) {
            const dayData = dateMap.get(dayKey);
            const taskStat = taskStats.find(stat => stat.taskId === task.id);
            
            dayData.avgDuration += Math.round(task.focusTime / 60000);
            dayData.interruptionRate += taskStat ? taskStat.interruptions : 0;
            dayData.taskCount += 1;
          }
        }
      });
    }

    // 计算平均值
    dateMap.forEach((dayData) => {
      if (dayData.taskCount > 0) {
        dayData.avgDuration = Math.round(dayData.avgDuration / dayData.taskCount);
        dayData.interruptionRate = Math.round((dayData.interruptionRate / dayData.taskCount) * 100) / 10; // 转换为百分比
        
        // 计算专注指数
        const maxInterruptions = 5;
        dayData.focusIndex = Math.max(60, Math.round(100 - (dayData.interruptionRate / maxInterruptions) * 40));
        
        console.log('🔧 [专注指数] 计算结果:', {
          day: dayData.day,
          taskCount: dayData.taskCount,
          avgDuration: dayData.avgDuration,
          interruptionRate: dayData.interruptionRate,
          focusIndex: dayData.focusIndex
        });
      } else {
        dayData.avgDuration = 0;
        dayData.interruptionRate = 0;
        dayData.focusIndex = 0;
      }
    });

    const result = Array.from(dateMap.values());
    console.log('🔧 [专注指数] 最终数据:', result);
    return result;
  };

  const keyMetrics = backendData && !loading ? backendData.keyMetrics : calculateKeyMetrics();
  const focusSessionData = backendData && !loading ? backendData.dailyData : processFocusSessionData();
  const focusIndexData = backendData && !loading ? backendData.dailyData : processFocusIndexData();

  return (
    <div 
      className="h-full bg-[#FAFAFA] overflow-y-auto focus-scroll-container"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        padding: "12px"
      }}
    >
      <style>{`
        .focus-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* 标题和时间段选择 */}
      <div style={{ marginBottom: "12px", padding: "0 12px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
          <h2 className="text-[18px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]">
            专注力深度分析
          </h2>
          <div 
            className="bg-white p-1 border border-[#3a3f47] flex"
            style={{
              borderRadius: '6px',
              boxShadow: 'none'
            }}
          >
            <button
              className={`unified-button-sm transition-all duration-200 ${
                selectedTimeframe === 'week' 
                  ? 'bg-[#4CAF50] text-white border-[#4CAF50]' 
                  : 'bg-transparent text-[#666] border-transparent hover:bg-gray-100'
              }`}
              style={{
                fontSize: '12px',
                fontWeight: '500',
                fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif",
                borderRadius: '4px',
                padding: '6px 12px'
              }}
              onClick={() => setSelectedTimeframe('week')}
            >
              本周
            </button>
            <button
              className={`unified-button-sm transition-all duration-200 ${
                selectedTimeframe === 'month' 
                  ? 'bg-[#4CAF50] text-white border-[#4CAF50]' 
                  : 'bg-transparent text-[#666] border-transparent hover:bg-gray-100'
              }`}
              style={{
                fontSize: '12px',
                fontWeight: '500',
                fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif",
                borderRadius: '4px',
                padding: '6px 12px'
              }}
              onClick={() => setSelectedTimeframe('month')}
            >
              本月
            </button>
          </div>
        </div>
        
        <p className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
          基于番茄钟数据的专注力深度分析与洞察
        </p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 border border-[#3a3f47] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#66bb6a] opacity-20 rounded-full transform translate-x-2 -translate-y-2"></div>
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#4CAF50]">
            {keyMetrics.avgFocusTime > 0 ? `${keyMetrics.avgFocusTime}分钟` : '暂无数据'}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            平均专注时长
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-[#3a3f47] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-[#ff6b6b] to-[#ffa726] opacity-20 rounded-full transform translate-x-2 -translate-y-2"></div>
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#ff6b6b]">
            {keyMetrics.avgInterruptions > 0 ? `${keyMetrics.avgInterruptions}次` : '暂无数据'}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            平均中断频率
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-[#3a3f47] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-[#2196F3] to-[#42a5f5] opacity-20 rounded-full transform translate-x-2 -translate-y-2"></div>
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#2196F3]">
            {keyMetrics.focusIndex > 0 ? `${keyMetrics.focusIndex}%` : '暂无数据'}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            专注指数
          </div>
        </div>
      </div>

      {/* 每日专注时长与中断情况 */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
          <div className="w-2 h-2 bg-[#4CAF50] rounded-full mr-2"></div>
          每日专注时长与中断情况
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={focusSessionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#66bb6a" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '12px', 
                  border: '1px solid #3a3f47',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="sessionDuration" 
                fill="url(#barGradient)"
                name="平均专注时长(分钟)"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="interruptions" 
                stroke="#ff6b6b" 
                strokeWidth={3}
                name="中断次数"
                dot={{ r: 5, fill: '#ff6b6b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#ff6b6b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* 专注指数趋势线 */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
          <div className="w-2 h-2 bg-[#2196F3] rounded-full mr-2"></div>
          专注指数趋势 (有效专注时长/总时长×100%)
        </h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={focusIndexData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey={backendData && !loading ? "date" : "day"}
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#666' }}
                domain={[0, 100]}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '12px', 
                  border: '1px solid #3a3f47',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="focusIndex" 
                stroke="#2196F3" 
                strokeWidth={3}
                name="专注指数(%)"
                dot={{ r: 5, fill: '#2196F3', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#2196F3' }}
                fill="url(#colorFocus)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 洞察与建议 */}
      <div className="bg-gradient-to-r from-[#ddf0ff] to-[#e8f5e8] rounded-lg p-4 border border-[#3a3f47]">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-[#4CAF50] rounded-full flex items-center justify-center mr-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]">
            贤王的专注洞察
          </h3>
        </div>
        <div className="space-y-3">
          {/* 动态生成洞察建议 */}
          {completedTasks.length === 0 ? (
            <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#e0e0e0] border-opacity-30">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-[#e0e0e0] rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                    <strong>开始您的专注之旅：</strong>还没有完成任务数据，开始使用番茄钟来追踪您的专注表现吧！
                  </div>
                  <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    完成几个任务后，这里将显示个性化的专注分析和建议
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 最佳专注时段分析 */}
              {(() => {
                const bestDay = focusIndexData.reduce((best, current) => 
                  current.focusIndex > best.focusIndex ? current : best
                );
                return (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#4CAF50] border-opacity-30">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                          <strong>最佳专注时段：</strong>
                          {bestDay.focusIndex > 0 
                            ? `${bestDay.day}专注指数最高(${bestDay.focusIndex}%)，可安排重要任务`
                            : '数据收集中，继续使用番茄钟来发现您的最佳专注时段'
                          }
                        </div>
                        <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                          {bestDay.focusIndex > 0 
                            ? '建议在此时段处理复杂的勤政类任务'
                            : '多使用几天后，系统会为您分析最适合的工作时段'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 中断情况分析 */}
              <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#ff6b6b] border-opacity-30">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                      <strong>中断情况分析：</strong>
                      {keyMetrics.avgInterruptions === '0' 
                        ? '恭喜！您的专注状态很好，没有记录到中断'
                        : `平均每任务中断${keyMetrics.avgInterruptions}次，建议番茄钟期间开启专注模式`
                      }
                    </div>
                    <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                      {keyMetrics.avgInterruptions === '0'
                        ? '继续保持这种专注状态，您的效率很高'
                        : '可使用应用锁定功能，减少不必要的通知干扰'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* 专注状态评估 */}
              <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#2196F3] border-opacity-30">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#2196F3] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                      <strong>专注状态评估：</strong>
                      {keyMetrics.avgFocusTime === 0 
                        ? '开始您的第一个番茄钟任务，建立专注习惯'
                        : keyMetrics.avgFocusTime >= 20 
                          ? `平均专注时长${keyMetrics.avgFocusTime}分钟，接近理想的25分钟目标`
                          : `平均专注时长${keyMetrics.avgFocusTime}分钟，可以尝试延长单次专注时间`
                      }
                    </div>
                    <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                      {keyMetrics.avgFocusTime === 0
                        ? '每个完成的任务都会帮助我们更好地分析您的专注模式'
                        : keyMetrics.avgFocusTime >= 20
                          ? '继续保持当前的工作节奏，可适当延长单次专注时长'
                          : '逐步增加专注时间，培养更深度的专注习惯'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}