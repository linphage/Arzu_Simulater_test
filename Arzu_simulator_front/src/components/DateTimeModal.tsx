import React, { useState } from 'react';
import { X, Check, Clock, Bell, RefreshCw, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface DateTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateTime: { date: string; startTime: string; endTime: string; reminder: string; repeat: string; selectedWeekdays: number[] }) => void;
}

export function DateTimeModal({ isOpen, onClose, onConfirm }: DateTimeModalProps) {
  // 初始化为今天的日期
  const initializeDefaultDate = () => {
    const today = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const formattedDate = `${months[today.getMonth()]}${today.getDate()}日，${weekdays[today.getDay()]}`;
    return { formattedDate, daysText: '今天' };
  };

  const { formattedDate, daysText } = initializeDefaultDate();
  
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [daysFromNow, setDaysFromNow] = useState(daysText);
  const [selectedTime, setSelectedTime] = useState('20:00'); // 设置默认时间为晚上8点
  const [reminder, setReminder] = useState('无');
  const [repeat, setRepeat] = useState('无');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const reminderOptions = [
    { label: '无', value: '无' },
    { label: '前5分钟', value: '前5分钟' },
    { label: '前10分钟', value: '前10分钟' },
    { label: '前30分钟', value: '前30分钟' }
  ];

  const weekdays = [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 0 }
  ];

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleQuickDateSelect = (days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const formattedDate = `${months[targetDate.getMonth()]}${targetDate.getDate()}日，${weekdays[targetDate.getDay()]}`;
    
    let daysText = '';
    if (days === 0) daysText = '今天';
    else if (days === 1) daysText = '明天';
    else if (days === 2) daysText = '后天';
    else daysText = `${days}天后`;
    
    setSelectedDate(formattedDate);
    setDaysFromNow(daysText);
  };

  const handleCalendarDateSelect = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const formattedDate = `${months[date.getMonth()]}${date.getDate()}日，${weekdays[date.getDay()]}`;
    
    let daysText = '';
    if (diffDays === 0) daysText = '今天';
    else if (diffDays === 1) daysText = '明天';
    else if (diffDays === 2) daysText = '后天';
    else if (diffDays > 0) daysText = `${diffDays}天后`;
    else daysText = `${Math.abs(diffDays)}天前`;
    
    setSelectedDate(formattedDate);
    setDaysFromNow(daysText);
    setShowCalendar(false);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // Adjust to show full weeks
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleReminderSelect = (value: string) => {
    setReminder(value);
    setShowReminderOptions(false);
  };

  const handleWeekdayToggle = (weekdayValue: number) => {
    setSelectedWeekdays(prev => {
      if (prev.includes(weekdayValue)) {
        return prev.filter(day => day !== weekdayValue);
      } else {
        return [...prev, weekdayValue].sort();
      }
    });
  };

  const handleRepeatConfirm = () => {
    if (selectedWeekdays.length === 0) {
      setRepeat('无');
    } else if (selectedWeekdays.length === 7) {
      setRepeat('每天');
    } else {
      const weekdayLabels = weekdays
        .filter(day => selectedWeekdays.includes(day.value))
        .map(day => day.label)
        .join('、');
      setRepeat(`每周${weekdayLabels}`);
    }
    setShowRepeatOptions(false);
  };

  const handleConfirm = () => {
    console.log('🔍 handleConfirm 开始执行');
    console.log('📅 选中的日期:', selectedDate);
    console.log('⏰ 选中的时间:', selectedTime);
    
    const displayTime = selectedTime.includes(':') ? 
      (parseInt(selectedTime.split(':')[0]) >= 12 ? `下午${selectedTime}` : `上午${selectedTime}`) : selectedTime;
    
    const confirmData = {
      date: selectedDate,
      startTime: displayTime,
      endTime: '',
      reminder,
      repeat,
      selectedWeekdays
    };
    
    console.log('📤 确认数据:', confirmData);
    
    onConfirm(confirmData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center max-w-md mx-auto p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#3a3f47] bg-opacity-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-h-[85vh] bg-white rounded-[28px] shadow-lg transform transition-transform duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Black border */}
        <div
          aria-hidden="true"
          className="absolute border-[3px] border-[#3a3f47] border-solid inset-0 pointer-events-none rounded-[28px]"
        />
        
        {/* Header - 确保有足够的顶部间距 */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4" style={{ paddingTop: 'max(32px, env(safe-area-inset-top, 32px))' }}>
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 text-[#3a3f47] hover:bg-[#f0f0f0] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[18px] text-[#3a3f47]"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            日期时间
          </h2>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔍 确认按钮被点击');
              handleConfirm();
            }}
            className="flex items-center justify-center w-10 h-10 text-[#6092e2] hover:bg-[#f0f0f0] rounded-lg transition-colors relative z-10"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              cursor: 'pointer'
            }}
          >
            <Check className="w-6 h-6 pointer-events-none" />
          </button>
        </div>

        {/* Content Area - 优化滚动区域和最大高度 */}
        <div className="px-6 pb-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Date Section Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                日期
              </h3>
              <h3 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                时间
              </h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[20px] text-[#3a3f47]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  {selectedDate}
                </p>
                <p 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#91a67c] mt-1"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  {daysFromNow}
                </p>
              </div>
              
              <div className="flex-1 text-right">
                <p 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[20px] text-[#3a3f47]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  {selectedTime.includes(':') ? 
                    (parseInt(selectedTime.split(':')[0]) >= 12 ? `下午${selectedTime}` : `上午${selectedTime}`) 
                    : selectedTime}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Selection Buttons */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#91a67c]" />
              <span 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#91a67c]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                快捷选择
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleQuickDateSelect(0)}
                className="px-4 py-2 bg-[#ddf0ff] hover:bg-[#6092e2] hover:text-white border-2 border-[#3a3f47] rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                今天
              </button>
              <button 
                onClick={() => handleQuickDateSelect(1)}
                className="px-4 py-2 bg-[#ddf0ff] hover:bg-[#6092e2] hover:text-white border-2 border-[#3a3f47] rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                明天
              </button>
              <button 
                onClick={() => handleQuickDateSelect(2)}
                className="px-4 py-2 bg-[#ddf0ff] hover:bg-[#6092e2] hover:text-white border-2 border-[#3a3f47] rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                后天
              </button>
            </div>
          </div>

          {/* Calendar Toggle */}
          <div className="space-y-3">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <span 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                选择其他日期
              </span>
              <Calendar className="w-4 h-4 text-[#91a67c]" />
            </button>

            {/* Calendar Picker */}
            {showCalendar && (
              <div className="bg-white border-2 border-[#3a3f47] rounded-lg p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#3a3f47]" />
                  </button>
                  <span 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                  </span>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4 text-[#3a3f47]" />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                    <div 
                      key={day}
                      className="text-center py-2 font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#91a67c]"
                      style={{ fontVariationSettings: "'wght' 400" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleCalendarDateSelect(day)}
                        className={`
                          p-2 text-center rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px]
                          ${isCurrentMonth 
                            ? isToday 
                              ? 'bg-[#6092e2] text-white' 
                              : 'text-[#3a3f47] hover:bg-[#ddf0ff]'
                            : 'text-[#91a67c] hover:bg-gray-100'
                          }
                        `}
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Time Settings */}
          <div className="space-y-4 py-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-[#91a67c]" />
              <span 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                时间设置
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <label 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#91a67c]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                时间
              </label>
              <input 
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47] relative z-10"
                style={{ fontVariationSettings: "'wght' 400" }}
              />
            </div>
          </div>

          {/* Reminder Section */}
          <div className="space-y-3 py-4 border-t border-gray-100">
            <button 
              onClick={() => setShowReminderOptions(!showReminderOptions)}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-[#91a67c]" />
                <span 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  提醒
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#91a67c]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  {reminder}
                </span>
                {showReminderOptions ? (
                  <ChevronUp className="w-4 h-4 text-[#91a67c]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#91a67c]" />
                )}
              </div>
            </button>

            {/* Reminder Options */}
            {showReminderOptions && (
              <div className="bg-white border-2 border-[#3a3f47] rounded-lg p-3 space-y-2">
                {reminderOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleReminderSelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] ${
                      reminder === option.value
                        ? 'bg-[#6092e2] text-white'
                        : 'text-[#3a3f47] hover:bg-[#ddf0ff]'
                    }`}
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Repeat Section */}
          <div className="space-y-3 py-4 border-t border-gray-100">
            <button 
              onClick={() => setShowRepeatOptions(!showRepeatOptions)}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-[#91a67c]" />
                <span 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  重复
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#91a67c]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  {repeat}
                </span>
                {showRepeatOptions ? (
                  <ChevronUp className="w-4 h-4 text-[#91a67c]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#91a67c]" />
                )}
              </div>
            </button>

            {/* Repeat Options */}
            {showRepeatOptions && (
              <div className="bg-white border-2 border-[#3a3f47] rounded-lg p-4 space-y-4">
                <div>
                  <h4 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47] mb-3"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    选择重复日期
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {weekdays.map((weekday) => (
                      <button
                        key={weekday.value}
                        onClick={() => handleWeekdayToggle(weekday.value)}
                        className={`px-3 py-2 rounded-lg border-2 border-[#3a3f47] transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] ${
                          selectedWeekdays.includes(weekday.value)
                            ? 'bg-[#6092e2] text-white'
                            : 'bg-[#ddf0ff] text-[#3a3f47] hover:bg-[#6092e2] hover:text-white'
                        }`}
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {weekday.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSelectedWeekdays([])}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#3a3f47]"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    清除
                  </button>
                  <button
                    onClick={handleRepeatConfirm}
                    className="px-4 py-2 bg-[#6092e2] hover:bg-[#4a7bc8] text-white rounded-lg transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px]"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    确认
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Safe Area - 适配安全区域 */}
        <div className="bg-white rounded-b-[28px]" style={{ height: 'max(32px, env(safe-area-inset-bottom, 32px))' }} />
      </div>
    </div>
  );
}