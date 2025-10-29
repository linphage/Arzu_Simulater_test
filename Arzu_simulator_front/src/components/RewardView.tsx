import React from 'react';
import { StatusBar } from './StatusBar';
import imgDelete from "figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png";
import img20004721 from "figma:asset/b97483069f151bb18d9e3e16d09bdec9a832ba18.png";

interface RewardCard {
  id: string;
  title: string;
  content: string;
  obtainedAt: Date;
  triggerTime: number;
}

interface RewardViewProps {
  rewardCard: RewardCard;
  onBack: () => void;
}

export function RewardView({ rewardCard, onBack }: RewardViewProps) {
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    const period = hours < 12 ? '上午' : (hours < 18 ? '下午' : '晚上');
    let displayHour = hours;
    if (hours > 12) displayHour = hours - 12;
    if (displayHour === 0) displayHour = 12;
    
    return `${month}月${day}日，${period}${displayHour}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatContent = (text: string) => {
    return text.split(/\\n\\r\\n|\\r\\n|\\n/).map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // 🔥 TODO: 后端接口集成 - 获取奖励详细内容
  // 未来需要从后端API获取奖励的详细信息，包括：
  // 1. 奖励标题 (rewardCard.title)
  // 2. 奖励详细描述 (rewardCard.content) 
  // 3. 奖励获得时间 (rewardCard.obtainedAt)
  // 4. 触发奖励时的专注时长 (rewardCard.triggerTime)
  // 5. 可能的奖励图片、动画等多媒体内容
  // 
  // API接口示例:
  // GET /api/rewards/{rewardId}
  // Response: {
  //   id: string,
  //   title: string,
  //   content: string,
  //   detailedDescription: string,
  //   obtainedAt: ISO8601,
  //   triggerTime: number,
  //   images?: string[],
  //   animations?: string[]
  // }

  return (
    <div className="bg-[#FBD5F2] relative h-screen w-full max-w-md mx-auto overflow-hidden">
      {/* 状态栏 */}
      <StatusBar />
      
      {/* 顶部导航栏 */}
      <div className="absolute top-11 left-0 right-0 h-16 bg-[#FBD5F2] flex items-center justify-between px-4 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3a3f47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-[18px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] font-medium">
          奖励详情
        </h1>
        <div className="w-10"></div>
      </div>

      {/* 主要内容区域 */}
      <div className="pt-[108px] pb-8 px-6 h-full overflow-y-auto">
        {/* 奖励图标和标题区域 */}
        <div className="text-center mb-8">
          {/* 奖励图标 */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#FFF9FE' }}
            >
              <div
                className="bg-center bg-cover bg-no-repeat w-16 h-16"
                style={{ backgroundImage: `url('${img20004721}')` }}
              />
            </div>
          </div>
          
          {/* 奖励标题 */}
          <h2 
            className="text-[24px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] font-medium mb-2"
          >
            {rewardCard.title}
          </h2>
          
          {/* 获得时间信息 */}
          <p 
            className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#666] opacity-80"
          >
            {formatDate(rewardCard.obtainedAt)} 获得
          </p>
        </div>

        {/* 奖励内容区域 */}
        <div className="bg-[#FFF9FE] rounded-xl p-6 border border-[#3A3F47] mb-6">
          <h3 
            className="text-[16px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] font-medium mb-4 flex items-center"
          >
            <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
            啊呜，一小口奶酪酥
          </h3>
          
          {/* 🔥 TODO: 后端接口 - 奖励详细描述 */}
          {/* 这里的content将来需要从后端API获取更丰富的内容，可能包括：
              1. 多段文字描述
              2. 图片内容  
              3. 动画效果
              4. 音频内容
              5. 个性化奖励信息
          */}
          <div 
            className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] leading-relaxed"
          >
            <p className="mb-4">{formatContent(rewardCard.content)}</p>
            
            {/* 🔥 TODO: 后端接口 - 扩展奖励描述内容 */}
            {/* 将来这里会显示从后端获取的详细奖励描述 */}

          </div>
        </div>

        {/* 🔥 TODO: 后端接口 - 额外奖励信息 */}
        {/* 将来可以添加更多从后端获取的奖励相关信息：
            1. 奖励等级系统
            2. 奖励收集进度
            3. 相关成就展示
            4. 分享功能
            5. 奖励历史记录链接
        */}
        
        {/* 奖励统计信息 */}

      </div>
    </div>
  );
}