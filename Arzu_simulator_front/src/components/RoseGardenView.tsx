import React, { useState, useEffect } from 'react';
import svgPaths from "../assets/svg/rose-garden-icons";
import img from "figma:asset/1dc71bd62c1ce2116211c9f2619109da420fc338.png";
import img200031211 from "figma:asset/6ccd74f326c6127a1242cc03fb5659aa209f5e54.png";
import { FixedBottomNavigation } from './BottomNavigation';
import { CalendarView } from './CalendarView';
import { CompletionView } from './CompletionView';
import { FocusAnalysisView } from './FocusAnalysisView';
import { TaskCreationModal } from './TaskCreationModal';
import axiosInstance from '../utils/axiosInstance';

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

interface TaskStats {
  taskId: string;
  interruptions: number; // 中断次数
  abandonments: number; // 放弃次数
  totalFocusTime: number; // 总专注时间
}

interface RoseGardenViewProps {
  onBack: () => void;
  onParliamentClick: () => void;
  onOfficeClick: () => void;
  onSettingsClick: () => void;
  onAddTaskClick: () => void;
  tasks?: Task[];
  completedTasks?: CompletedTask[];
  taskStats?: TaskStats[];
}

type SubView = 'calendar' | 'completion' | 'focus' | 'relaxation';



function Component7({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <div className="absolute h-[51px] left-0 top-0 w-[52px]" data-name="日历按钮">
      <div 
        className={`unified-button absolute left-0 top-[11px] min-w-fit cursor-pointer touch-friendly ${
          isActive ? 'bg-[#4CAF50] text-white border-[#4CAF50]' : 'bg-[#f7e5a2] text-[#3a3f47] border-[#3A3F47]'
        }`}
        onClick={onClick}
        style={{
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '6px',
          boxShadow: 'none',
          height: '35px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
          }}
        >
          日历
        </span>
      </div>
    </div>
  );
}

function Component8({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <div className="absolute h-[51px] left-[71px] top-0 w-[52px]" data-name="完成度按钮">
      <div 
        className={`unified-button absolute left-0 top-[11px] min-w-fit cursor-pointer touch-friendly ${
          isActive ? 'bg-[#4CAF50] text-white border-[#4CAF50]' : 'bg-[#f7e5a2] text-[#3a3f47] border-[#3A3F47]'
        }`}
        onClick={onClick}
        style={{
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '6px',
          boxShadow: 'none',
          height: '35px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
          }}
        >
          完成度
        </span>
      </div>
    </div>
  );
}

function Component9({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <div className="absolute h-[51px] left-[147px] top-0 w-[52px]" data-name="专注度按钮">
      <div 
        className={`unified-button absolute left-0 top-[11px] min-w-fit cursor-pointer touch-friendly ${
          isActive ? 'bg-[#4CAF50] text-white border-[#4CAF50]' : 'bg-[#f7e5a2] text-[#3a3f47] border-[#3A3F47]'
        }`}
        onClick={onClick}
        style={{
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '6px',
          boxShadow: 'none',
          height: '35px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
          }}
        >
          专注度
        </span>
      </div>
    </div>
  );
}

function Component11({ onClick, isActive, onSpecialClick }: { onClick: () => void; isActive: boolean; onSpecialClick: () => void }) {
  return (
    <div className="absolute h-[51px] left-0 top-[51px] w-[74px]" data-name="一壶水烟按钮">
      <div 
        className={`unified-button absolute left-0 top-[11px] min-w-fit cursor-pointer touch-friendly ${
          isActive ? 'bg-[#4CAF50] text-white border-[#4CAF50]' : 'bg-[#fbd5f2] text-[#3a3f47] border-[#3A3F47]'
        }`}
        onClick={() => {
          onClick();
          onSpecialClick();
        }}
        style={{
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '6px',
          boxShadow: 'none',
          height: '35px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
          }}
        >
          一壶水烟
        </span>
      </div>
    </div>
  );
}

// 红框按钮区域组件 - 现在使用相对定位，便于底部固定
function Component12({ currentView, onViewChange, onRelaxationClick }: { currentView: SubView; onViewChange: (view: SubView) => void; onRelaxationClick: () => void }) {
  return (
    <div className="relative w-[193px] h-[102px]" data-name="按钮区">
      <Component7 onClick={() => onViewChange('calendar')} isActive={currentView === 'calendar'} />
      <Component8 onClick={() => onViewChange('completion')} isActive={currentView === 'completion'} />
      <Component9 onClick={() => onViewChange('focus')} isActive={currentView === 'focus'} />
      <Component11 onClick={() => onViewChange('relaxation')} isActive={currentView === 'relaxation'} onSpecialClick={onRelaxationClick} />
    </div>
  );
}

function Notch() {
  return <div className="absolute h-[30px] left-0 right-0 top-0" data-name="Notch" />;
}

function NetworkSignalLight() {
  return (
    <div className="h-3.5 relative shrink-0 w-5" data-name="Network Signal / Light">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 14">
        <g id="Network Signal /Â Light">
          <path clipRule="evenodd" d={svgPaths.p1f162900} fill="var(--fill-0, #D1D1D6)" fillRule="evenodd" id="Path" />
          <path
            clipRule="evenodd"
            d={svgPaths.p1d5dbe40}
            fill="var(--fill-0, #D1D1D6)"
            fillRule="evenodd"
            id="Path_2"
          />
          <path
            clipRule="evenodd"
            d={svgPaths.p18019e00}
            fill="var(--fill-0, #D1D1D6)"
            fillRule="evenodd"
            id="Path_3"
          />
          <path
            clipRule="evenodd"
            d={svgPaths.p342c3400}
            fill="var(--fill-0, #3C3C43)"
            fillOpacity="0.18"
            fillRule="evenodd"
            id="Empty Bar"
          />
          <path clipRule="evenodd" d={svgPaths.p1f162900} fill="var(--fill-0, black)" fillRule="evenodd" id="Path_4" />
          <path clipRule="evenodd" d={svgPaths.p1d5dbe40} fill="var(--fill-0, black)" fillRule="evenodd" id="Path_5" />
          <path clipRule="evenodd" d={svgPaths.p18019e00} fill="var(--fill-0, black)" fillRule="evenodd" id="Path_6" />
        </g>
      </svg>
    </div>
  );
}

function WiFiSignalLight() {
  return (
    <div className="h-3.5 relative shrink-0 w-4" data-name="WiFi Signal / Light">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 14">
        <g id="WiFi Signal / Light">
          <path d={svgPaths.p3dc48e00} fill="var(--fill-0, black)" id="Path" />
          <path d={svgPaths.p3b3c95f0} fill="var(--fill-0, black)" id="Path_2" />
          <path d={svgPaths.p932c700} fill="var(--fill-0, black)" id="Path_3" />
        </g>
      </svg>
    </div>
  );
}

function BatteryLight() {
  return (
    <div className="h-3.5 relative shrink-0 w-[25px]" data-name="Battery / Light">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 14">
        <g id="Battery / Light">
          <path d={svgPaths.p297bad10} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Rectangle 23" />
          <path
            clipRule="evenodd"
            d={svgPaths.p2587880}
            fill="var(--fill-0, #3C3C43)"
            fillOpacity="0.6"
            fillRule="evenodd"
            id="Rectangle 21 (Stroke)"
          />
          <rect fill="var(--fill-0, black)" height="8" id="Rectangle 20" rx="1" width="19" x="2" y="3" />
        </g>
      </svg>
    </div>
  );
}

function StatusIcons() {
  return (
    <div
      className="absolute box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 right-3.5 top-4"
      data-name="Status Icons"
    >
      <NetworkSignalLight />
      <WiFiSignalLight />
      <BatteryLight />
    </div>
  );
}

function Indicator() {
  return (
    <div className="absolute right-[71px] size-1.5 top-2" data-name="Indicator">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
        <g id="Indicator"></g>
      </svg>
    </div>
  );
}

function Component941() {
  return (
    <div
      className="absolute h-[15px] top-1/2 translate-x-[-50%] translate-y-[-50%] w-[33px]"
      data-name="9:41"
      style={{ left: "calc(50% + 0.5px)" }}
    >
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 15">
        <g id="9:41">
          <g id="9:41_2">
            <path d={svgPaths.p309cf100} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1285b880} fill="var(--fill-0, black)" />
            <path d={svgPaths.pa9bea00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1d3f77f0} fill="var(--fill-0, black)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TimeLight() {
  return (
    <div className="absolute h-[21px] left-[21px] overflow-clip rounded-[20px] top-3 w-[54px]" data-name="Time / Light">
      <Component941 />
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute h-11 left-1 overflow-clip top-0 w-[408px]" data-name="Status Bar">
      <Notch />
      <StatusIcons />
      <Indicator />
      <TimeLight />
    </div>
  );
}



function Frame7420() {
  return (
    <div className="bg-[rgba(55,146,245,0)] box-border content-stretch flex flex-row gap-2.5 items-start justify-start opacity-0 px-3.5 py-[3px] relative rounded shrink-0">
      <div className="capitalize leading-[0] not-italic relative shrink-0 text-[#666666] text-left text-nowrap"
        style={{
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: "'PingFang SC', sans-serif"
        }}
      >
        <p className="block leading-[normal] whitespace-pre">保存</p>
      </div>
    </div>
  );
}

function Frame6326() {
  return (
    <div
      className="absolute box-border content-stretch flex flex-row gap-1.5 items-center justify-center left-1/2 p-0 translate-x-[-50%] translate-y-[-50%]"
      style={{ top: "calc(50% + 0.5px)" }}
    >
      <div
        className="capitalize leading-[0] relative shrink-0 text-[#3c3c3c] text-center text-nowrap"
        style={{ 
          fontVariationSettings: "'wght' 400",
          fontSize: '16px',
          fontWeight: '500',
          fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
        }}
      >
        <p className="block leading-[normal] whitespace-pre">贤者的花圃</p>
      </div>
    </div>
  );
}

function Frame6259({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute box-border content-stretch flex flex-row h-[51px] items-center justify-between left-0 pl-2.5 pr-[15px] py-0 top-11 w-[412px]">
      <Frame7420 />
    </div>
  );
}

export function RoseGardenView({ onBack, onParliamentClick, onOfficeClick, onSettingsClick, onAddTaskClick, tasks = [], completedTasks = [], taskStats = [] }: RoseGardenViewProps) {
  const [currentView, setCurrentView] = useState<SubView>('calendar');
  const [showNepheleModal, setShowNepheleModal] = useState(false);
  const [daysSinceRegistration, setDaysSinceRegistration] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/auth/profile');
      setDaysSinceRegistration(response.data.data.daysSinceRegistration);
    } catch (error) {
      console.error('获取用户资料失败:', error);
      setDaysSinceRegistration(0);
    }
  };

  const handleAddTaskClick = () => {
    onAddTaskClick(); // 只触发App.tsx的模态框打开
  };

  const renderSubView = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarView tasks={tasks} />;
      case 'completion':
        return <CompletionView tasks={tasks} completedTasks={completedTasks} />;
      case 'focus':
        return <FocusAnalysisView tasks={tasks} completedTasks={completedTasks} taskStats={taskStats} />;
      case 'relaxation':
        return (
          <div className="h-full bg-[#FAFAFA] flex items-center justify-center">
            <p 
              className="text-[#3a3f47]"
              style={{
                fontSize: '14px',
                fontWeight: '400',
                fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
              }}
            >
              一壶水烟视图开发中...
            </p>
          </div>
        );
      default:
        return <CalendarView tasks={tasks} />;
    }
  };

  return (
    <div className="mobile-fullscreen mobile-app-container">
      {/* 全屏背景容器 */}
      <div 
        className="absolute inset-0 bg-[#354827] w-full h-full" 
        data-name="全屏背景"
        style={{
          width: '100vw',
          height: '100dvh',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* 主应用容器 */}
      <div 
        className="responsive-container bg-[#354827] relative" 
        data-name="首页" 
        style={{ 
          height: '100dvh',
          minHeight: '100dvh'
        }}
      >
        {/* 浅绿色背景区域 - 从屏幕顶端开始覆盖整个区域，底部28px圆角 */}
        <div className="absolute inset-0 bg-[#FAFAFA] rounded-b-[28px] border-[3px] border-[#3a3f47] border-b-0 z-0" style={{ bottom: '248px' }} />
        
        {/* 头部导航 */}
        <div className="relative z-20">
          <Frame6259 onBack={onBack} />
        </div>

        {/* 主体布局容器 - 使用flex布局 */}
        <div className="flex flex-col h-full relative z-10" style={{ paddingTop: '70px' }}>
          
          {/* 登录天数显示文字 - 确保显示在浅绿色背景之上，与标题保持8px间距 */}
          <div className="flex justify-center px-4 relative z-10" style={{ marginTop: '8px' }}>
            <p 
              className="text-[#3a3f47] text-center"
              style={{
                fontSize: '14px',
                fontWeight: '400',
                fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif",
                lineHeight: '1.5'
              }}
            >
              阿尔图，贤者之国已因你而存在{daysSinceRegistration}天。
            </p>
          </div>
          
          {/* 主内容视图 - 与登录天数文字保持8px间距，内容区域自适应 */}
          <div className="flex-1 relative min-h-0 overflow-hidden z-10" style={{ marginTop: '8px' }}>
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 rounded-[28px] overflow-hidden"
              style={{ 
                top: "0", 
                bottom: "16px", 
                width: "min(380px, calc(100vw - 32px))",
                height: 'calc(100% - 16px)'
              }}
            >
              {renderSubView()}
            </div>
          </div>

          {/* 底部固定区域 - 包含按钮区和装饰元素 */}
          <div className="flex-shrink-0 relative bg-[#354827] z-10" style={{ height: '248px' }}>
            
            {/* 角色装饰图片 - 右侧固定，底部与导航栏顶部相贴 */}
            <div 
              className="absolute z-20"
              style={{ bottom: '60px', right: '-10px' }}
            >
              <div className="flex-none">
                <div
                  className="bg-center bg-contain bg-no-repeat"
                  data-name="角色插图"
                  style={{ 
                    backgroundImage: `url('${img200031211}')`,
                    width: '253.422px',
                    height: '337.896px',
                    transform: 'scale(0.84) translateX(5px)'
                  }}
                />
              </div>
            </div>

            {/* 红框按钮区域 - 左对齐固定在距离底部合适位置，保持28px左边距 */}
            <div className="absolute left-7 bottom-[92px]">
              <Component12 
                currentView={currentView} 
                onViewChange={setCurrentView} 
                onRelaxationClick={() => setShowNepheleModal(true)} 
              />
            </div>

            {/* 底部导航栏区域 */}
            <div className="absolute bottom-0 left-0 right-0">
              <FixedBottomNavigation 
                onAddClick={handleAddTaskClick} 
                onOfficeClick={onOfficeClick} 
                onRoseGardenClick={() => {}} 
                onSettingsClick={onSettingsClick}
                onParliamentClick={onParliamentClick}
              />
            </div>
          </div>
        </div>

        {/* 奈费勒AI弹窗 */}
        {showNepheleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="unified-content bg-white w-full max-w-[280px] relative">
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowNepheleModal(false)}
                className="unified-button-icon absolute right-2 top-2 bg-transparent hover:bg-gray-100 transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#3a3f47" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* 标题 */}
              <div className="flex items-center mb-3 pr-6">
                <div className="w-6 h-6 bg-gradient-to-r from-[#fbd5f2] to-[#e8f5e8] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-[#3a3f47] rounded-full"></div>
                </div>
                <h3 
                  className="text-[#3a3f47]"
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
                  }}
                >
                  奈费勒AI助手
                </h3>
              </div>

              {/* 内容 */}
              <div className="unified-content bg-gradient-to-r from-[#fbd5f2] to-[#e8f5e8] mb-3" style={{ border: 'none' }}>
                <p 
                  className="text-[#3a3f47] leading-relaxed"
                  style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
                  }}
                >
                  军师傅还在和奈费勒AI 搏斗！后期会接入，直接以聊天形式一边跟奈费勒谈恋爱一边让奈费勒当你的人生教练，嘿嘿！！
                </p>
              </div>

              {/* 确定按钮 */}
              <button
                onClick={() => setShowNepheleModal(false)}
                className="unified-button w-full bg-[#4CAF50] text-white hover:bg-[#45a049] transition-colors"
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
                }}
              >
                期待中...
              </button>
            </div>
          </div>
        )}

        {/* 任务创建弹窗由App.tsx统一管理 */}
      </div>
    </div>
  );
}