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
}

// Weekly view equivalent components
function WeeklyFrame8({ percentage }: { percentage: number }) {
  return (
    <div className="box-border content-stretch flex flex-row items-end justify-start leading-[0] p-0 relative shrink-0 text-[#3a3f47] text-left w-full min-w-0">
      <div className="flex flex-col font-['ABeeZee:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[48px] sm:text-[56px] md:text-[64px]">
        <p className="block leading-[normal] tabular-nums">{percentage}</p>
      </div>
      <div className="flex flex-col font-['ABeeZee:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[24px] sm:text-[28px] md:text-[32px] mb-1">
        <p className="block leading-[normal]">%</p>
      </div>
    </div>
  );
}

function WeeklyFrame9({ percentage }: { percentage: number }) {
  // Get current date info
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const currentWeekday = weekdays[currentDate.getDay()];

  return (
    <div className="box-border content-stretch flex flex-col items-start justify-between p-0 relative w-full h-full min-w-0">
      {/* 日期和描述区域 - 固定在顶部 */}
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div
          className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-start leading-[0] relative shrink-0 text-[#3a3f47] text-[12px] md:text-[14px] text-left w-full min-w-0"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          <p className="block leading-[normal] whitespace-nowrap overflow-hidden text-ellipsis">{`${currentMonth}月${currentDay}日  ${currentWeekday}`}</p>
        </div>
        <div
          className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-start leading-[normal] relative shrink-0 text-[#3a3f47] text-[12px] md:text-[14px] text-left w-full min-w-0"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          <p className="block leading-[1.2] md:leading-[1.4] break-words hyphens-auto" style={{ wordBreak: 'break-all' }}>议长本周任务完成率：</p>
        </div>
      </div>
      
      {/* 百分比显示区域 - 固定在底部 */}
      <div className="w-full min-w-0">
        <WeeklyFrame8 percentage={percentage} />
      </div>
    </div>
  );
}

export function WeeklyTaskReminder({ tasks, isVisible }: { tasks: TaskData[]; isVisible: boolean }) {
  if (!isVisible) return null;

  // Calculate completion percentage
  const tasksWithCompletion = tasks.map(task => ({
    ...task,
    completed: Math.random() > 0.4 // Mock completion status
  }));
  
  const completedTasks = tasksWithCompletion.filter(task => task.completed);
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div
      className="[flex-flow:wrap] bg-[#ddf0ff] box-border content-end flex gap-[22px] items-end justify-start pb-2 px-3 rounded-lg w-full relative h-full"
      style={{
        paddingTop: '6px' // 与日视图保持一致的顶部间距
      }}
      data-name="周视图完成率提醒"
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#3a3f47] border-solid inset-0 pointer-events-none rounded-lg"
      />
      <WeeklyFrame9 percentage={completionPercentage} />
    </div>
  );
}

// Weekly weekend countdown component
function WeeklyCompletionFrame({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative shrink-0 w-full min-w-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#3a3f47] text-[11px] sm:text-[12px] md:text-[14px] text-left w-full min-w-0"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] whitespace-nowrap overflow-hidden text-ellipsis">距离休沐还有</p>
      </div>
      <div className="box-border content-stretch flex flex-row gap-1 sm:gap-2 items-end justify-start leading-[0] p-0 relative shrink-0 text-[#3a3f47] text-left w-full min-w-0">
        <div className="flex flex-col font-['ABeeZee:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[24px] sm:text-[28px] md:text-[32px]">
          <p className="block leading-[normal] tabular-nums">{daysLeft}</p>
        </div>
        <div
          className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center relative shrink-0 text-[11px] sm:text-[12px] md:text-[14px] mb-1"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          <p className="block leading-[normal]">天</p>
        </div>
      </div>
    </div>
  );
}

export function WeeklyRestCountdown({ tasks, isVisible }: { tasks: TaskData[]; isVisible: boolean }) {
  if (!isVisible) return null;

  // Calculate days until weekend (Saturday or Sunday)
  const currentDate = new Date();
  const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let daysUntilWeekend;
  if (currentDay === 0) { // Sunday
    daysUntilWeekend = 6; // Next Saturday
  } else if (currentDay === 6) { // Saturday
    daysUntilWeekend = 1; // Tomorrow (Sunday)
  } else {
    daysUntilWeekend = 6 - currentDay; // Days until Saturday
  }

  return (
    <div
      className="[flex-flow:wrap] bg-[#dff7dc] box-border content-end flex gap-[12px] items-end justify-start pb-2 px-3 rounded-lg w-full relative"
      style={{
        paddingTop: '6px', // 统一顶部间距
        height: '70px' // 调整小组件的高度
      }}
      data-name="周视图休沐倒计时"
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#3a3f47] border-solid inset-0 pointer-events-none rounded-lg"
      />
      <WeeklyCompletionFrame daysLeft={daysUntilWeekend} />
    </div>
  );
}

// Weekly overdue rate component
function WeeklyOverdueFrame({ percentage }: { percentage: number }) {
  return (
    <div className="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative shrink-0 w-full min-w-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#3a3f47] text-[11px] sm:text-[12px] md:text-[14px] text-left w-full min-w-0"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] whitespace-nowrap overflow-hidden text-ellipsis">本周逾期率</p>
      </div>
      <div className="box-border content-stretch flex flex-row gap-1 sm:gap-2 items-end justify-start leading-[0] p-0 relative shrink-0 text-[#3a3f47] text-left w-full min-w-0">
        <div className="flex flex-col font-['ABeeZee:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[24px] sm:text-[28px] md:text-[32px]">
          <p className="block leading-[normal] tabular-nums">{percentage}</p>
        </div>
        <div
          className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center relative shrink-0 text-[11px] sm:text-[12px] md:text-[14px] mb-1"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          <p className="block leading-[normal]">%</p>
        </div>
      </div>
    </div>
  );
}

export function WeeklyOverdueRate({ tasks, isVisible }: { tasks: TaskData[]; isVisible: boolean }) {
  if (!isVisible) return null;

  // Calculate overdue percentage
  const currentDate = new Date();
  const tasksWithOverdue = tasks.filter(task => {
    if (!task.dateTime?.date) return false;
    const taskDate = new Date(task.dateTime.date);
    return taskDate < currentDate; // Task is overdue if date has passed
  });
  
  const overduePercentage = tasks.length > 0 ? Math.round((tasksWithOverdue.length / tasks.length) * 100) : 0;

  return (
    <div
      className="[flex-flow:wrap] bg-[#fef2f2] box-border content-end flex gap-[12px] items-end justify-start pb-2 px-3 rounded-lg w-full relative"
      style={{
        paddingTop: '6px', // 统一顶部间距
        height: '70px' // 调整小组件的高度
      }}
      data-name="周视图逾期率"
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#3a3f47] border-solid inset-0 pointer-events-none rounded-lg"
      />
      <WeeklyOverdueFrame percentage={overduePercentage} />
    </div>
  );
}