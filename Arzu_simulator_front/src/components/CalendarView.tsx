import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarService, CheckInData, TaskStat } from '../services/calendarService';

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

interface CalendarViewProps {
  tasks: Task[];
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [remainingMakeUps, setRemainingMakeUps] = useState(2);
  const [recentStats, setRecentStats] = useState<TaskStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchRecentStats();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await calendarService.getCalendarCheckIns(currentYear, currentMonth + 1);
      setCheckIns(response.data.checkIns);
      setRemainingMakeUps(response.data.remainingMakeUps);
    } catch (error) {
      console.error('获取打卡数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentStats = async () => {
    try {
      const response = await calendarService.getRecentTaskStats(7);
      setRecentStats(response.data);
    } catch (error) {
      console.error('获取近期任务统计失败:', error);
    }
  };

  const handleMakeUpCheckIn = async () => {
    if (!selectedDate) {
      alert('请先点击选择需要补打卡的日期（黄点日期）');
      return;
    }

    if (remainingMakeUps <= 0) {
      alert('本月补打卡次数已用完（2次/月）');
      return;
    }
    
    try {
      await calendarService.createMakeUpCheckIn(selectedDate);
      alert(`补打卡成功！日期：${selectedDate}`);
      setSelectedDate(null);
      await fetchCalendarData();
      await fetchRecentStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '补打卡失败';
      alert(errorMessage);
    }
  };

  const handleDateClick = (dateStr: string, hasCheckIn: boolean, isBeforeToday: boolean) => {
    if (!isBeforeToday) {
      return;
    }
    
    if (hasCheckIn) {
      return;
    }
    
    setSelectedDate(dateStr);
  };

  const getCheckInStatus = (dateStr: string): boolean => {
    const checkIn = checkIns.find(c => c.date === dateStr);
    return checkIn ? checkIn.hasCheckIn : false;
  };
  
  // Get month name in Chinese
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                     '七月', '八月', '九月', '十月', '十一月', '十二月'];
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Week day headers
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Generate calendar days
  const calendarDays = [];
  
  // Previous month days
  const prevMonth = new Date(currentYear, currentMonth, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getDate() === day && 
                   today.getMonth() === currentMonth && 
                   today.getFullYear() === currentYear;
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isToday
    });
  }
  
  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div 
      className="h-full bg-[#FAFAFA] overflow-y-auto calendar-scroll-container"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        padding: "12px"
      }}
    >
      <style>{`
        .calendar-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Calendar Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
        <button onClick={() => navigateMonth('prev')} className="unified-button-icon bg-transparent border-none" style={{ padding: "8px" }}>
          <ChevronLeft className="w-5 h-5 text-[#3a3f47]" />
        </button>
        <h2 className="text-[16px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button onClick={() => navigateMonth('next')} className="unified-button-icon bg-transparent border-none" style={{ padding: "8px" }}>
          <ChevronRight className="w-5 h-5 text-[#3a3f47]" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1" style={{ marginBottom: "12px" }}>
        {weekDays.map(day => (
          <div key={day} className="text-center" style={{ padding: "8px" }}>
            <span className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1" style={{ marginBottom: "12px" }}>
        {calendarDays.map((dayInfo, index) => {
          const dateStr = dayInfo.isCurrentMonth 
            ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayInfo.day).padStart(2, '0')}`
            : '';
          const hasCheckIn = dateStr ? getCheckInStatus(dateStr) : false;
          
          const currentDateObj = new Date(currentYear, currentMonth, dayInfo.day);
          const todayDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isBeforeToday = currentDateObj < todayDateObj;
          
          const isSelected = dateStr === selectedDate;
          const canSelect = dayInfo.isCurrentMonth && !dayInfo.isToday && isBeforeToday && !hasCheckIn;
          
          return (
            <div 
              key={index} 
              className={`aspect-square flex items-center justify-center relative ${canSelect ? 'cursor-pointer' : ''}`}
              style={{ padding: "4px" }}
              onClick={() => dayInfo.isCurrentMonth && handleDateClick(dateStr, hasCheckIn, isBeforeToday)}
            >
              <div className="relative">
                <span 
                  className={`text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] ${
                    dayInfo.isCurrentMonth 
                      ? dayInfo.isToday 
                        ? 'text-white bg-[#4CAF50] rounded-full w-8 h-8 flex items-center justify-center' 
                        : isSelected
                        ? 'text-white bg-[#FF9800] rounded-full w-8 h-8 flex items-center justify-center'
                        : 'text-[#3a3f47]'
                      : 'text-[#999]'
                  }`}
                >
                  {dayInfo.day}
                </span>
                {dayInfo.isCurrentMonth && !dayInfo.isToday && isBeforeToday && !isSelected && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    {hasCheckIn ? (
                      <div className="w-3 h-3 bg-[#4CAF50] rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-[#FFC107] rounded-full"></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4" style={{ marginBottom: "12px", padding: "0 12px" }}>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
          <span className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            已打卡
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#FFC107] rounded-full"></div>
          <span className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            待补打卡
          </span>
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="flex justify-center" style={{ marginBottom: "8px", padding: "0 12px" }}>
          <span className="text-[12px] text-[#FF9800] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            已选择日期：{selectedDate}
          </span>
        </div>
      )}

      {/* Check-in Button */}
      <div className="flex justify-center" style={{ marginBottom: "12px", padding: "0 12px" }}>
        <button 
          onClick={handleMakeUpCheckIn}
          disabled={!selectedDate || remainingMakeUps <= 0 || loading}
          className={`unified-button ${selectedDate && remainingMakeUps > 0 ? 'bg-[#4CAF50] hover:bg-[#45a049]' : 'bg-gray-400 cursor-not-allowed'} text-white border-[#4CAF50]`}
          style={{
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif",
            borderRadius: '6px',
            padding: '12px 24px',
            opacity: selectedDate && remainingMakeUps > 0 ? 1 : 0.6
          }}
        >
          {selectedDate ? `为 ${selectedDate} 补打卡` : `补打卡（${remainingMakeUps}次/月）`}
        </button>
      </div>



      {/* Recent Check-ins */}
      <div 
        className="unified-content bg-white"
        style={{
          borderRadius: '10px',
          border: '1px solid #3A3F47',
          padding: '12px',
          boxShadow: 'none'
        }}
      >
        <h3 
          className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] border-b border-[#eee]"
          style={{ 
            marginBottom: "12px",
            paddingBottom: "8px"
          }}
        >
          近期任务纪录
        </h3>
        <div className="space-y-3">
          {recentStats.length > 0 ? (
            recentStats.map((record, index) => (
              <div key={index} className="flex items-start gap-3" style={{ padding: "4px 0" }}>
                <div className="flex-shrink-0" style={{ minWidth: "60px" }}>
                  <div className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    {record.date}
                  </div>
                  <div className="text-[10px] text-[#999] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    {record.time}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    完成了{record.totalTasks}件任务，其中勤政工作{record.勤政Tasks}件，恕己工作{record.恕己Tasks}件，爱人任务{record.爱人Tasks}件
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-[#999] text-center font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
              暂无任务记录
            </p>
          )}
        </div>
      </div>
    </div>
  );
}