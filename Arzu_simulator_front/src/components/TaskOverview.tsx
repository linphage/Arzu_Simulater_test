import React from 'react';
import img20004721 from "figma:asset/b97483069f151bb18d9e3e16d09bdec9a832ba18.png";
import img20002101 from "figma:asset/a6c466edcfc15b1b3db48bdf6993661a98e84ddd.png";
import img20003731 from "figma:asset/77dfb21b6ae5b3e017b8309d5b6bc1907545c62e.png";

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

function Frame16({ taskCount }: { taskCount: number }) {
  return (
    <div className="absolute bg-[#DFEDF8] border-2 border-[#3A3F47] box-border content-stretch flex flex-row items-center justify-start leading-[0] left-0 pl-10 pr-4 py-0 rounded-lg text-left top-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] h-[35px] justify-center mr-[-10px] relative shrink-0 text-[#3a3f47] text-[14px] w-[74px]"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal]">勤政剩余</p>
      </div>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal h-[15px] justify-center mr-[-10px] not-italic relative shrink-0 text-[#91a67c] text-[16px] w-[22px]">
        <p className="block leading-[normal]">{taskCount}</p>
      </div>
    </div>
  );
}

function Component13({ taskCount }: { taskCount: number }) {
  return (
    <div className="h-[51px] relative shrink-0 w-full" data-name="勤政剩余计数">
      <Frame16 taskCount={taskCount} />
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[51px] left-[11px] top-[-10px] w-[23px]"
        data-name="2000210 1"
        style={{ backgroundImage: `url('${img20002101}')` }}
      />
    </div>
  );
}

function Frame40({ taskCount }: { taskCount: number }) {
  return (
    <div className="absolute bg-[#DFEDF8] border-2 border-[#3A3F47] box-border content-stretch flex flex-row items-center justify-start leading-[0] left-0 pl-10 pr-4 py-0 rounded-lg text-left top-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] h-[35px] justify-center mr-[-10px] relative shrink-0 text-[#3a3f47] text-[14px] w-[74px]"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal]">恕己剩余</p>
      </div>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal h-[15px] justify-center mr-[-10px] not-italic relative shrink-0 text-[#91a67c] text-[16px] w-[22px]">
        <p className="block leading-[normal]">{taskCount}</p>
      </div>
    </div>
  );
}

function Component14({ taskCount }: { taskCount: number }) {
  return (
    <div className="h-[51px] relative shrink-0 w-full" data-name="恕己剩余计数">
      <Frame40 taskCount={taskCount} />
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[55px] left-1.5 top-[-11px] w-[25px]"
        data-name="2000373 1"
        style={{ backgroundImage: `url('${img20003731}')` }}
      />
    </div>
  );
}

function Frame41({ taskCount }: { taskCount: number }) {
  return (
    <div className="absolute bg-[#DFEDF8] border-2 border-[#3A3F47] box-border content-stretch flex flex-row items-center justify-start leading-[0] left-0 pl-10 pr-4 py-0 rounded-lg text-left top-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] h-[35px] justify-center mr-[-10px] relative shrink-0 text-[#3a3f47] text-[14px] w-[74px]"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal]">爱人剩余</p>
      </div>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal h-[15px] justify-center mr-[-10px] not-italic relative shrink-0 text-[#91a67c] text-[16px] w-[22px]">
        <p className="block leading-[normal]">{taskCount}</p>
      </div>
    </div>
  );
}

function Component15({ taskCount }: { taskCount: number }) {
  return (
    <div className="h-[51px] relative shrink-0 w-full" data-name="爱人剩余计数">
      <Frame41 taskCount={taskCount} />
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[55px] left-[5px] top-[-13px] w-[25px]"
        data-name="2000472 1"
        style={{ backgroundImage: `url('${img20004721}')` }}
      />
    </div>
  );
}

export function TaskCounts({ tasks, isVisible }: { tasks: TaskData[]; isVisible: boolean }) {
  // 只计算未完成的任务
  const uncompletedTasks = tasks.filter(task => !task.isCompleted);
  const qinzhengCount = uncompletedTasks.filter(task => task.taskType === '勤政').length;
  const shujiCount = uncompletedTasks.filter(task => task.taskType === '恕己').length;
  const airenCount = uncompletedTasks.filter(task => task.taskType === '爱人').length;

  if (!isVisible) return null;

  return (
    <div
      className="box-border content-stretch flex flex-col h-[145px] items-start justify-between p-0 w-full"
      data-name="任务剩余计数区"
    >
      <Component13 taskCount={qinzhengCount} />
      <Component14 taskCount={shujiCount} />
      <Component15 taskCount={airenCount} />
    </div>
  );
}

function Frame8({ taskCount }: { taskCount: number }) {
  return (
    <div className="box-border content-stretch flex flex-row gap-2 items-end justify-start leading-[0] p-0 relative shrink-0 text-[#3a3f47] text-left w-full">
      <div className="flex flex-col font-['ABeeZee:Regular',_sans-serif] justify-center not-italic relative shrink-0 text-[64px] min-w-[50px]">
        <p className="block leading-[normal]">{taskCount}</p>
      </div>
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] h-11 justify-center relative shrink-0 text-[14px] flex-1 min-w-0"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] break-words whitespace-nowrap overflow-hidden text-ellipsis">项任务！</p>
      </div>
    </div>
  );
}

function Frame9({ taskCount }: { taskCount: number }) {
  // Get current date info
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const currentWeekday = weekdays[currentDate.getDay()];

  return (
    <div className="box-border content-stretch flex flex-col items-start justify-between p-0 relative w-full h-full">
      {/* 日期区域 - 固定在顶部 */}
      <div className="flex flex-col gap-1 w-full">
        <div
          className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-start leading-[0] relative shrink-0 text-[#3a3f47] text-[14px] text-left w-full"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          <p className="block leading-[normal] whitespace-nowrap overflow-hidden text-ellipsis">{`${currentMonth}月${currentDay}日  ${currentWeekday}`}</p>
        </div>
        <div
          className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-start leading-[normal] relative shrink-0 text-[#3a3f47] text-[14px] text-left w-full"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          <p className="block leading-[1.4] break-words hyphens-auto" style={{ wordBreak: 'break-all' }}>哦议长，距离找贤王摸鱼还有：</p>
        </div>
      </div>
      
      {/* 任务计数区域 - 固定在底部 */}
      <div className="w-full">
        <Frame8 taskCount={taskCount} />
      </div>
    </div>
  );
}

export function TaskReminder({ tasks, isVisible }: { tasks: TaskData[]; isVisible: boolean }) {
  if (!isVisible) return null;

  // 只计算未完成的任务
  const uncompletedTaskCount = tasks.filter(task => !task.isCompleted).length;
  
  return (
    <div
      className="[flex-flow:wrap] bg-[#ddf0ff] box-border content-end flex gap-[22px] h-[145px] items-end justify-start pb-2 px-3 rounded-lg w-full relative"
      data-name="任务总量提醒"
      style={{
        paddingTop: '6px' // 确保日期文字距离顶部6px
      }}
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#3a3f47] border-solid inset-0 pointer-events-none rounded-lg"
      />
      <Frame9 taskCount={uncompletedTaskCount} />
    </div>
  );
}