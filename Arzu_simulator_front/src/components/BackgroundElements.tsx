import React from 'react';
import imgRectangle3 from "figma:asset/43b5eee8b9ef3c1f2cc90442f5116678db2da58f.png";
import img20011691 from "figma:asset/6e511b6a9335ffcbd635916ed741841241f7001e.png";
import img200086121 from "figma:asset/b69b0f9f6604e8cbc961d3915695b4fd7203c7c8.png";

function MaskGroup() {
  return (
    <div className="absolute contents left-[-16px] top-[-103.94px]" data-name="Mask group">
      <div
        className="absolute bg-[#DAE8F1] h-[220.924px] left-[75.2px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-91.2px_-110.793px] mask-size-[157.241px_341.938px] top-[6.86px] w-[53.462px]"
        style={{ maskImage: `url('${imgRectangle3}')` }}
      />
    </div>
  );
}

function ProgressBarComponent() {
  return (
    <div className="absolute h-[274px] left-[223px] top-[26px] w-[126px]" data-name="亘誓戒进度条">
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[342px] left-[-15px] top-[-104px] w-[156px]"
        data-name="2001169 1"
        style={{ backgroundImage: `url('${img20011691}')` }}
      />
      <MaskGroup />
    </div>
  );
}

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

interface BackgroundElementsProps {
  tasks?: Task[];
  completedTasks?: CompletedTask[];
}

export function BackgroundElements({ tasks = [], completedTasks = [] }: BackgroundElementsProps) {
  // 计算今日任务完成率
  const calculateTodayCompletionRate = (): number => {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取今日已完成的任务
    const todayCompletedTasks = completedTasks.filter(task => 
      task.completedAt.toISOString().split('T')[0] === today
    );
    
    // 获取所有未完成的任务（不管是今天创建的还是之前的）
    const pendingTasks = tasks.filter(task => !task.isCompleted);
    
    // 去重：从pendingTasks中排除已经在completedTasks中的任务
    const completedTaskIds = new Set(todayCompletedTasks.map(t => t.id));
    const uniquePendingTasks = pendingTasks.filter(t => !completedTaskIds.has(t.id));
    
    // 总任务数 = 未完成任务数 + 今日已完成任务数
    const totalTodayTasks = uniquePendingTasks.length + todayCompletedTasks.length;
    
    console.log('🔍 [戒指进度] 所有未完成任务数:', pendingTasks.length);
    console.log('🔍 [戒指进度] 去重后未完成任务数:', uniquePendingTasks.length);
    console.log('🔍 [戒指进度] 今日已完成任务数:', todayCompletedTasks.length);
    console.log('🔍 [戒指进度] 总任务数:', totalTodayTasks);
    
    if (totalTodayTasks === 0) {
      console.log('🔍 [戒指进度] 完成率: 0 (无任务)');
      return 0;
    }
    
    const rate = todayCompletedTasks.length / totalTodayTasks;
    console.log('🔍 [戒指进度] 完成率:', rate, `(${todayCompletedTasks.length}/${totalTodayTasks})`);
    return rate;
  };
  
  const completionRate = calculateTodayCompletionRate();
  return (
    <>
      {/* Green frame area - responsive positioning */}
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[408px] w-[187px]"
        data-name="2000861_2 1"
        style={{ 
          backgroundImage: `url('${img200086121}')`,
          left: 'max(5px, calc((100vw - 412px) / 2 + 5px))', // 响应式左边距
          top: '7px'
        }}
      />
      
      {/* Progress bar - responsive positioning */}
      <div className="absolute h-[274px] w-[126px] top-[26px]" data-name="亘誓戒进度条"
        style={{
          left: 'max(223px, calc((100vw - 412px) / 2 + 223px))' // 响应式左边距
        }}
      >
        <div className="relative">
          {/* 底图戒指 */}
          <div
            className="absolute bg-center bg-cover bg-no-repeat h-[342px] top-[-96px] w-[156px]"
            data-name="2001169 1 底图"
            style={{ 
              backgroundImage: `url('${img20011691}')`,
              left: '-15px'
            }}
          />
          
          {/* 纯色遮罩层 - 根据完成率从左向右缩小 */}
          <div
            className="absolute bg-[#DAE8F1] h-[342px] top-[-96px] transition-all duration-1000 ease-out"
            data-name="进度遮罩"
            style={{ 
              left: '-15px',
              width: `${156 * (1 - completionRate)}px`, // 根据完成率调整宽度，完成率越高宽度越小
            }}
          />
        </div>
        <div className="absolute contents left-[-16px] top-[-95.94px]" data-name="Mask group">
          <div
            className="absolute bg-[#DAE8F1] h-[220.924px] left-[75.2px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-91.2px_-102.793px] mask-size-[157.241px_341.938px] top-[14.86px] w-[53.462px]"
            style={{ maskImage: `url('${imgRectangle3}')` }}
          />
        </div>
      </div>
      
      {/* Blue background container - 确保完全填满屏幕宽度 */}
      <div 
        className="absolute bg-[#FDFDFD] bottom-0 rounded-[28px] top-[265px] overflow-hidden"
        style={{
          left: '0',
          right: '0',
          width: '100%',
          minWidth: '100vw'
        }}
      >
        <div
          aria-hidden="true"
          className="absolute border-[#3a3f47] border-[3px] border-solid inset-0 pointer-events-none rounded-2xl"
        />
      </div>
    </>
  );
}