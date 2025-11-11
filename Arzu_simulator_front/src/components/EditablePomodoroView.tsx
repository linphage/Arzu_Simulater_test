import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw, ArrowLeft, Coffee, Clock, Save, Edit3 } from 'lucide-react';
import { taskService } from '../services/taskService';
import { focusPeriodService } from '../services/focusPeriodService';
import { brieflogService } from '../services/brieflogService';

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

interface EditablePomodoroViewProps {
  onBack: () => void;
  onSaveTask: (taskData: { 
    title: string; 
    content: string; 
    taskType: string; 
    priority: string;
    dateTime?: {
      date: string;
      startTime: string;
    };
    id?: string;
  }) => void;
}

type PomodoroState = 'focus' | 'shortBreak' | 'longBreak';
type TimerStatus = 'stopped' | 'running' | 'paused';

// 退出确认弹窗组件
function ExitConfirmModal({ 
  isOpen, 
  onClose, 
  onContinue,
  onLeave,
  onComplete
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onContinue: (reason: string) => void;
  onLeave: (reason: string) => void;
  onComplete: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleButtonClick = (action: (reason: string) => void) => {
    if (reason.trim() === '') {
      setError('请输入文字后再提交');
      return;
    }
    setError('');
    action(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border-2 border-[#3A3F47] p-6 max-w-sm w-full">
        <div className="text-center mb-6">
          <h3 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[18px] text-[#3A3F47] mb-4"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            阿尔图，怎么了？
          </h3>
          
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim() !== '') {
                setError('');
              }
            }}
            placeholder="阿尔图，告诉我是什么打断了任务。"
            className="w-full h-20 p-3 border-2 border-[#3A3F47] rounded-lg bg-white resize-none font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] mb-2"
            style={{ fontVariationSettings: "'wght' 400" }}
          />
          
          {error && (
            <p className="text-[#FF5252] text-[12px] mb-2">{error}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => handleButtonClick(onContinue)}
            className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
          >
            我搞错了
          </Button>
          
          <Button 
            onClick={() => handleButtonClick(onLeave)}
            variant="outline"
            className="w-full border-[#FF9800] text-[#FF9800] hover:bg-[#FF9800] hover:text-white"
          >
            离开
          </Button>
          
          <Button 
            onClick={() => handleButtonClick(onComplete)}
            className="w-full bg-[#2196F3] text-white hover:bg-[#1976D2]"
          >
            我做完了
          </Button>
        </div>
      </div>
    </div>
  );
}

// 激励弹窗组件
function MotivationModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (reflection: string) => void; 
}) {
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    onSubmit(reflection);
    setReflection('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border-2 border-[#3A3F47] p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <h3 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3A3F47] mb-3"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            结束了吗，议长？
          </h3>
          <p 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] leading-relaxed mb-4"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            呵呵，辛苦了——我说啊，这个工作已经难到你要嘤嘤嘤地挂我身上的程度了吗？跟我说说总结吧，下次工作的时候也许能给你一些指导。
          </p>
        </div>
        
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="分享你的工作总结..."
          className="w-full h-24 p-3 border-2 border-[#3A3F47] rounded-lg bg-white resize-none font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px]"
          style={{ fontVariationSettings: "'wght' 400" }}
        />
        
        <div className="flex justify-between mt-4">
          <Button 
            onClick={onClose}
            variant="outline"
            className="border-[#3A3F47] text-[#3A3F47] hover:bg-[#3A3F47] hover:text-white"
          >
            跳过
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-[#3A3F47] text-white hover:bg-[#2a2f35]"
          >
            提交总结
          </Button>
        </div>
        
        <p 
          className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#3A3F47] text-center mt-3 italic"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          ——阿尔图！这不是苏丹允许你乱摸的许可！
        </p>
      </div>
    </div>
  );
}

export function EditablePomodoroView({ onBack, onSaveTask }: EditablePomodoroViewProps) {
  // 默认计时器设置（分钟）
  const DEFAULT_FOCUS_MINUTES = 25;
  const SHORT_BREAK_TIME = 5 * 60 * 1000; // 5分钟
  const LONG_BREAK_TIME = 15 * 60 * 1000; // 15分钟

  // 状态管理
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('focus');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('stopped');
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES); // 可调整的专注时间
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_MINUTES * 60 * 1000);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalInvestedTime, setTotalInvestedTime] = useState(0); // 投入时间（毫秒）
  const [showMotivation, setShowMotivation] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 番茄钟会话和细分时间段状态
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<number | null>(null);

  // 🔧 localStorage key for persisting active period
  const ACTIVE_PERIOD_KEY = 'activePeriod_editable';

  // 任务编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState('新工作任务');
  const [taskContent, setTaskContent] = useState('在这里描述你的工作内容...');
  const [taskType, setTaskType] = useState('勤政');
  const [priority, setPriority] = useState('铜卡');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // 获取当前阶段的总时间
  const getCurrentPhaseTime = () => {
    switch (pomodoroState) {
      case 'focus': return focusMinutes * 60 * 1000;
      case 'shortBreak': return SHORT_BREAK_TIME;
      case 'longBreak': return LONG_BREAK_TIME;
    }
  };

  // 计算进度百分比
  const getProgress = () => {
    const totalTime = getCurrentPhaseTime();
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // 格式化时间显示
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 格式化投入时间显示
  const formatInvestedTime = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 获取状态颜色
  const getStateColors = () => {
    switch (pomodoroState) {
      case 'focus':
        return {
          primary: '#ffffff',
          secondary: '#6092e2',
          accent: '#ffffff',
          buttonBg: '#ffffff',
          buttonText: '#6092e2',
          buttonHover: '#f0f0f0'
        };
      case 'shortBreak':
      case 'longBreak':
        return {
          primary: '#ffffff',
          secondary: '#6092e2',
          accent: '#a8d8a8',
          buttonBg: '#a8d8a8',
          buttonText: '#ffffff',
          buttonHover: '#95c795'
        };
    }
  };

  // 播放音效
  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // 计时器逻辑
  useEffect(() => {
    if (timerStatus === 'running') {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTimeRef.current + pausedTimeRef.current;
        const remaining = getCurrentPhaseTime() - elapsed;

        if (remaining <= 0) {
          setTimeLeft(0);
          setTimerStatus('stopped');
          handlePhaseComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [timerStatus, pomodoroState]);

  // 阶段完成处理
  const handlePhaseComplete = async () => {
    playNotificationSound();
    
    if (pomodoroState === 'focus') {
      // 结束当前细分时间段，标记为正常完成（未中断）
      if (currentPeriodId && currentSessionId) {
        try {
          await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
            is_interrupted: false
          });
          console.log('✅ 细分时间段正常完成', { periodId: currentPeriodId, sessionId: currentSessionId });
          setCurrentPeriodId(null);
        } catch (error) {
          console.error('❌ 结束细分时间段失败:', error);
        }
      }
      
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      setTotalInvestedTime(prev => prev + (focusMinutes * 60 * 1000));
      setShowMotivation(true);
      
      if (newCount % 4 === 0) {
        setPomodoroState('longBreak');
        setTimeLeft(LONG_BREAK_TIME);
      } else {
        setPomodoroState('shortBreak');
        setTimeLeft(SHORT_BREAK_TIME);
      }
    } else {
      setPomodoroState('focus');
      setTimeLeft(focusMinutes * 60 * 1000);
    }
    
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
  };

  // 开始计时器
  const startTimer = async () => {
    if (currentSessionId) {
      try {
        const activePeriod = await focusPeriodService.getActivePeriod(currentSessionId);
        if (activePeriod && activePeriod.period_id !== currentPeriodId) {
          console.log('⚠️ 发现未关闭的细分时间段，正在关闭...', { periodId: activePeriod.period_id });
          await focusPeriodService.endPeriod(currentSessionId, activePeriod.period_id, {
            is_interrupted: true
          });
          console.log('✅ 已关闭遗留的细分时间段', { periodId: activePeriod.period_id });
        }
      } catch (error) {
        console.log('ℹ️ 没有活跃的细分时间段或查询失败，继续创建新时间段');
      }

      if (!currentPeriodId) {
        try {
          const period = await focusPeriodService.startPeriod(currentSessionId);
          setCurrentPeriodId(period.period_id);
          console.log('✅ 开始新的细分时间段', { periodId: period.period_id, sessionId: currentSessionId });
        } catch (error) {
          console.error('❌ 开始细分时间段失败:', error);
        }
      }
    }
    
    startTimeRef.current = Date.now();
    setTimerStatus('running');
  };

  // 暂停计时器
  const pauseTimer = async () => {
    if (timerStatus === 'running') {
      // 结束当前细分时间段，标记为中断
      if (currentPeriodId && currentSessionId) {
        try {
          await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
            is_interrupted: true
          });
          console.log('✅ 暂停 - 细分时间段中断', { periodId: currentPeriodId, sessionId: currentSessionId });
          setCurrentPeriodId(null);
        } catch (error) {
          console.error('❌ 结束细分时间段失败:', error);
        }
      }
      
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setTimerStatus('paused');
    }
  };

  // 重置计时器
  const resetTimer = async () => {
    // 如果正在运行，结束当前细分时间段，标记为中断
    if (currentPeriodId && currentSessionId && timerStatus !== 'stopped') {
      try {
        await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
          is_interrupted: true
        });
        console.log('✅ 重置 - 细分时间段中断', { periodId: currentPeriodId, sessionId: currentSessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 结束细分时间段失败:', error);
      }
    }
    
    setTimerStatus('stopped');
    setTimeLeft(getCurrentPhaseTime());
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
  };

  // 跳过当前阶段
  const skipPhase = () => {
    setTimerStatus('stopped');
    handlePhaseComplete();
  };

  // 处理退出确认
  const handleExitRequest = async () => {
    // 如果计时器未开始，直接返回首页
    if (timerStatus === 'stopped') {
      onBack();
      return;
    }
    
    // 结束当前细分时间段，标记为中断
    if (currentPeriodId && currentSessionId) {
      try {
        await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
          is_interrupted: true
        });
        console.log('✅ 退出请求 - 细分时间段中断', { periodId: currentPeriodId, sessionId: currentSessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 结束细分时间段失败:', error);
      }
    }
    
    // 计时器已开始（running或paused），显示退出确认弹窗
    setShowExitConfirm(true);
  };

  const handleContinueWork = async (reason: string) => {
    setShowExitConfirm(false);
    
    try {
      if (currentSessionId) {
        await brieflogService.createBriefLog({
          session_id: currentSessionId,
          task_id: 0,
          brief_type: 5,
          brief_content: reason
        });
        console.log('✅ 创建brieflog成功 (我搞错了)', { sessionId: currentSessionId, brief_type: 5 });
      }
    } catch (error) {
      console.error('❌ 创建brieflog失败:', error);
    }
    
    // 🔧 FIX: 先关闭旧的细分时间段，再开始新的
    if (currentPeriodId && currentSessionId) {
      try {
        await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
          is_interrupted: true
        });
        console.log('✅ 继续工作 - 先关闭旧的细分时间段', { periodId: currentPeriodId, sessionId: currentSessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 关闭旧的细分时间段失败:', error);
      }
    }
    
    if (currentSessionId) {
      try {
        const period = await focusPeriodService.startPeriod(currentSessionId);
        setCurrentPeriodId(period.period_id);
        console.log('✅ 继续工作 - 开始新的细分时间段', { periodId: period.period_id, sessionId: currentSessionId });
      } catch (error) {
        console.error('❌ 开始细分时间段失败:', error);
      }
    }
    
    const currentFocusTime = getCurrentPhaseTime() - timeLeft;
    console.log('办公室任务中断一次，继续计时');
  };

  const handleLeavePomodoro = async (reason: string) => {
    setShowExitConfirm(false);
    
    try {
      if (currentSessionId) {
        await brieflogService.createBriefLog({
          session_id: currentSessionId,
          task_id: 0,
          brief_type: 6,
          brief_content: reason
        });
        console.log('✅ 创建brieflog成功 (离开)', { sessionId: currentSessionId, brief_type: 6 });
      }
    } catch (error) {
      console.error('❌ 创建brieflog失败:', error);
    }
    
    // 🔧 FIX: 先关闭当前的细分时间段（如果存在）
    if (currentPeriodId && currentSessionId) {
      try {
        await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
          is_interrupted: true
        });
        console.log('✅ 离开 - 细分时间段已关闭', { periodId: currentPeriodId, sessionId: currentSessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 关闭细分时间段失败:', error);
      }
    }
    
    const elapsedTime = getCurrentPhaseTime() - timeLeft;
    setTotalInvestedTime(prev => prev + elapsedTime);
    
    console.log(`办公室任务结束一次，计时计入总计时：${Math.round(elapsedTime / 60000)}分钟`);
    onBack();
  };

  const handleCompleteFromExit = async (reason: string) => {
    setShowExitConfirm(false);
    
    try {
      if (currentSessionId) {
        await brieflogService.createBriefLog({
          session_id: currentSessionId,
          task_id: 0,
          brief_type: 7,
          brief_content: reason
        });
        console.log('✅ 创建brieflog成功 (我做完了)', { sessionId: currentSessionId, brief_type: 7 });
      }
    } catch (error) {
      console.error('❌ 创建brieflog失败:', error);
    }
    
    // 🔧 FIX: 先关闭当前的细分时间段（如果存在）
    if (currentPeriodId && currentSessionId) {
      try {
        await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
          is_interrupted: false  // 正常完成
        });
        console.log('✅ 我做完了 - 细分时间段已关闭', { periodId: currentPeriodId, sessionId: currentSessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 关闭细分时间段失败:', error);
      }
    }
    
    if (taskTitle.trim() !== '' && taskContent.trim() !== '') {
      onSaveTask({
        title: taskTitle.trim(),
        content: taskContent.trim(),
        taskType,
        priority
      });
    }
    console.log('办公室任务完成并保存');
  };

  // 处理激励弹窗提交
  const handleMotivationSubmit = (reflection: string) => {
    console.log('用户总结:', reflection);
  };

  // 处理任务编辑
  const handleEditToggle = () => {
    if (isEditing && hasUnsavedChanges) {
      // 如果有未保存的更改，询问用户是否要保存
      if (confirm('您有未保存的更改，是否要保存？')) {
        handleSaveTask();
      }
    }
    setIsEditing(!isEditing);
  };

  // 保存任务
  const handleSaveTask = async () => {
    if (taskTitle.trim() === '' || taskContent.trim() === '') {
      alert('请填写任务标题和内容');
      return;
    }

    try {
      const response = await taskService.createOfficeTask(
        taskTitle.trim(),
        taskContent.trim(),
        taskType,
        priority
      );
      
      console.log('🏢 办公室任务创建成功，后端返回:', response);
      
      // 解析后端返回的due_date，格式化为前端需要的格式
      let dateTime;
      if (response.data.due_date) {
        const dueDate = new Date(response.data.due_date);
        const month = dueDate.getMonth() + 1;
        const day = dueDate.getDate();
        const hours = dueDate.getHours();
        const minutes = dueDate.getMinutes();
        
        // 判断时间段
        let period = '上午';
        let displayHours = hours;
        if (hours >= 18) {
          period = '晚上';
          displayHours = hours > 12 ? hours - 12 : hours;
        } else if (hours >= 12) {
          period = '下午';
          displayHours = hours > 12 ? hours - 12 : hours;
        } else if (hours === 0) {
          displayHours = 12;
        }
        
        dateTime = {
          date: `${month}月${day}日`,
          startTime: `${period}${displayHours}:${minutes.toString().padStart(2, '0')}`
        };
      }
      
      onSaveTask({
        id: response.data.id.toString(),
        title: taskTitle.trim(),
        content: taskContent.trim(),
        taskType,
        priority,
        dateTime
      });
      
      setHasUnsavedChanges(false);
      setIsEditing(false);
      
      alert('任务保存成功！');
    } catch (error: any) {
      console.error('❌ 办公室任务创建失败:', error);
      alert(`任务保存失败: ${error.message}`);
    }
  };

  // 组件挂载时创建番茄钟会话（不需要关联任务）
  useEffect(() => {
    const initSession = async () => {
      try {
        // 创建番茄钟会话（办公室任务不需要 taskId）
        const session = await taskService.createPomodoroSession({
          durationMinutes: focusMinutes
        });
        setCurrentSessionId(session.id);
        console.log('✅ 番茄钟会话创建成功', { sessionId: session.id });
        
        // 不自动开始细分时间段，等用户点击"开始"按钮
      } catch (error) {
        console.error('❌ 创建番茄钟会话失败:', error);
      }
    };
    
    initSession();

    // 🔧 检查并清理跨天未关闭的 period
    const checkAndCleanupStalePeriod = async () => {
      try {
        const storedPeriod = localStorage.getItem(ACTIVE_PERIOD_KEY);
        if (storedPeriod) {
          const { periodId, sessionId: storedSessionId, startTime } = JSON.parse(storedPeriod);
          const elapsed = Date.now() - new Date(startTime).getTime();
          const MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2小时
          
          if (elapsed > MAX_DURATION_MS) {
            console.warn('⚠️ 发现超时未关闭的 period，正在自动关闭...', {
              periodId,
              sessionId: storedSessionId,
              elapsedHours: (elapsed / (60 * 60 * 1000)).toFixed(2)
            });
            
            // 设置结束时间为开始时间 + 2小时（最大允许时长）
            const cappedEndTime = new Date(new Date(startTime).getTime() + MAX_DURATION_MS).toISOString();
            
            await focusPeriodService.endPeriod(storedSessionId, periodId, {
              end_time: cappedEndTime,
              is_interrupted: true
            });
            
            localStorage.removeItem(ACTIVE_PERIOD_KEY);
            console.log('✅ 超时 period 已自动关闭并限制时长', { periodId, cappedDuration: '2小时' });
          }
        }
      } catch (error) {
        console.error('❌ 清理超时 period 失败:', error);
        // 如果清理失败，也要移除localStorage记录，避免永久卡住
        localStorage.removeItem(ACTIVE_PERIOD_KEY);
      }
    };

    checkAndCleanupStalePeriod();
  }, []);

  // 🔧 监听 currentPeriodId 变化，持久化到 localStorage
  useEffect(() => {
    if (currentPeriodId && currentSessionId) {
      const periodData = {
        periodId: currentPeriodId,
        sessionId: currentSessionId,
        startTime: new Date().toISOString()
      };
      localStorage.setItem(ACTIVE_PERIOD_KEY, JSON.stringify(periodData));
      console.log('💾 Period 已保存到 localStorage', periodData);
    } else {
      localStorage.removeItem(ACTIVE_PERIOD_KEY);
      console.log('🗑️ Period 已从 localStorage 移除');
    }
  }, [currentPeriodId, currentSessionId]);

  // 页面关闭前处理（突然离开番茄钟）
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (currentPeriodId && currentSessionId && timerStatus === 'running') {
        // 结束细分时间段，标记为中断
        try {
          await focusPeriodService.endPeriod(currentSessionId, currentPeriodId, {
            is_interrupted: true
          });
          console.log('✅ 页面关闭 - 细分时间段中断', { periodId: currentPeriodId, sessionId: currentSessionId });
          localStorage.removeItem(ACTIVE_PERIOD_KEY);
        } catch (error) {
          console.error('❌ 结束细分时间段失败:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentPeriodId, currentSessionId, timerStatus]);

  // 监听表单变化
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [taskTitle, taskContent, taskType, priority]);

  // 处理时间设置变化
  const handleTimeChange = (minutes: number) => {
    if (timerStatus === 'stopped' && pomodoroState === 'focus') {
      setFocusMinutes(minutes);
      setTimeLeft(minutes * 60 * 1000);
    }
  };

  // 时间设置选项
  const timeOptions = [5, 10, 15, 30, 60];

  const colors = getStateColors();

  return (
    <div className="bg-[#6092e2] relative min-h-screen w-full max-w-md mx-auto">
      {/* 返回按钮 */}
      <div className="absolute top-12 left-4 z-10">
        <Button
          onClick={handleExitRequest}
          variant="ghost"
          className="w-[52px] h-[52px] text-[#3A3F47] hover:bg-[#3A3F47] hover:text-white rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="h-8 w-8" />
        </Button>
      </div>

      {/* 编辑/保存按钮 */}
      <div className="absolute top-12 right-4 z-10">
        {isEditing ? (
          <Button
            onClick={handleSaveTask}
            className="w-[52px] h-[52px] bg-[#3A3F47] text-white hover:bg-[#2a2f35] rounded-full flex items-center justify-center"
          >
            <Save className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            onClick={handleEditToggle}
            className="w-[52px] h-[52px] bg-[#3A3F47] text-white hover:bg-[#2a2f35] rounded-full flex items-center justify-center"
          >
            <Edit3 className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* 主内容区域 */}
      <div 
        className="pt-20 pb-8 px-6 min-h-screen overflow-y-auto pomodoro-scroll bg-[#95BAF4]"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}
      >
        <style>{`
          .pomodoro-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex flex-col gap-8">
          {/* 任务信息头部 - 可编辑 */}
          <div className="mx-4">
            <div className="bg-white bg-opacity-95 rounded-2xl border-2 border-[#3A3F47] p-6 text-center backdrop-blur-sm shadow-lg">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value.slice(0, 12))}
                    maxLength={12}
                    className="w-full font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[20px] text-[#3A3F47] bg-transparent border-b-2 border-[#3A3F47] focus:outline-none text-center"
                    style={{ fontVariationSettings: "'wght' 400" }}
                    placeholder="任务标题 (最多12字)"
                  />
                  <div className="text-right text-[#3A3F47] text-[12px] opacity-70">
                    {taskTitle.length}/12
                  </div>
                  <textarea
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    className="w-full font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] bg-transparent border-2 border-[#3A3F47] rounded-lg p-3 focus:outline-none resize-none h-20"
                    style={{ fontVariationSettings: "'wght' 400" }}
                    placeholder="任务描述"
                  />
                  <div className="flex gap-4 justify-center">
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                      className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] bg-white border-2 border-[#3A3F47] rounded-lg p-2"
                    >
                      <option value="勤政">勤政</option>
                      <option value="恕己">恕己</option>
                      <option value="爱人">爱人</option>
                    </select>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] bg-white border-2 border-[#3A3F47] rounded-lg p-2"
                    >
                      <option value="金卡">金卡</option>
                      <option value="银卡">银卡</option>
                      <option value="铜卡">铜卡</option>
                      <option value="石卡">石卡</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <h1 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[20px] text-[#3A3F47] mb-2"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {taskTitle}
                  </h1>
                  <p 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] opacity-70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {taskContent}
                  </p>
                  <div className="flex gap-2 justify-center mt-2">
                    <span className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#3A3F47] bg-[#DDF0FF] px-2 py-1 rounded">
                      {taskType}
                    </span>
                    <span className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#3A3F47] bg-[#DDF0FF] px-2 py-1 rounded">
                      {priority}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 状态指示 */}
          <div className="mx-4">
            <div className="bg-white bg-opacity-20 rounded-xl border-2 border-[#3A3F47] p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                {pomodoroState === 'focus' ? (
                  <Clock className="h-5 w-5 text-[#3A3F47]" />
                ) : (
                  <Coffee className="h-5 w-5 text-[#3A3F47]" />
                )}
                <span 
                  className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3A3F47]"
                  style={{ fontVariationSettings: "'wght' 400" }}
                >
                  {pomodoroState === 'focus' && '专注时间'}
                  {pomodoroState === 'shortBreak' && '短休息'}
                  {pomodoroState === 'longBreak' && '长休息'}
                </span>
              </div>
              <p 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#3A3F47] opacity-80"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                已在此任务中投入：{formatInvestedTime(totalInvestedTime)}
              </p>
            </div>
          </div>

          {/* 圆形计时器 */}
          <div className="flex items-center justify-center py-8">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* 进度圆环 */}
              <svg 
                className="w-64 h-64 transform -rotate-90"
                viewBox="0 0 256 256"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: 'visible' }}
              >
                {/* 背景圆环 */}
                <circle
                  cx="128"
                  cy="128"
                  r="104"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* 进度圆环 */}
                <circle
                  cx="128"
                  cy="128"
                  r="104"
                  stroke={colors.accent}
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 104}`}
                  strokeDashoffset={`${2 * Math.PI * 104 * (1 - getProgress() / 100)}`}
                  className="transition-all duration-300 ease-linear"
                />
              </svg>
              
              {/* 中心时间显示 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="font-['ABeeZee:Regular',_sans-serif] text-[48px] mb-2 text-[#DDF0FF]"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {formatTime(timeLeft)}
                  </div>
                  <div 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] opacity-60 text-[#DDF0FF]"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {timerStatus === 'stopped' && '准备开始'}
                    {timerStatus === 'running' && '正在进行'}
                    {timerStatus === 'paused' && '已暂停'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 快速时间设置按钮 - 直接显示在主界面 */}
          {pomodoroState === 'focus' && timerStatus === 'stopped' && (
            <div className="mx-4 mb-6">
              <div className="bg-white bg-opacity-95 rounded-2xl border-2 border-[#3A3F47] p-4 backdrop-blur-sm shadow-lg">
                <div className="text-center mb-3">
                  <p 
                    className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] mb-2"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    专注时长
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {timeOptions.map((minutes) => (
                    <Button
                      key={minutes}
                      onClick={() => handleTimeChange(minutes)}
                      variant={focusMinutes === minutes ? "default" : "outline"}
                      size="sm"
                      className={`text-[12px] px-3 py-1 rounded-full ${
                        focusMinutes === minutes 
                          ? 'bg-[#3A3F47] text-white' 
                          : 'border-[#3A3F47] text-[#3A3F47] hover:bg-[#3A3F47] hover:text-white'
                      }`}
                    >
                      {minutes === 60 ? '1小时' : `${minutes}分`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="mx-4">
            <div className="bg-white bg-opacity-95 rounded-2xl border-2 border-[#3A3F47] p-6 backdrop-blur-sm shadow-lg">
              <div className="flex justify-center gap-4">
                {timerStatus === 'stopped' && (
                  <>
                    <Button
                      onClick={startTimer}
                      size="lg"
                      className="bg-[#6092e2] text-white hover:bg-[#5082d2] rounded-full px-6 shadow-lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      开始
                    </Button>
                    <Button
                      onClick={resetTimer}
                      size="lg"
                      className="bg-[#6092e2] text-white hover:bg-[#5082d2] rounded-full px-6 shadow-lg"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      重置计时器
                    </Button>
                  </>
                )}
                
                {timerStatus === 'running' && (
                  <>
                    <Button
                      onClick={pauseTimer}
                      size="lg"
                      className="bg-[#6092e2] text-white hover:bg-[#5082d2] rounded-full px-6 shadow-lg"
                    >
                      <Pause className="h-5 w-5 mr-2" />
                      暂停
                    </Button>
                    <Button
                      onClick={resetTimer}
                      size="lg"
                      className="bg-[#6092e2] text-white hover:bg-[#5082d2] rounded-full px-6 shadow-lg"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      重置计时器
                    </Button>
                  </>
                )}
                
                {timerStatus === 'paused' && (
                  <>
                    <Button
                      onClick={startTimer}
                      size="lg"
                      className="bg-[#6092e2] text-white hover:bg-[#5082d2] rounded-full px-6 shadow-lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      继续
                    </Button>
                    <Button
                      onClick={resetTimer}
                      size="lg"
                      className="bg-[#6092e2] text-white hover:bg-[#5082d2] rounded-full px-6 shadow-lg"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      重置计时器
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 辅助操作 */}
          {pomodoroState !== 'focus' && (
            <div className="mx-4">
              <div className="bg-white bg-opacity-10 rounded-xl border-2 border-[#3A3F47] p-4 backdrop-blur-sm">
                <div className="flex justify-center">
                  <Button
                    onClick={skipPhase}
                    variant="ghost"
                    size="sm"
                    className="text-[#3A3F47] hover:bg-[#3A3F47] hover:text-white"
                  >
                    跳过休息
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 退出确认弹窗 */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onContinue={handleContinueWork}
        onLeave={handleLeavePomodoro}
        onComplete={handleCompleteFromExit}
      />

      {/* 激励弹窗 */}
      <MotivationModal
        isOpen={showMotivation}
        onClose={() => setShowMotivation(false)}
        onSubmit={handleMotivationSubmit}
      />
    </div>
  );
}