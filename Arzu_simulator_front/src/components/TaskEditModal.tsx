import React, { useState, useEffect } from 'react';
import { TaskTypeModal } from './TaskTypeModal';
import { DateTimeModal } from './DateTimeModal';

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

interface TaskEditModalProps {
  isOpen: boolean;
  task: TaskData | null;
  onClose: () => void;
  onUpdate: (taskId: string, updatedTask: Partial<TaskData>, changeReason: string) => void;
}

export function TaskEditModal({ isOpen, task, onClose, onUpdate }: TaskEditModalProps) {
  const [taskType, setTaskType] = useState('勤政');
  const [priority, setPriority] = useState('铜卡');
  const [dateTime, setDateTime] = useState<{ date: string; startTime: string } | undefined>(undefined);
  const [changeReason, setChangeReason] = useState('');
  const [isTaskTypeModalOpen, setIsTaskTypeModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);

  // Get priority color scheme (same as TaskCard)
  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case '金卡': return {
        cardBg: '#F7E9DC',
        tagBg: '#F2E2D2', 
        textColor: '#5B3A29',
        borderColor: '#D7BFAE'
      };
      case '银卡': return {
        cardBg: '#DCE8F7',
        tagBg: '#B8CAE9',
        textColor: '#3A3F47', 
        borderColor: '#AEB8D7'
      };
      case '铜卡': return {
        cardBg: '#BFC8A6',
        tagBg: '#BFC8A6',
        textColor: '#5B3A29',
        borderColor: '#A4B1A2'
      };
      case '石卡': return {
        cardBg: '#E0E0E0',
        tagBg: '#BEBEBE',
        textColor: '#3A3F47',
        borderColor: '#AEAEAE'
      };
      default: return {
        cardBg: '#E0E0E0',
        tagBg: '#BEBEBE', 
        textColor: '#3A3F47',
        borderColor: '#AEAEAE'
      };
    }
  };

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setTaskType(task.taskType);
      setPriority(task.priority);
      setDateTime(task.dateTime);
      setChangeReason('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!changeReason.trim()) {
      alert('请说明修改原因');
      return;
    }

    const updatedData: Partial<TaskData> = {};
    
    if (taskType !== task.taskType) {
      updatedData.taskType = taskType;
    }
    
    if (priority !== task.priority) {
      updatedData.priority = priority;
    }
    
    const hasDateTimeChanged = 
      (!task.dateTime && dateTime) ||
      (task.dateTime && !dateTime) ||
      (task.dateTime && dateTime && 
        (task.dateTime.date !== dateTime.date || task.dateTime.startTime !== dateTime.startTime));
    
    if (hasDateTimeChanged) {
      updatedData.dateTime = dateTime;
    }
    
    if (Object.keys(updatedData).length === 0) {
      alert('没有检测到任何修改');
      return;
    }

    onUpdate(task.id, updatedData, changeReason);
    onClose();
  };

  const handleClose = () => {
    setChangeReason('');
    onClose();
  };

  const handleTaskTypeSelect = (selectedTaskType: string) => {
    setTaskType(selectedTaskType);
    setIsTaskTypeModalOpen(false);
  };

  const handlePrioritySelect = (selectedPriority: string) => {
    setPriority(selectedPriority);
    setIsPriorityModalOpen(false);
  };

  const handleDateTimeSelect = (selectedDateTime: { date: string; startTime: string; endTime: string; reminder: string; repeat: string }) => {
    // 只保存日期和时间信息，忽略提醒和重复设置
    setDateTime({
      date: selectedDateTime.date,
      startTime: selectedDateTime.startTime
    });
    setIsDateTimeModalOpen(false);
  };

  const formatDateTime = (dt?: { date: string; startTime: string }) => {
    if (!dt) return '未设置';
    return `${dt.date} ${dt.startTime}`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        {/* Modal Content */}
        <div
          className="modal-mobile-optimized modal-safe-top modal-safe-bottom w-full max-w-md border border-[#3A3F47] bg-white overflow-y-auto"
          style={{
            borderRadius: '10px',
            boxShadow: 'none',
            padding: '24px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <h2 
              className="font-['ABeeZee:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-medium text-lg text-[#3A3F47]"
            >
              编辑任务
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Type Selection */}
            <div className="space-y-3">
              <label className="block font-medium text-[#3A3F47]">
                修改任务类型
              </label>
              <button
                type="button"
                onClick={() => setIsTaskTypeModalOpen(true)}
                className="w-full border border-[#3A3F47] text-left bg-white hover:bg-gray-50 transition-colors"
                style={{
                  fontSize: '14px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                  fontWeight: '500',
                  padding: '12px 16px'
                }}
              >
                {taskType}
              </button>
            </div>

            {/* Priority Selection */}
            <div className="space-y-3">
              <label className="block font-medium text-[#3A3F47]">
                修改任务优先级
              </label>
              <button
                type="button"
                onClick={() => setIsPriorityModalOpen(true)}
                className="w-full border border-[#3A3F47] text-left hover:opacity-80 transition-opacity"
                style={{
                  fontSize: '14px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                  fontWeight: '500',
                  padding: '12px 16px',
                  backgroundColor: getPriorityColors(priority).cardBg,
                  color: getPriorityColors(priority).textColor
                }}
              >
                {priority}
              </button>
            </div>

            {/* Date Time Selection */}
            <div className="space-y-3">
              <label className="block font-medium text-[#3A3F47]">
                修改截止时间
              </label>
              <button
                type="button"
                onClick={() => setIsDateTimeModalOpen(true)}
                className="w-full border border-[#3A3F47] text-left bg-white hover:bg-gray-50 transition-colors"
                style={{
                  fontSize: '14px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                  fontWeight: '500',
                  padding: '12px 16px'
                }}
              >
                {formatDateTime(dateTime)}
              </button>
            </div>

            {/* Change Reason */}
            <div className="space-y-3">
              <label className="block font-medium text-[#3A3F47]">
                修改原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="你可以修改，但需要告诉贤王发生了什么，反复制定计划又推翻它同样不会让人快乐，奈费勒希望你能制定合适的任务并完成他们，而不是下很多决心又放弃很多。"
                className="w-full border border-[#3A3F47] px-4 py-3 bg-[#f3f3f5] resize-vertical huawei-compatible-textarea"
                style={{
                  fontSize: '14px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                  minHeight: '144px',
                  fontWeight: '400',
                  lineHeight: '1.5'
                }}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 border border-[#3A3F47] bg-white text-[#3A3F47] hover:bg-gray-50 transition-colors"
                style={{
                  fontSize: '14px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                  fontWeight: '500',
                  padding: '12px 16px',
                  minHeight: '44px'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 border border-[#3A3F47] bg-black text-white hover:bg-gray-800 transition-colors"
                style={{
                  fontSize: '14px',
                  borderRadius: '6px',
                  boxShadow: 'none',
                  fontWeight: '500',
                  padding: '12px 16px',
                  minHeight: '44px'
                }}
              >
                保存修改
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Task Type Modal */}
      <TaskTypeModal
        isOpen={isTaskTypeModalOpen}
        onClose={() => setIsTaskTypeModalOpen(false)}
        onSelect={handleTaskTypeSelect}
        initialTaskType={taskType}
        isPriorityMode={false}
      />

      {/* Priority Modal */}
      <TaskTypeModal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        onSelect={handlePrioritySelect}
        initialPriority={priority}
        isPriorityMode={true}
      />

      {/* Date Time Modal */}
      <DateTimeModal
        isOpen={isDateTimeModalOpen}
        onClose={() => setIsDateTimeModalOpen(false)}
        onConfirm={handleDateTimeSelect}
      />
    </>
  );
}