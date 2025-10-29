import React, { useState, useEffect } from 'react';
import { FixedBottomNavigation } from './BottomNavigation';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface CompletedTask {
  id: string;
  title: string;
  content: string;
  taskType: string;
  priority: string;
  focusTime: number; // 专注时间（毫秒）
  completedAt: Date;
}

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

interface SettingsViewProps {
  onBack: () => void;
  onAddClick: () => void;
  onOfficeClick: () => void;
  onRoseGardenClick: () => void;
  onParliamentClick: () => void;
  onCreateTask?: (taskData: { title: string; content: string; dateTime?: any; taskType?: string; priority?: string }) => void;
  onResetAllData?: () => void;
  onLogout?: () => void;
  onManualReward?: () => void;
  tasks?: TaskData[];
  completedTasks?: CompletedTask[];
}

export function SettingsView({ 
  onBack, 
  onAddClick, 
  onOfficeClick, 
  onRoseGardenClick, 
  onParliamentClick,
  onResetAllData,
  onLogout,
  onManualReward,
  tasks = [],
  completedTasks = []
}: SettingsViewProps) {
  const [userInfo, setUserInfo] = useState({
    nickname: "加载中...",
    userId: 0,
    email: "加载中..."
  });

  const [statistics, setStatistics] = useState({
    completedTasksCount: 0,
    totalFocusMinutes: 0
  });

  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    weeklyReports: false
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('未找到认证令牌');
          return;
        }

        const response = await fetch('http://localhost:3002/api/v1/users/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('获取用户统计数据失败');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setUserInfo(data.data.userInfo);
          setStatistics(data.data.statistics);
        }
      } catch (error) {
        console.error('获取用户统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const totalFocusHours = Math.floor(statistics.totalFocusMinutes / 60);
  const totalFocusMinutes = Math.round((statistics.totalFocusMinutes % 60) * 10) / 10;

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // 🔥 TODO: 调用后端API更新通知设置
    console.log(`🔔 [通知设置] ${key}: ${value}`);
  };

  const handlePasswordChange = () => {
    // 🔥 TODO: 打开修改密码模态框或跳转到密码修改页面
    console.log('🔒 [安全设置] 请求修改密码');
    alert('🔒 修改密码功能需要后端支持，请联系管理员');
  };

  const handleDataExport = () => {
    // 🔥 TODO: 导出用户数据为JSON文件
    const userData = {
      userInfo,
      tasks,
      completedTasks,
      exportTime: new Date().toISOString()
    };
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `青金石宫模拟器_数据导出_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('📤 [数据管理] 数据导出完成');
  };

  const handleAccountDeletion = () => {
    // 🔥 TODO: 调用后端API注销账号
    if (window.confirm('⚠️ 确定要注销账号吗？\n\n注销后将会：\n• 永久删除所有任务数据\n• 清空个人信息\n• 无法恢复账号\n\n此操作不可逆转！')) {
      console.log('🗑️ [账号管理] 用户请求注销账号');
      alert('🗑️ 账号注销功能需要后端支持，请联系管理员');
    }
  };

  const handleCalendarSync = () => {
    // 🔥 TODO: 集成第三方日历服务（Google Calendar, iCloud等）
    console.log('📅 [同步设置] 请求连接第三方日历');
    alert('📅 日历同步功能需要后端支持，正在开发中');
  };

  const handleAppAuthorization = () => {
    // 🔥 TODO: 管理OAuth授权和第三方应用权限
    console.log('🔐 [授权管理] 打开应用授权管理');
    alert('🔐 应用授权管理功能需要后端支持，正在开发中');
  };

  const handleLogout = () => {
    if (window.confirm('🚪 确定要退出登录吗？\n\n退出后需要重新登录才能访问您的数据。')) {
      console.log('🚪 [用户操作] 退出登录');
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="bg-[#ddf0ff] relative h-screen w-full max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#ddf0ff] flex items-center justify-between px-4 z-10">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#3a3f47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-[18px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]">
          设置
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-[111px] h-full overflow-y-auto settings-scroll-container">
        <style>{`
          .settings-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="px-4 space-y-4 py-4">
          {/* 1. 基本账号信息 */}
          <div className="unified-content-no-border bg-white rounded-lg p-4">
            <h2 className="text-[16px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
              <div className="w-2 h-2 bg-[#4CAF50] rounded-full mr-2"></div>
              基本账号信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-[14px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                    用户昵称
                  </div>
                  <div className="text-[16px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    {loading ? '加载中...' : userInfo.nickname}
                  </div>
                </div>
              </div>
              
              <Separator className="bg-[#e5e7eb]" />
              
              <div>
                <div className="text-[14px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                  用户ID
                </div>
                <div className="text-[16px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] font-mono">
                  {loading ? '...' : userInfo.userId}
                </div>
              </div>
              
              <Separator className="bg-[#e5e7eb]" />
              
              <div>
                <div className="text-[14px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                  绑定邮箱
                </div>
                <div className="text-[16px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  {loading ? '加载中...' : userInfo.email}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 用户基础数据 */}
          <div className="unified-content-no-border bg-white rounded-lg p-4">
            <h2 className="text-[16px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
              <div className="w-2 h-2 bg-[#ff6b6b] rounded-full mr-2"></div>
              使用统计
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-[24px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#4CAF50] mb-1">
                  {loading ? '...' : statistics.completedTasksCount}
                </div>
                <div className="text-[14px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  已完成任务
                </div>
              </div>
              <div className="text-center p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-[24px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#2196F3] mb-1">
                  {loading ? '...' : `${totalFocusHours}h${totalFocusMinutes}m`}
                </div>
                <div className="text-[14px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  专注时长
                </div>
              </div>
            </div>
          </div>

          {/* 3. 个性设置 - 通知设置 */}
          <div className="unified-content-no-border bg-white rounded-lg p-4">
            <h2 className="text-[16px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
              <div className="w-2 h-2 bg-[#9C27B0] rounded-full mr-2"></div>
              通知设置
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-[14px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    邮箱推送
                  </div>
                  <div className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    接收任务提醒和进度报告
                  </div>
                </div>
                <Switch 
                  checked={notifications.emailNotifications} 
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                />
              </div>
              
              <Separator className="bg-[#e5e7eb]" />
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-[14px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    任务提醒
                  </div>
                  <div className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    任务即将到期时提醒
                  </div>
                </div>
                <Switch 
                  checked={notifications.taskReminders} 
                  onCheckedChange={(checked) => handleNotificationChange('taskReminders', checked)}
                />
              </div>
              
              <Separator className="bg-[#e5e7eb]" />
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-[14px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    周报推送
                  </div>
                  <div className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    每周发送工作总结报告
                  </div>
                </div>
                <Switch 
                  checked={notifications.weeklyReports} 
                  onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                />
              </div>
            </div>
          </div>

          {/* 4. 应用管理 */}
          <div className="unified-content-no-border bg-white rounded-lg p-4">
            <h2 className="text-[16px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
              <div className="w-2 h-2 bg-[#607D8B] rounded-full mr-2"></div>
              应用管理
            </h2>
            <div className="space-y-3">
              {/* 一键奖励测试按钮 */}
              {onManualReward && (
                <>
                  <button 
                    className="unified-button w-full bg-[#FF6B6B] text-white justify-start"
                    onClick={onManualReward}
                  >
                    <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    一键奖励 (测试)
                    <div className="ml-auto flex items-center space-x-2">
                      <span className="text-[12px] opacity-70">🧪 测试</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  <Separator className="bg-[#e5e7eb]" />
                </>
              )}
              
              <button 
                className="unified-button w-full bg-[#42A5F5] text-white justify-start"
                onClick={handleLogout}
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full mr-3 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                退出登录
                <svg className="ml-auto w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 版本信息 */}
          <div className="unified-content-no-border bg-white rounded-lg p-4 text-center">
            <div className="text-[12px] text-[#999] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] space-y-1">
              <div>青金石宫模拟器 v1.0.0</div>
              <div>© 2024 All Rights Reserved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <FixedBottomNavigation 
        onAddClick={onAddClick} 
        onOfficeClick={onOfficeClick} 
        onRoseGardenClick={onRoseGardenClick} 
        onParliamentClick={onParliamentClick}
        onSettingsClick={() => {}} // 当前就在设置页面，禁用设置按钮
      />
    </div>
  );
}