import React from 'react';
import imgDelete from "figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png";
import img20004721 from "figma:asset/b97483069f151bb18d9e3e16d09bdec9a832ba18.png"; // 爱人卡图标

interface RewardCard {
  id: string;
  title: string;
  content: string;
  obtainedAt: Date;
  triggerTime: number;
  isViewed?: boolean; // 是否已查看，用于排序
}

interface RewardCardProps {
  rewardCard: RewardCard;
  onDelete?: (cardId: string) => void;
  onRewardClick?: (rewardCard: RewardCard) => void;
}

export function RewardCard({ rewardCard, onDelete, onRewardClick }: RewardCardProps) {
  // 格式化获得时间 - 按照任务卡的日期格式
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // 转换为任务卡相同的时间格式
    const period = hours < 12 ? '上午' : (hours < 18 ? '下午' : '晚上');
    let displayHour = hours;
    if (hours > 12) displayHour = hours - 12;
    if (displayHour === 0) displayHour = 12;
    
    return `${month}月${day}日，${period}${displayHour}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(rewardCard.id);
    }
  };

  const handleRewardClick = () => {
    if (onRewardClick) {
      onRewardClick(rewardCard);
    }
  };

  return (
    <div className="relative size-full">
      {/* Main Card Container - 完全匹配TaskCard布局 */}
      <div 
        className={`box-border content-stretch flex flex-row gap-4 items-center justify-start pl-[68px] pr-4 py-4 rounded-2xl relative cursor-pointer hover:opacity-90 transition-all duration-300 ${rewardCard.isViewed ? 'opacity-75' : ''}`}
        style={{ 
          backgroundColor: '#FBD5F2',
          transform: rewardCard.isViewed ? 'scale(0.98)' : 'scale(1)'
        }}
        onClick={handleRewardClick}
      >
        <div
          aria-hidden="true"
          className="absolute border-2 border-[#000000] border-solid inset-0 pointer-events-none rounded-2xl"
        />
        
        {/* Task Type Icon - 使用爱人卡图标，放在左边距中 */}
        <div
          className="absolute bg-center bg-cover bg-no-repeat h-[48px] left-[12px] top-1/2 transform -translate-y-1/2 w-[42px]"
          data-name="Reward Type Icon"
          style={{ backgroundImage: `url('${img20004721}')` }}
        />
        
        {/* Checkbox - 根据查看状态显示不同样式 */}
        <div
          className="box-border content-stretch flex flex-row items-center justify-center p-[2px] relative rounded-lg shrink-0 size-6"
          data-name="Border"
        >
          <div
            aria-hidden="true"
            className="absolute border-2 border-solid inset-0 pointer-events-none rounded-lg"
            style={{ 
              borderColor: rewardCard.isViewed ? '#ef4444' : '#3A3F47',
              backgroundColor: '#ffffff'
            }}
          />
          {/* 只有已查看的奖励卡才显示勾选标记 */}
          {rewardCard.isViewed && (
            <div className="relative shrink-0 size-4" data-name="SVG">
              <svg 
                className="block size-full text-red-500" 
                fill="currentColor" 
                preserveAspectRatio="none" 
                viewBox="0 0 16 16"
              >
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Main Content Area - 匹配TaskCard的Frame71349475 */}
        <div className="flex flex-col w-[249px] relative">
          
          {/* Top Row - Title and Delete Button */}
          <div className="flex items-start justify-between mb-1">
            {/* Reward Title */}
            <div
              className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[14px] text-left flex-1 mr-2"
              style={{ 
                fontVariationSettings: "'wght' 400",
                color: '#3a3f47'
              }}
            >
              <p className="block leading-[normal]">{rewardCard.title}</p>
            </div>
            
            {/* Right side buttons container */}
            <div className="flex items-start gap-2 flex-shrink-0">
              {/* Delete Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="hover:scale-110 transition-transform flex-shrink-0"
              >
                <div
                  className="bg-center bg-contain bg-no-repeat h-5 shrink-0 w-[18px]"
                  data-name="Delete"
                  style={{ backgroundImage: `url('${imgDelete}')` }}
                />
              </button>
            </div>
          </div>
          
          {/* Bottom Row - Date Time (no priority tag, no edit button) */}
          <div className="flex items-center justify-between">
            {/* Left side - Date Time */}
            <div className="flex items-center gap-[7px]">
              {/* Date Time Container */}
              <div
                className="box-border content-stretch flex flex-row items-end justify-start pb-[1.5px] pt-0 px-0 relative shrink-0"
                data-name="Container"
              >
                {/* Time Text */}
                <div 
                  className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-left"
                  style={{ color: '#3a3f47' }}
                >
                  <p className="block leading-[normal] whitespace-pre-wrap">{formatDate(rewardCard.obtainedAt)} 专注奖励</p>
                </div>
              </div>
            </div>
            
            {/* Right side - 空白 (无编辑按钮) */}
          </div>
        </div>
      </div>
    </div>
  );
}