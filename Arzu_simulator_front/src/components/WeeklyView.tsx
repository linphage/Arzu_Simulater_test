import React from 'react';

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

interface WeeklyViewProps {
  tasks: TaskData[];
  onTaskClick?: (task: TaskData) => void;
}

export function WeeklyView({ tasks, onTaskClick }: WeeklyViewProps) {
  // 一周的所有天数
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // Helper function to truncate title to appropriate length
  const truncateTitle = (title: string, maxLength: number = 8) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // 获取当前周的日期范围（包括跨周的更大范围）
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0是周日，1是周一...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // 周一的偏移量
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDates: { [key: string]: Date } = {};
    weekDays.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      weekDates[day] = date;
    });
    
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();

  // 强化的中文日期解析函数，专门处理DateTimeModal的格式
  const parseChineseDate = (dateString: string): Date | null => {
    try {
      const currentYear = new Date().getFullYear();
      let cleanDateString = dateString.trim();
      
      console.log(`🔍 [WeeklyView] 开始解析日期: "${dateString}"`);
      
      // 移除周几信息和其他后缀
      cleanDateString = cleanDateString.replace(/[，,]\s*周[一二三四五六日天日].*$/, '');
      cleanDateString = cleanDateString.replace(/\s*星期[一二三四五六日天].*$/, '');
      cleanDateString = cleanDateString.replace(/\s+/g, ''); // 移除所有空格
      
      console.log(`🧹 [WeeklyView] 清理后的日期字符串: "${cleanDateString}"`);
      
      // 优先处理DateTimeModal生成的格式：8月21日
      if (cleanDateString.includes('月') && cleanDateString.includes('日') && !cleanDateString.includes('年')) {
        const match = cleanDateString.match(/(\d{1,2})月(\d{1,2})日/);
        if (match) {
          const [, month, day] = match;
          const result = new Date(currentYear, parseInt(month) - 1, parseInt(day));
          
          // 设置为当天的开始时间，确保日期比较准确
          result.setHours(0, 0, 0, 0);
          
          console.log(`✅ [WeeklyView] 解析月日格式成功: ${month}月${day}日 -> ${result.toLocaleDateString('zh-CN')} (${result.toISOString().split('T')[0]})`);
          return result;
        }
      }
      
      // 处理完整年月日格式：2024年8月21日
      if (cleanDateString.includes('年') && cleanDateString.includes('月') && cleanDateString.includes('日')) {
        const match = cleanDateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
          const [, year, month, day] = match;
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          result.setHours(0, 0, 0, 0);
          console.log(`✅ [WeeklyView] 解析完整年月日格式: ${year}年${month}月${day}日 -> ${result.toLocaleDateString('zh-CN')}`);
          return result;
        }
      }
      
      // 处理ISO和其他标准格式
      const isoFormats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/, // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
      ];
      
      for (const format of isoFormats) {
        const match = cleanDateString.match(format);
        if (match) {
          let year, month, day;
          if (format.source.startsWith('^(\\d{4})')) {
            [, year, month, day] = match;
          } else {
            [, month, day, year] = match;
          }
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          result.setHours(0, 0, 0, 0);
          console.log(`✅ [WeeklyView] 解析ISO格式: ${cleanDateString} -> ${result.toLocaleDateString('zh-CN')}`);
          return result;
        }
      }
      
      // 最后尝试直接解析
      const directParsed = new Date(cleanDateString);
      if (!isNaN(directParsed.getTime())) {
        directParsed.setHours(0, 0, 0, 0);
        console.log(`✅ [WeeklyView] 直接解析成功: ${cleanDateString} -> ${directParsed.toLocaleDateString('zh-CN')}`);
        return directParsed;
      }
      
      console.warn(`❌ [WeeklyView] 无法解析日期格式: "${cleanDateString}"`);
      return null;
      
    } catch (error) {
      console.error(`❌ [WeeklyView] 日期解析错误: "${dateString}"`, error);
      return null;
    }
  };

  // 改进的日期匹配函数
  const isTaskOnDay = (task: TaskData, targetDay: string) => {
    if (!task.dateTime?.date) return false;
    
    const targetDate = weekDates[targetDay];
    const taskDate = parseChineseDate(task.dateTime.date);
    
    if (!taskDate) {
      console.warn(`❌ [WeeklyView] 任务 "${task.title}" 的日期解析失败: "${task.dateTime.date}"`);
      return false;
    }
    
    // 确保目标日期也设置为当天开始时间
    const normalizedTargetDate = new Date(targetDate);
    normalizedTargetDate.setHours(0, 0, 0, 0);
    
    // 比较年月日，忽略时间
    const isMatch = (
      taskDate.getFullYear() === normalizedTargetDate.getFullYear() &&
      taskDate.getMonth() === normalizedTargetDate.getMonth() &&
      taskDate.getDate() === normalizedTargetDate.getDate()
    );
    
    if (isMatch) {
      console.log(`✅ [WeeklyView] 任务 "${task.title}" 精确匹配到 ${targetDay}`, {
        taskDateStr: task.dateTime.date,
        taskDate: taskDate.toLocaleDateString('zh-CN'),
        targetDate: normalizedTargetDate.toLocaleDateString('zh-CN'),
        taskFullDate: taskDate.toISOString().split('T')[0],
        targetFullDate: normalizedTargetDate.toISOString().split('T')[0]
      });
    } else {
      // 额外调试信息
      const taskDayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][taskDate.getDay()];
      console.log(`ℹ️ [WeeklyView] 任务 "${task.title}" 不匹配 ${targetDay}, 应在 ${taskDayOfWeek}`, {
        taskDate: taskDate.toLocaleDateString('zh-CN'),
        targetDate: normalizedTargetDate.toLocaleDateString('zh-CN')
      });
    }
    
    return isMatch;
  };

  // 获取指定天的任务
  const getTasksForDay = (day: string) => {
    return tasks.filter(task => isTaskOnDay(task, day));
  };

  // 计算每种任务类型在本周的数量
  const getWeeklyTaskStats = () => {
    const weeklyTasksByType = {
      '勤政': [] as TaskData[],
      '恕己': [] as TaskData[],
      '爱人': [] as TaskData[]
    };

    weekDays.forEach(day => {
      const dayTasks = getTasksForDay(day);
      dayTasks.forEach(task => {
        if (task.taskType in weeklyTasksByType) {
          weeklyTasksByType[task.taskType as keyof typeof weeklyTasksByType].push(task);
        }
      });
    });

    return weeklyTasksByType;
  };

  const weeklyTaskStats = getWeeklyTaskStats();

  // 获取今天是周几
  const getTodayWeekday = () => {
    const today = new Date();
    const dayIndex = today.getDay(); // 0是周日，1是周一...
    const weekDayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDayMap[dayIndex];
  };

  const todayWeekday = getTodayWeekday();

  // 获取任务类型的颜色
  const getTaskTypeColors = (taskType: string) => {
    const taskTypeColors = {
      '勤政': { bg: '#F7E9DC', text: '#5B3A29', border: '#D7BFAE' }, // 金色系
      '恕己': { bg: '#DCE8F7', text: '#3A3F47', border: '#AEB8D7' }, // 银色系
      '爱人': { bg: '#fbd5f2', text: '#8B5A8B', border: '#E8A8E8' }   // 粉色系
    };

    return taskTypeColors[taskType as keyof typeof taskTypeColors] || taskTypeColors['勤政'];
  };

  // 获取优先级颜色
  const getPriorityColors = (priority: string) => {
    const priorityColors = {
      '金卡': { bg: '#F7E9DC', text: '#5B3A29', border: '#D7BFAE' },
      '银卡': { bg: '#DCE8F7', text: '#3A3F47', border: '#AEB8D7' },
      '铜卡': { bg: '#f2a5a5', text: '#5B3A29', border: '#E8A8A8' },
      '石卡': { bg: '#E0E0E0', text: '#3A3F47', border: '#AEAEAE' }
    };

    return priorityColors[priority as keyof typeof priorityColors] || priorityColors['石卡'];
  };

  // 调试：显示所有任务的日期信息
  React.useEffect(() => {
    console.log('🔍 [WeeklyView] === 周视图详细调试信息 ===');
    console.log('📅 [WeeklyView] 当前周日期范围:', Object.entries(weekDates).map(([day, date]) => ({
      day,
      date: date.toLocaleDateString('zh-CN'),
      isoDate: date.toISOString().split('T')[0],
      dayOfWeek: date.getDay()
    })));
    
    console.log('📋 [WeeklyView] 所有任务日期解析结果:');
    tasks.forEach((task, index) => {
      if (task.dateTime?.date) {
        const parsed = parseChineseDate(task.dateTime.date);
        console.log(`${index + 1}. 任务 "${task.title}":`, {
          原始日期: task.dateTime.date,
          解析结果: parsed ? parsed.toLocaleDateString('zh-CN') : '❌ 解析失败',
          ISO格式: parsed ? parsed.toISOString().split('T')[0] : 'N/A',
          应显示在: parsed ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parsed.getDay()] : 'N/A'
        });
      } else {
        console.log(`${index + 1}. 任务 "${task.title}": 无日期信息`);
      }
    });
    
    console.log('📊 [WeeklyView] 各天任务分布:');
    weekDays.forEach(day => {
      const dayTasks = getTasksForDay(day);
      console.log(`${day}: ${dayTasks.length}个任务`, dayTasks.map(t => t.title));
    });
    
    console.log('=========================');
  }, [tasks, weekDates]);

  return (
    <div 
      className="w-full h-full bg-[#f0f0e8] rounded-t-[28px] overflow-hidden flex flex-col"
    >
      {/* 任务类型统计头部 - 固定在顶部 */}
      <div 
        className="bg-white flex-shrink-0"
        style={{
          borderBottom: '1px solid #3A3F47',
          padding: '12px'
        }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
          <span 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#3a3f47] flex-1 text-left"
            style={{ fontSize: '14px', fontVariationSettings: "'wght' 400" }}
          >
            勤政
          </span>
          <span 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#3a3f47] flex-1 text-center"
            style={{ fontSize: '14px', fontVariationSettings: "'wght' 400" }}
          >
            恕己
          </span>
          <span 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#3a3f47] flex-1 text-right"
            style={{ fontSize: '14px', fontVariationSettings: "'wght' 400" }}
          >
            爱人
          </span>
        </div>
        
        {/* 任务数量显示 */}
        <div className="flex justify-between items-center">
          <div className="flex-1 text-left">
            <span 
              className="inline-flex items-center justify-center w-8 h-8 bg-[#F7E9DC] border border-[#D7BFAE] rounded-full font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#5B3A29]"
              style={{ fontSize: '14px', fontVariationSettings: "'wght' 400" }}
            >
              {weeklyTaskStats['勤政'].length || 0}
            </span>
          </div>
          <div className="flex-1 text-center">
            <span 
              className="inline-flex items-center justify-center w-8 h-8 bg-[#DCE8F7] border border-[#AEB8D7] rounded-full font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#3A3F47]"
              style={{ fontSize: '14px', fontVariationSettings: "'wght' 400" }}
            >
              {weeklyTaskStats['恕己'].length || 0}
            </span>
          </div>
          <div className="flex-1 text-right">
            <span 
              className="inline-flex items-center justify-center w-8 h-8 bg-[#fbd5f2] border border-[#E8A8E8] rounded-full font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#8B5A8B]"
              style={{ fontSize: '14px', fontVariationSettings: "'wght' 400" }}
            >
              {weeklyTaskStats['爱人'].length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 周任务列表 - 可滚动区域 */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}
      >
        <style>{`
          .weekly-view-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div 
          className="space-y-4 weekly-view-container"
          style={{
            padding: "12px"
          }}
        >
          {weekDays.map((day) => {
            const isToday = day === todayWeekday;
            const dayTasks = getTasksForDay(day);
            const dayDate = weekDates[day];
            
            return (
              <div key={day} className="space-y-2">
                {/* 日期标题 */}
                <div 
                  className="flex items-center justify-between"
                  style={{ padding: "0 4px" }}
                >
                  <div className="flex items-center gap-2">
                    <h3 
                      className={`font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] ${
                        isToday ? 'text-[#4CAF50]' : 'text-[#3a3f47]'
                      }`}
                      style={{ fontSize: '16px', fontVariationSettings: "'wght' 400" }}
                    >
                      {day}
                    </h3>
                    {isToday && (
                      <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
                    )}
                  </div>
                  <span 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[#91a67c]"
                    style={{ fontSize: '12px', fontVariationSettings: "'wght' 400" }}
                  >
                    {dayDate.getDate()}日
                  </span>
                </div>
                
                {/* 任务按钮列表 */}
                <div 
                  className="flex flex-wrap gap-2"
                  style={{ paddingLeft: "8px" }}
                >
                  {dayTasks.length === 0 ? (
                    <button
                      className="unified-button bg-[#f8f8f8] text-[#91a67c] opacity-60"
                      disabled
                      style={{
                        fontSize: '12px !important',
                        fontWeight: '500',
                        borderRadius: '6px',
                        border: '1px solid #3A3F47',
                        padding: '6px 12px',
                        cursor: 'default',
                        boxShadow: 'none'
                      }}
                    >
                      无任务
                    </button>
                  ) : (
                    dayTasks.map((task) => {
                      const colors = getTaskTypeColors(task.taskType);
                      const priorityColors = getPriorityColors(task.priority);
                      const isCompleted = task.isCompleted;
                      
                      return (
                        <button
                          key={task.id}
                          className={`unified-button transition-all duration-200 ${
                            isCompleted 
                              ? 'opacity-60 cursor-not-allowed' 
                              : 'hover:opacity-80 active:scale-95 cursor-pointer'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? '#E0E0E0' : priorityColors.bg,
                            color: isCompleted ? '#666666' : priorityColors.text,
                            border: '1px solid #3A3F47',
                            fontSize: '12px !important',
                            fontWeight: '500',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            maxWidth: '120px',
                            boxShadow: 'none !important',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}
                          disabled={isCompleted}
                          onClick={() => {
                            console.log(`🎯 [WeeklyView] 点击任务: ${task.title}`);
                            
                            // 检查任务是否已完成
                            if (task.isCompleted) {
                              console.log(`⚠️ [WeeklyView] 任务 "${task.title}" 已完成，无法进入番茄钟`);
                              return;
                            }
                            
                            // 调用父组件传递的任务点击处理函数
                            if (onTaskClick) {
                              console.log(`🚀 [WeeklyView] 启动番茄钟，任务: ${task.title}`);
                              onTaskClick(task);
                            }
                          }}
                          title={isCompleted 
                            ? `${task.title} - 已完成 - ${task.taskType} - ${task.priority} - ${task.dateTime?.date}`
                            : `点击进入番茄钟 - ${task.title} - ${task.taskType} - ${task.priority} - ${task.dateTime?.date}`
                          }
                        >
                          <span className="truncate">
                            {isCompleted ? '✓ ' : ''}{truncateTitle(task.title)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* 底部周总结 */}
          <div style={{ marginTop: "32px" }}>
            {/* 周任务总结 */}
            {/* 任务概览区域已删除 */}
          </div>
        </div>
      </div>
    </div>
  );
}