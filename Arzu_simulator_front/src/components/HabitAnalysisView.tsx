import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface HabitAnalysisViewProps {
  // Props no longer needed as we fetch data from API
}

interface HabitStats {
  keyMetrics: {
    totalProblematicEvents: number;
    problematicEventRatio: number;
    totalTasksCreated: number;
  };
  dailyData: Array<{
    date: string;
    taskDeletion: number;
    categoryChange: number;
    priorityChange: number;
    dueDateChange: number;
  }>;
  taskTypeStats: Array<{
    taskType: string;
    affectedCount: number;
    totalCount: number;
    percentage: number;
  }>;
  highFrequencyTimeSlots: Array<{
    timeSlot: string;
    count: number;
  }>;
}

export function HabitAnalysisView(_props: HabitAnalysisViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');
  const [habitStats, setHabitStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHabitStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('未找到认证令牌');
        }

        const response = await fetch(
          `http://localhost:3002/api/v1/tasks/pomodoro/habit-stats?timeframe=${selectedTimeframe}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('获取习惯分析数据失败');
        }

        const data = await response.json();
        setHabitStats(data.data);
      } catch (err) {
        console.error('获取习惯分析数据失败:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHabitStats();
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="h-full bg-[#D9E9CC] flex items-center justify-center">
        <div className="text-[14px] text-[#666]">加载中...</div>
      </div>
    );
  }

  if (error || !habitStats) {
    return (
      <div className="h-full bg-[#D9E9CC] flex items-center justify-center">
        <div className="text-[14px] text-[#ff6b6b]">{error || '数据加载失败'}</div>
      </div>
    );
  }

  const { keyMetrics, dailyData, taskTypeStats, highFrequencyTimeSlots } = habitStats;

  return (
    <div 
      className="h-full bg-[#D9E9CC] p-4 overflow-y-auto habit-scroll-container"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}
    >
      <style>{`
        .habit-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]">
            习惯模式深度解析
          </h2>
          <div className="bg-white rounded-lg p-1 border border-[#3a3f47] flex">
            <button
              className={`px-3 py-1 rounded-md text-[12px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] transition-all duration-200 ${
                selectedTimeframe === 'week' 
                  ? 'bg-[#4CAF50] text-white' 
                  : 'text-[#666] hover:bg-gray-100'
              }`}
              onClick={() => setSelectedTimeframe('week')}
            >
              本周
            </button>
            <button
              className={`px-3 py-1 rounded-md text-[12px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] transition-all duration-200 ${
                selectedTimeframe === 'month' 
                  ? 'bg-[#4CAF50] text-white' 
                  : 'text-[#666] hover:bg-gray-100'
              }`}
              onClick={() => setSelectedTimeframe('month')}
            >
              本月
            </button>
          </div>
        </div>
        
        <p className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
          基于任务变更日志的习惯模式分析与优化建议
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 border border-[#3a3f47] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-[#ff6b6b] to-[#ff8a80] opacity-20 rounded-full transform translate-x-2 -translate-y-2"></div>
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#ff6b6b]">
            {keyMetrics.totalProblematicEvents || '0'}
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            {selectedTimeframe === 'week' ? '本周' : '本月'}问题事件
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-[#3a3f47] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-[#ffa726] to-[#ffb74d] opacity-20 rounded-full transform translate-x-2 -translate-y-2"></div>
          <div className="text-[20px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#ffa726]">
            {keyMetrics.problematicEventRatio || '0'}%
          </div>
          <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
            问题事件比例
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-[#3a3f47] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-[#2196F3] to-[#42a5f5] opacity-20 rounded-full transform translate-x-2 -translate-y-2"></div>
          <div className="text-[9px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] leading-tight">
            问题事件指删除或进行过优先级、任务类型和DDL修改的事件
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
          <div className="w-2 h-2 bg-[#ff6b6b] rounded-full mr-2"></div>
          问题事件时间分布
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="taskDeletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="categoryChange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="priorityChange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#45b7d1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#45b7d1" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="dueDateChange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#96ceb4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#96ceb4" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={{ stroke: '#ddd' }}
                tickLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '12px', 
                  border: '1px solid #3a3f47',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="taskDeletion" 
                stackId="events"
                fill="url(#taskDeletion)"
                name="任务删除"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="categoryChange" 
                stackId="events"
                fill="url(#categoryChange)"
                name="修改类型"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="priorityChange" 
                stackId="events"
                fill="url(#priorityChange)"
                name="修改优先级"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="dueDateChange" 
                stackId="events"
                fill="url(#dueDateChange)"
                name="修改截止时间"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
          <div className="w-2 h-2 bg-[#45b7d1] rounded-full mr-2"></div>
          任务类型受干扰情况
        </h3>
        <div className="space-y-3">
          {taskTypeStats.map((item, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  {item.taskType}
                </span>
                <span className="text-[12px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  {item.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#ff6b6b] to-[#ff8a80] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-[#666] mt-1 font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                受影响 {item.affectedCount}/{item.totalCount} 个任务
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 border border-[#3a3f47]">
        <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47] mb-4 flex items-center">
          <div className="w-2 h-2 bg-[#ffa726] rounded-full mr-2"></div>
          高频问题时段分析
        </h3>
        <div className="space-y-3">
          {highFrequencyTimeSlots.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#fff3e0] to-[#ffe0b2] rounded-lg border border-[#ffa726] border-opacity-20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#ffa726] rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    {item.timeSlot}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] text-[#ffa726] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  {item.count}次
                </div>
                <div className="text-[9px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                  问题频次
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#e3f2fd] to-[#f1f8e9] rounded-lg p-4 border border-[#3a3f47]">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-[#2196F3] rounded-full flex items-center justify-center mr-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <h3 className="text-[14px] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] text-[#3a3f47]">
            贤王的习惯优化建议
          </h3>
        </div>
        <div className="space-y-3">
          {keyMetrics.totalProblematicEvents === 0 ? (
            <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#4CAF50] border-opacity-30">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                    <strong>习惯状态良好：</strong>目前没有记录到问题事件，继续保持良好的任务执行习惯！
                  </div>
                  <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                    完成更多任务后，系统将为您分析具体的习惯模式和优化建议
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#2196F3] border-opacity-30">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#2196F3] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                      <strong>关键时段保护：</strong>
                      {highFrequencyTimeSlots.length > 0 && highFrequencyTimeSlots[0].count > 0 
                        ? `${highFrequencyTimeSlots[0].timeSlot}问题频次最高，建议加强此时段的专注保护`
                        : '建议为高风险时段设置专注模式和缓冲时间'
                      }
                    </div>
                    <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                      可在高风险时段前预留缓冲时间，减少临时任务冲击
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#ff6b6b] border-opacity-30">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                      <strong>任务规划建议：</strong>
                      {keyMetrics.problematicEventRatio > 30
                        ? `问题事件比例${keyMetrics.problematicEventRatio}%偏高，建议提前规划任务优先级和时间安排`
                        : keyMetrics.problematicEventRatio > 10
                          ? `问题事件比例${keyMetrics.problematicEventRatio}%，适度提升任务规划能力`
                          : '任务规划状态良好，继续保持'
                      }
                    </div>
                    <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                      {keyMetrics.problematicEventRatio > 30
                        ? '建议每日开始前花5-10分钟梳理任务优先级'
                        : '继续保持良好的任务规划习惯'
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#4CAF50] border-opacity-30">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-[12px] text-[#3a3f47] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] mb-1">
                      <strong>任务稳定性：</strong>
                      {selectedTimeframe === 'week' ? '本周' : '本月'}共创建{keyMetrics.totalTasksCreated}个任务，
                      其中{keyMetrics.totalProblematicEvents}个发生了变更
                    </div>
                    <div className="text-[10px] text-[#666] font-['ABeeZee:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif]">
                      减少任务变更有助于提升执行效率，建议创建任务时明确目标和时间安排
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
