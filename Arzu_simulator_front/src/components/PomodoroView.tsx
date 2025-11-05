import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw, ArrowLeft, Coffee, Clock } from 'lucide-react';
import { focusPeriodService } from '../services/focusPeriodService';
import { pomodoroService } from '../services/pomodoroService';
import { taskService } from '../services/taskService';
import { brieflogService } from '../services/brieflogService';

interface TaskData {
  id: string;
  title: string;
  content: string;
  taskType: string;
  priority: string;
  focusTime?: number;
  pomodoroCount?: number;
  dateTime?: {
    date: string;
    startTime: string;
  };
}

interface PomodoroViewProps {
  task: TaskData;
  onBack: () => void;
  onTaskComplete?: (taskId: string, focusTime: number) => void; // 任务完成回调
  onTaskInterrupted?: (taskId: string, focusTime: number) => void; // 任务中断回调
  onTaskAbandoned?: (taskId: string, focusTime: number) => void; // 任务放弃回调
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

  const handleContinue = () => {
    if (!reason.trim()) {
      setError('请输入继续工作的原因');
      return;
    }
    onContinue(reason.trim());
    setReason('');
    setError('');
  };

  const handleLeave = () => {
    if (!reason.trim()) {
      setError('请输入离开的原因');
      return;
    }
    onLeave(reason.trim());
    setReason('');
    setError('');
  };

  const handleComplete = () => {
    if (!reason.trim()) {
      setError('请总结一下刚才工作的感受');
      return;
    }
    onComplete(reason.trim());
    setReason('');
    setError('');
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
              if (error) setError('');
            }}
            placeholder="阿尔图，告诉我是什么打断了任务，如果你做完了，总结一下刚才工作的感受再离开。"
            className={`w-full h-28 p-3 border-2 ${error ? 'border-red-500' : 'border-[#3A3F47]'} rounded-lg bg-white resize-none font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] mb-2 placeholder-gray-500 huawei-compatible-textarea`}
            style={{ 
              fontVariationSettings: "'wght' 400",
              fontSize: '14px !important',
              lineHeight: '1.5',
              color: '#3A3F47',
              WebkitTextFillColor: '#3A3F47',
              WebkitAppearance: 'none'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {error && (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={handleContinue}
            className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
          >
            我搞错了
          </Button>
          
          <Button 
            onClick={handleLeave}
            variant="outline"
            className="w-full border-[#FF9800] text-[#FF9800] hover:bg-[#FF9800] hover:text-white"
          >
            离开
          </Button>
          
          <Button 
            onClick={handleComplete}
            className="w-full bg-[#2196F3] text-white hover:bg-[#1976D2]"
          >
            我做完了
          </Button>
        </div>
      </div>
    </div>
  );
}

// 统一的任务完成和总结弹窗组件
function UnifiedTaskCompletionModal({ 
  isOpen, 
  onClose, 
  onTaskComplete,
  onTaskNotComplete,
  onReflectionSubmit
}: { 
  isOpen: boolean; 
  onClose: (isTaskCompleted: boolean) => void; 
  onTaskComplete: () => void;
  onTaskNotComplete: () => void;
  onReflectionSubmit: (reflection: string) => void;
}) {
  const [step, setStep] = useState<'completion' | 'reflection'>('completion');
  const [reflection, setReflection] = useState('');
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);

  // 重置状态当弹窗打开时
  useEffect(() => {
    if (isOpen) {
      setStep('completion');
      setReflection('');
      setIsTaskCompleted(false);
    }
  }, [isOpen]);

  const handleTaskComplete = () => {
    setIsTaskCompleted(true);
    setStep('reflection');
    console.log('✅ 用户确认任务完成，进入反思步骤，反思后回到主界面');
    onTaskComplete();
  };

  const handleTaskNotComplete = () => {
    setIsTaskCompleted(false);
    setStep('reflection');
    console.log('📝 用户选择"还差一点"，进入反思步骤，稍后继续番茄钟流程');
    onTaskNotComplete();
  };

  const handleReflectionSubmit = () => {
    onReflectionSubmit(reflection);
    setReflection('');
    
    // 🔧 传递任务完成状态给父组件
    console.log('📝 反思提交，任务状态:', isTaskCompleted ? '已完成' : '未完成');
    onClose(isTaskCompleted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="unified-content bg-white max-w-sm w-full modal-mobile-optimized"
        style={{
          borderRadius: '10px',
          border: '1px solid #3A3F47',
          padding: '24px',
          boxShadow: 'none'
        }}
      >
        {step === 'completion' && (
          <>
            <div className="text-center mb-6">
              <h3 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] mb-3"
                style={{ 
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#3A3F47',
                  fontVariationSettings: "'wght' 500"
                }}
              >
                任务完成确认
              </h3>
              <p 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] leading-relaxed px-3"
                style={{ 
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#3A3F47',
                  fontVariationSettings: "'wght' 400"
                }}
              >
                阿尔图，做的很棒。这个任务做完了吗？做完的话可以摸摸鹦鹉。
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <button 
                onClick={handleTaskNotComplete}
                className="unified-button border-[#3A3F47] text-[#3A3F47] bg-white hover:bg-[#3A3F47] hover:text-white transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #3A3F47',
                  padding: '12px 16px',
                  boxShadow: 'none'
                }}
              >
                还差一点
              </button>
              <button 
                onClick={handleTaskComplete}
                className="unified-button border-[#3A3F47] text-white bg-[#4CAF50] hover:bg-[#45a049] transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #3A3F47',
                  padding: '12px 16px',
                  boxShadow: 'none'
                }}
              >
                都做完了！
              </button>
            </div>
          </>
        )}

        {step === 'reflection' && (
          <>
            <div className="text-center mb-4">
              <p 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] leading-relaxed mb-4 px-3"
                style={{ 
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#3A3F47',
                  fontVariationSettings: "'wght' 400"
                }}
              >
                {isTaskCompleted 
                  ? "恭喜，阿尔图，我当然会庆祝你的完成——但我相信工作一定没有难到让你嘤嘤嘤地挂在我身上的程度！跟我说说你工作时细微的烦躁来源吧，下次工作时也许可以给你一些指导。" 
                  : "嘿，嘿，嘿。阿尔图，还没做完，先喘口气，现在就挂到我身上我想太早了些。跟我说说你在刚才工作时的感觉，什么时候烦躁，什么时候想走神？下次工作时，也许可以给你一些指导。"
                }
              </p>
            </div>
            
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="分享你的工作总结..."
              className="unified-textarea w-full h-24 resize-none font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] huawei-compatible-textarea"
              style={{ 
                fontSize: '14px',
                fontWeight: '400',
                borderRadius: '6px',
                border: '1px solid #3A3F47',
                padding: '12px',
                boxShadow: 'none',
                backgroundColor: '#f3f3f5',
                fontVariationSettings: "'wght' 400",
                WebkitTextFillColor: '#3A3F47',
                WebkitAppearance: 'none'
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleReflectionSubmit}
                className="unified-button border-[#3A3F47] text-white bg-[#3A3F47] hover:bg-[#2a2f35] transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #3A3F47',
                  padding: '12px 16px',
                  boxShadow: 'none'
                }}
              >
                提交总结
              </button>
            </div>
            
            <p 
              className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-center mt-3 italic px-3"
              style={{ 
                fontSize: '12px',
                fontWeight: '400',
                color: '#3A3F47',
                fontVariationSettings: "'wght' 400"
              }}
            >
              ——阿尔图！这不是苏丹允许你乱摸的许可！
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function PomodoroView({ task, onBack, onTaskComplete, onTaskInterrupted, onTaskAbandoned }: PomodoroViewProps) {
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
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // 番茄钟会话和细分时间段管理
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<number | null>(null);

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
    // 确保进度在0-100之间
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

  // 检查是否有活跃会话（不自动创建）
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        // 只检查是否有活跃会话，不创建新的
        const activeSession = await pomodoroService.getActiveSession();
        
        if (activeSession) {
          // 如果有活跃会话，使用它
          setSessionId(activeSession.id);
          setIsInitialized(true);
          console.log('✅ 使用现有活跃番茄钟会话', { sessionId: activeSession.id });
          
          // 检查是否有未结束的细分时间段
          const activePeriod = await focusPeriodService.getActivePeriod(activeSession.id);
          if (activePeriod) {
            setCurrentPeriodId(activePeriod.period_id);
            console.log('✅ 找到未结束的细分时间段', { periodId: activePeriod.period_id });
          }
        } else {
          // 没有活跃会话，标记为已初始化但不创建session
          // session将在点击"开始"时创建
          setIsInitialized(true);
          console.log('✅ 无活跃会话，等待用户点击开始');
        }
      } catch (error) {
        console.error('❌ 检查活跃会话失败:', error);
        setIsInitialized(true); // 即使失败也标记为已初始化
      }
    };

    checkActiveSession();

    // 组件卸载时的清理逻辑
    return () => {
      // 如果有活跃的细分时间段，结束它（意外离开）
      if (currentPeriodId && sessionId) {
        focusPeriodService.endPeriod(sessionId, currentPeriodId, {
          is_interrupted: true
        }).then(() => {
          console.log('🧹 组件卸载 - 细分时间段中断', { periodId: currentPeriodId, sessionId });
        }).catch((error) => {
          console.error('❌ 组件卸载时结束细分时间段失败:', error);
        });
      }
    };
  }, []);

  // 处理浏览器关闭/刷新时自动结束活跃时间段和会话
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const API_BASE = 'http://localhost:3002/api/v1/tasks';
      
      // 场景4：突然关闭网页
      // 1. 结束focus_period
      if (currentPeriodId && sessionId) {
        fetch(`${API_BASE}/pomodoro/${sessionId}/periods/${currentPeriodId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            is_interrupted: true,
            end_time: new Date().toISOString()
          }),
          keepalive: true
        }).catch((error) => {
          console.error('❌ beforeunload 结束细分时间段失败:', error);
        });
        
        console.log('📡 浏览器关闭 - 发送结束细分时间段请求', { periodId: currentPeriodId, sessionId });
      }
      
      // 2. 结束session（completed: false, duration_minutes: 不变）
      if (sessionId) {
        fetch(`${API_BASE}/pomodoro/${sessionId}/end`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            completed: false,
            completedAt: new Date().toISOString(),
            updateDuration: false
          }),
          keepalive: true
        }).catch((error) => {
          console.error('❌ beforeunload 结束会话失败:', error);
        });
        
        console.log('📡 场景4: 突然关闭网页 - 发送结束会话请求', { sessionId });
        
        // 3. 更新任务表：completed不变，focus_time累加，pomodoro_count+1
        fetch(`${API_BASE}/${task.id}/pomodoro/${sessionId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            markAsCompleted: false
          }),
          keepalive: true
        }).catch((error) => {
          console.error('❌ beforeunload 更新任务失败:', error);
        });
        
        console.log('📡 场景4: 突然关闭网页 - 发送任务更新请求', { taskId: task.id, sessionId });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPeriodId, sessionId, task.id]);

  // 获取状态颜色 - 基于新的#6092E2背景
  const getStateColors = () => {
    switch (pomodoroState) {
      case 'focus':
        return {
          primary: '#ffffff',        // 白色文字确保在蓝色背景上可读
          secondary: '#6092e2',      // 主背景色
          accent: '#ffffff',         // 白色圆环
          buttonBg: '#ffffff',       // 白色按钮背景
          buttonText: '#6092e2',     // 蓝色按钮文字
          buttonHover: '#f0f0f0'     // 按钮悬停色
        };
      case 'shortBreak':
      case 'longBreak':
        return {
          primary: '#ffffff',        // 白色文字
          secondary: '#6092e2',      // 保持相同背景
          accent: '#a8d8a8',         // 浅绿色圆环表示休息
          buttonBg: '#a8d8a8',       // 浅绿色按钮
          buttonText: '#ffffff',     // 白色按钮文字
          buttonHover: '#95c795'     // 按钮悬停色
        };
    }
  };

  // 播放音效（简单的音频反馈）
  const playNotificationSound = () => {
    // 使用Web Audio API创建简单的提示音
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
      }, 100); // 更高频率更新以确保精确性

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
      // 🔧 结束当前细分时间段（正常完成，is_interrupted=false）
      if (currentPeriodId && sessionId) {
        try {
          await focusPeriodService.endPeriod(sessionId, currentPeriodId, {
            is_interrupted: false
          });
          console.log('✅ 细分时间段正常完成', { periodId: currentPeriodId, sessionId });
          setCurrentPeriodId(null);
        } catch (error) {
          console.error('❌ 结束细分时间段失败:', error);
        }
      }
      
      // 场景5：用户完成了整段计时工作，触发MotivationModal
      // completed: true, duration_minutes: 不变（按设定时间完成）
      if (sessionId) {
        try {
          await pomodoroService.endSession(sessionId, {
            completed: true,
            completedAt: new Date().toISOString(),
            updateDuration: false  // 不更新，因为是按设定时间完成的
          });
          console.log('✅ 场景5: 完成整段计时 - 会话已完成', { sessionId });
          // 保存已完成的sessionId，供后续更新tasks表使用
          setCompletedSessionId(sessionId);
          // 清空sessionId，下次开始时创建新session
          setSessionId(null);
        } catch (error) {
          console.error('❌ 结束会话失败:', error);
        }
      }
      
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      // 累计投入时间（专注阶段才计入投入时间）
      const focusTime = focusMinutes * 60 * 1000;
      setTotalInvestedTime(prev => prev + focusTime);
      
      // 显示统一的任务完成和总结弹窗
      setShowUnifiedModal(true);
      
      // 决定下一个阶段
      if (newCount % 4 === 0) {
        setPomodoroState('longBreak');
        setTimeLeft(LONG_BREAK_TIME);
      } else {
        setPomodoroState('shortBreak');
        setTimeLeft(SHORT_BREAK_TIME);
      }
    } else {
      // 休息结束，回到专注状态
      setPomodoroState('focus');
      setTimeLeft(focusMinutes * 60 * 1000);
    }
    
    // 重置计时器状态
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
  };

  // 开始计时器
  const startTimer = async () => {
    // 等待初始化完成
    if (!isInitialized) {
      console.warn('⚠️ 尚未初始化，无法开始计时');
      return;
    }

    // 🆕 如果没有session，先创建（使用当前设定的focusMinutes）
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        console.log('📝 创建新的番茄钟会话', { focusMinutes, taskId: task.id });
        const session = await pomodoroService.createSession({
          taskId: parseInt(task.id),
          durationMinutes: focusMinutes
        });
        currentSessionId = session.id;
        setSessionId(session.id);
        console.log('✅ 番茄钟会话创建成功', { sessionId: session.id, durationMinutes: focusMinutes });
      } catch (error) {
        console.error('❌ 创建番茄钟会话失败:', error);
        return;
      }
    }

    // 🔧 开始新的细分时间段
    if (pomodoroState === 'focus') {
      try {
        const result = await focusPeriodService.startPeriod(currentSessionId);
        setCurrentPeriodId(result.period_id);
        console.log('✅ 开始新的细分时间段', { periodId: result.period_id, sessionId: currentSessionId });
      } catch (error) {
        console.error('❌ 开始细分时间段失败:', error);
        return;
      }
    }
    
    startTimeRef.current = Date.now();
    setTimerStatus('running');
  };

  // 暂停计时器
  const pauseTimer = async () => {
    if (timerStatus === 'running') {
      // 🔧 结束当前细分时间段（中断）
      if (currentPeriodId && sessionId) {
        try {
          await focusPeriodService.endPeriod(sessionId, currentPeriodId, {
            is_interrupted: true
          });
          console.log('✅ 暂停 - 细分时间段中断', { periodId: currentPeriodId, sessionId });
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
    // 🔧 如果计时器正在运行，结束当前细分时间段（中断）
    if (timerStatus === 'running' && currentPeriodId && sessionId) {
      try {
        await focusPeriodService.endPeriod(sessionId, currentPeriodId, {
          is_interrupted: true
        });
        console.log('✅ 重置 - 细分时间段中断', { periodId: currentPeriodId, sessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 结束细分时间段失败:', error);
      }
    }
    
    // 场景3：点击"重置计时器"按钮
    // completed: false, duration_minutes: 不变
    if (sessionId) {
      try {
        // 结束番茄钟会话
        await pomodoroService.endSession(sessionId, {
          completed: false,
          completedAt: new Date().toISOString(),
          updateDuration: false
        });
        console.log('✅ 场景3: 重置计时器 - 会话已结束', { sessionId });
        
        // 更新任务表：completed不变，focus_time累加，pomodoro_count+1
        await taskService.updateTaskCompletionFromPomodoro(
          task.id,
          sessionId,
          false, // 不标记为完成
          undefined
        );
        console.log('✅ 场景3: 任务表已更新', { taskId: task.id, sessionId });
        
        // 注意：这里会结束当前session，下次点击"开始"会创建新session
        setSessionId(null);
        setIsInitialized(false);
      } catch (error) {
        console.error('❌ 场景3处理失败:', error);
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

  // 处理任务完成确认（场景4：用户点击"都做完了！"）
  const handleTaskCompleteConfirm = async () => {
    // 🔧 记录任务完成，但不立即退出，等待反思完成
    const elapsedTime = getCurrentPhaseTime() - timeLeft;
    setTotalInvestedTime(prev => prev + elapsedTime);
    
    // 使用已完成的sessionId（因为handlePhaseComplete已经清空了sessionId）
    const currentSessionId = completedSessionId || sessionId;
    
    // 场景4：用户完成了整段计时工作，点击"都做完了！"
    // 更新任务表：completed=true，completed_at=当前时间，focus_time累加，pomodoro_count+1
    if (currentSessionId) {
      try {
        const completionTime = new Date().toISOString();
        await taskService.updateTaskCompletionFromPomodoro(
          task.id,
          currentSessionId,
          true, // 标记为完成
          completionTime
        );
        console.log('✅ 场景4: 都做完了 - 任务表已更新为完成', { taskId: task.id, sessionId: currentSessionId, completedAt: completionTime });
        // 清空已完成的sessionId
        setCompletedSessionId(null);
      } catch (error) {
        console.error('❌ 场景4处理失败:', error);
      }
    } else {
      console.error('❌ 无法更新任务：sessionId为空');
    }
    
    // 调用父组件的任务完成回调，传递任务ID和专注时间
    if (onTaskComplete) {
      onTaskComplete(task.id, elapsedTime);
    }
    
    console.log(`✅ 任务确认完成，等待反思完成后回到主界面：${Math.round(elapsedTime / 60000)}分钟`);
    // 不调用onBack()，让反思步骤完成后再决定
  };

  const handleTaskNotCompleteConfirm = async () => {
    // 用户完成了整段计时工作，触发MotivationModal，点击"还差一点"
    // 注意：handlePhaseComplete已经将pomodoro_sessions.completed设为true
    // 只需要更新tasks表：completed不变，focus_time累加，pomodoro_count+1
    
    // 使用已完成的sessionId（因为handlePhaseComplete已经清空了sessionId）
    const currentSessionId = completedSessionId || sessionId;
    
    if (currentSessionId) {
      try {
        await taskService.updateTaskCompletionFromPomodoro(
          task.id,
          currentSessionId,
          false, // 不标记任务为完成
          undefined // 不设置完成时间
        );
        console.log('✅ 用户点击"还差一点" - 任务表已更新（completed不变，focus_time累加，pomodoro_count+1）', { taskId: task.id, sessionId: currentSessionId });
        // 清空已完成的sessionId
        setCompletedSessionId(null);
      } catch (error) {
        console.error('❌ 更新任务失败:', error);
      }
    } else {
      console.error('❌ 无法更新任务：sessionId为空');
    }
    
    console.log(`📝 任务还差一点，继续番茄钟流程`);
    // 不调用onBack()，继续番茄钟流程，进入休息阶段
  };

  // 处理退出确认
  const handleExitRequest = async () => {
    // 如枟计时器未开始，直接返回首页
    if (timerStatus === 'stopped') {
      onBack();
      return;
    }
    
    // 如果处于休息时间，直接返回首页，不需要确认
    if (pomodoroState === 'shortBreak' || pomodoroState === 'longBreak') {
      console.log('📝 休息时间退出，直接返回');
      onBack();
      return;
    }
    
    // 🔧 如果计时器正在运行，先结束当前细分时间段（中断）
    if (timerStatus === 'running' && currentPeriodId && sessionId) {
      try {
        await focusPeriodService.endPeriod(sessionId, currentPeriodId, {
          is_interrupted: true
        });
        console.log('✅ 退出请求 - 细分时间段中断', { periodId: currentPeriodId, sessionId });
        setCurrentPeriodId(null);
      } catch (error) {
        console.error('❌ 结束细分时间段失败:', error);
      }
    }
    
    // 专注时间且计时器已开始（running或paused），显示退出确认弹窗
    setShowExitConfirm(true);
  };

  const handleContinueWork = async (reason: string) => {
    setShowExitConfirm(false);
    
    try {
      await brieflogService.createBriefLog({
        task_id: parseInt(task.id),
        session_id: sessionId || undefined,
        brief_type: 5,
        brief_content: reason
      });
      console.log('✅ brief_type=5 (继续工作备注) 记录成功');
    } catch (error) {
      console.error('❌ 创建brieflog失败:', error);
    }
    
    // 🔧 开始新的细分时间段（用户选择继续工作）
    if (sessionId && pomodoroState === 'focus' && timerStatus !== 'stopped') {
      try {
        const result = await focusPeriodService.startPeriod(sessionId);
        setCurrentPeriodId(result.period_id);
        console.log('✅ 继续工作 - 开始新的细分时间段', { periodId: result.period_id, sessionId });
      } catch (error) {
        console.error('❌ 开始细分时间段失败:', error);
      }
    }
    
    // 记录任务中断一次
    if (onTaskInterrupted) {
      const currentFocusTime = getCurrentPhaseTime() - timeLeft;
      onTaskInterrupted(task.id, currentFocusTime);
    }
    console.log('任务中断一次，继续计时');
  };

  const handleLeavePomodoro = async (reason: string) => {
    setShowExitConfirm(false);
    
    try {
      await brieflogService.createBriefLog({
        task_id: parseInt(task.id),
        session_id: sessionId || undefined,
        brief_type: 6,
        brief_content: reason
      });
      console.log('✅ brief_type=6 (离开备注) 记录成功');
    } catch (error) {
      console.error('❌ 创建brieflog失败:', error);
    }
    
    // 场景1：点击"离开"按钮（中断）
    // completed: false, duration_minutes: 不变
    if (sessionId) {
      try {
        // 结束番茄钟会话
        await pomodoroService.endSession(sessionId, {
          completed: false,
          completedAt: new Date().toISOString(),
          updateDuration: false
        });
        console.log('✅ 场景1: 离开 - 会话已结束（中断）', { sessionId });
        
        // 更新任务表：completed不变，focus_time累加，pomodoro_count+1
        await taskService.updateTaskCompletionFromPomodoro(
          task.id,
          sessionId,
          false, // 不标记为完成
          undefined
        );
        console.log('✅ 场景1: 任务表已更新', { taskId: task.id, sessionId });
      } catch (error) {
        console.error('❌ 场景1处理失败:', error);
      }
    }
    
    // 计算已经过的时间
    const elapsedTime = getCurrentPhaseTime() - timeLeft;
    setTotalInvestedTime(prev => prev + elapsedTime);
    
    // 记录任务放弃，计入总计时
    if (onTaskAbandoned) {
      onTaskAbandoned(task.id, elapsedTime);
    }
    console.log(`任务结束一次，计时计入总计时：${Math.round(elapsedTime / 60000)}分钟`);
    onBack();
  };

  const handleCompleteFromExit = async (reason: string) => {
    setShowExitConfirm(false);
    
    try {
      await brieflogService.createBriefLog({
        task_id: parseInt(task.id),
        session_id: sessionId || undefined,
        brief_type: 7,
        brief_content: reason
      });
      console.log('✅ brief_type=7 (任务完成备注) 记录成功');
    } catch (error) {
      console.error('❌ 创建brieflog失败:', error);
    }
    
    // 场景2：点击"我做完了"按钮（完成任务）
    // completed: true, duration_minutes: 累加所有focus_periods
    if (sessionId) {
      try {
        // 结束番茄钟会话
        await pomodoroService.endSession(sessionId, {
          completed: true,
          completedAt: new Date().toISOString(),
          updateDuration: true  // 更新为实际累计时长
        });
        console.log('✅ 场景2: 我做完了 - 会话已完成', { sessionId });
        
        // 更新任务表：completed=true，completed_at=当前时间，focus_time累加，pomodoro_count+1
        const completionTime = new Date().toISOString();
        await taskService.updateTaskCompletionFromPomodoro(
          task.id,
          sessionId,
          true, // 标记为完成
          completionTime
        );
        console.log('✅ 场景2: 任务表已更新为完成', { taskId: task.id, sessionId, completedAt: completionTime });
      } catch (error) {
        console.error('❌ 场景2处理失败:', error);
      }
    }
    
    // 计算已经过的时间
    const elapsedTime = getCurrentPhaseTime() - timeLeft;
    setTotalInvestedTime(prev => prev + elapsedTime);
    
    // 完成任务
    if (onTaskComplete) {
      onTaskComplete(task.id, elapsedTime);
    }
    console.log(`任务完成，移除任务卡：${Math.round(elapsedTime / 60000)}分钟`);
    onBack();
  };

  // 处理工作总结提交
  const handleReflectionSubmit = async (reflection: string) => {
    console.log('用户总结:', reflection);
    
    // 创建反思日志记录
    if (reflection.trim()) {
      try {
        await brieflogService.createBriefLog({
          task_id: parseInt(task.id),
          session_id: sessionId || undefined,
          brief_type: 8,
          brief_content: reflection.trim()
        });
        console.log('✅ brief_type=8 (反思备注) 记录成功');
      } catch (error) {
        console.error('❌ 创建反思brieflog失败:', error);
      }
    }
  };

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
          className="w-[52px] h-[52px] bg-white text-black hover:bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#3A3F47]"
        >
          <ArrowLeft className="h-8 w-8" />
        </Button>
      </div>

      {/* 主内容区域 - 添加滚动功能 */}
      <div 
        className="pt-20 pb-8 px-6 min-h-screen overflow-y-auto pomodoro-scroll"
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
        {/* 任务信息头部 */}
        <div className="mx-4">
          <div className="bg-white bg-opacity-95 rounded-2xl border-2 border-[#3A3F47] p-6 text-center backdrop-blur-sm shadow-lg">
            <h1 
              className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[20px] text-[#3A3F47] mb-2"
              style={{ fontVariationSettings: "'wght' 400" }}
            >
              {task.title}
            </h1>
            <p 
              className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3A3F47] opacity-70"
              style={{ fontVariationSettings: "'wght' 400" }}
            >
              {task.content}
            </p>
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
              已在此任务中投入{task.pomodoroCount || 0}个番茄时段。
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

      {/* 统一的任务完成和总结弹窗 */}
      <UnifiedTaskCompletionModal
        isOpen={showUnifiedModal}
        onClose={(isTaskCompleted) => {
          setShowUnifiedModal(false);
          // 🔧 根据任务完成状态决定后续行为
          if (isTaskCompleted) {
            // 任务完成：回到主界面
            console.log('✅ 任务完成，反思结束，回到主界面');
            onBack();
          } else {
            // 任务未完成：继续番茄钟流程，进入休息阶段
            console.log('📝 任务未完成，反思结束，继续番茄钟流程进入休息');
            // 不调用onBack()，让番茄钟继续到休息阶段
          }
        }}
        onTaskComplete={handleTaskCompleteConfirm}
        onTaskNotComplete={handleTaskNotCompleteConfirm}
        onReflectionSubmit={handleReflectionSubmit}
      />
    </div>
  );
}