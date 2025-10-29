import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DateTimeModal } from './DateTimeModal';
import { TaskTypeModal } from './TaskTypeModal';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: { title: string; content: string; dateTime?: any; taskType?: string; priority?: string }) => void;
}

export function TaskCreationModal({ isOpen, onClose, onSubmit }: TaskCreationModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [isTaskTypeModalOpen, setIsTaskTypeModalOpen] = useState(false);
  const [dateTimeSettings, setDateTimeSettings] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskTypeSettings, setTaskTypeSettings] = useState({ taskType: '勤政', priority: '铜卡' });

  const handleSubmit = async () => {
    if (title.trim() && content.trim() && dateTimeSettings) {
      setIsSubmitting(true);
      try {
        onSubmit({ 
          title: title.trim(), 
          content: content.trim(),
          dateTime: dateTimeSettings,
          taskType: taskTypeSettings.taskType,
          priority: taskTypeSettings.priority
        });
        
        setTitle('');
        setContent('');
        setDateTimeSettings(null);
        setTaskTypeSettings({ taskType: '勤政', priority: '铜卡' });
      } catch (error) {
        console.error('创建任务失败:', error);
        alert(`创建任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setDateTimeSettings(null);
    setTaskTypeSettings({ taskType: '勤政', priority: '铜卡' });
    onClose();
  };

  const handleOpenDateTime = () => {
    setIsDateTimeModalOpen(true);
  };

  const handleCloseDateTimeModal = () => {
    setIsDateTimeModalOpen(false);
  };

  const handleConfirmDateTime = (dateTime: any) => {
    setDateTimeSettings(dateTime);
    setIsDateTimeModalOpen(false);
  };

  const handleOpenTaskType = () => {
    setIsTaskTypeModalOpen(true);
  };

  const handleCloseTaskTypeModal = () => {
    setIsTaskTypeModalOpen(false);
  };

  const handleConfirmTaskType = (settings: { taskType: string; priority: string }) => {
    setTaskTypeSettings(settings);
    setIsTaskTypeModalOpen(false);
  };

  // Get task type color mapping
  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case '勤政': return { bg: '#f7e9dc', text: '#5b3a29' };
      case '恕己': return { bg: '#dce8f7', text: '#3a3f47' };
      case '爱人': return { bg: '#fbd5f2', text: '#5b2948' };
      default: return { bg: '#f7e9dc', text: '#5b3a29' };
    }
  };

  // Get priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '金卡': return { bg: '#f2e2d2', text: '#6b4c3b' };
      case '银卡': return { bg: '#b8cae9', text: '#3a3f47' };
      case '铜卡': return { bg: '#bfc8a6', text: '#5b3a29' };
      case '石卡': return { bg: '#bebebe', text: '#3a3f47' };
      default: return { bg: '#bfc8a6', text: '#5b3a29' };
    }
  };

  const taskTypeColor = getTaskTypeColor(taskTypeSettings.taskType);
  const priorityColor = getPriorityColor(taskTypeSettings.priority);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center max-w-md mx-auto p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-[#3a3f47] bg-opacity-40"
          onClick={handleClose}
        />
        
        {/* Modal Content */}
        <div className={`relative w-full max-h-[90vh] bg-white rounded-[28px] shadow-lg transform transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          {/* Black border */}
          <div
            aria-hidden="true"
            className="absolute border-[3px] border-[#3a3f47] border-solid inset-0 pointer-events-none rounded-[28px]"
          />
          
          {/* Header - 确保有足够的顶部间距 */}
          <div className="flex items-center justify-between px-6 pb-4" style={{ paddingTop: 'max(32px, env(safe-area-inset-top, 32px))' }}>
            <button 
              onClick={handleClose}
              className="flex items-center justify-center w-10 h-10 text-[#3a3f47] hover:bg-[#3a3f47] hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 
              className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[18px] text-[#3a3f47]"
              style={{ fontVariationSettings: "'wght' 400" }}
            >
              新建任务
            </h2>
            <button 
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || !dateTimeSettings || isSubmitting}
              className="bg-[#3a3f47] border-2 border-[#3a3f47] text-[#ddf0ff] px-6 py-2 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a4f57] transition-colors font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px]"
              style={{ fontVariationSettings: "'wght' 400" }}
            >
              {isSubmitting ? '创建中...' : '创建'}
            </button>
          </div>

          {/* Form Content - 添加滚动区域 */}
          <div className="px-6 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Task Title Input */}
            <div className="relative">
              <div className="bg-white rounded-2xl border-2 border-[#3a3f47] overflow-hidden">
                <input
                  type="text"
                  placeholder="贤王提示，我需要一个标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-4 pr-16 bg-transparent border-none outline-none placeholder-[#91a67c] text-[#3a3f47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] huawei-compatible-textarea"
                  style={{ 
                    fontVariationSettings: "'wght' 400",
                    WebkitTextFillColor: '#3a3f47',
                    WebkitAppearance: 'none'
                  }}
                  maxLength={12}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-[#91a67c] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px]" style={{ fontVariationSettings: "'wght' 400" }}>
                    {title.length}/12
                  </span>
                </div>
              </div>
            </div>

            {/* Task Content Input */}
            <div className="relative">
              <div className="bg-white rounded-2xl border-2 border-[#3a3f47] overflow-hidden">
                <textarea
                  placeholder="我需要写一个简洁的标题和清晰的任务提示，这样我不知道怎么干活的时候，奈费勒就可以帮我。

但是！他只是在图书馆看书而已啊！

到底什么时候会来帮我做任务拆解啊！奈费勒救救我！！不要让议长一个人拉磨——"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 pr-16 pb-8 bg-transparent border-none outline-none placeholder-[#91a67c] text-[#3a3f47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] resize-none huawei-compatible-textarea"
                  style={{ 
                    fontVariationSettings: "'wght' 400",
                    WebkitTextFillColor: '#3a3f47',
                    WebkitAppearance: 'none'
                  }}
                  maxLength={200}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <div className="absolute right-4 bottom-3">
                  <span className="text-[#91a67c] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px]" style={{ fontVariationSettings: "'wght' 400" }}>
                    {content.length}/200
                  </span>
                </div>
              </div>
            </div>

            {/* Date Time Settings Display */}
            {dateTimeSettings ? (
              <div className="bg-[#DDF0FF] rounded-lg border-2 border-[#3a3f47] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-[#3a3f47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px]"
                      style={{ fontVariationSettings: "'wght' 400" }}
                    >
                      📅 {dateTimeSettings.date}
                    </p>
                    <p 
                      className="text-[#91a67c] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] mt-1"
                      style={{ fontVariationSettings: "'wght' 400" }}
                    >
                      {dateTimeSettings.startTime}
                    </p>
                  </div>
                  <button 
                    onClick={handleOpenDateTime}
                    className="text-[#6092e2] hover:text-[#4a7bc8] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#ffeaed] rounded-lg border-2 border-[#f56565] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-[#f56565] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px]"
                      style={{ fontVariationSettings: "'wght' 400" }}
                    >
                      ⚠️ 必须设置DDL时间
                    </p>
                    <p 
                      className="text-[#c53030] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] mt-1"
                      style={{ fontVariationSettings: "'wght' 400" }}
                    >
                      点击右侧按钮设置任务截止时间
                    </p>
                  </div>
                  <button 
                    onClick={handleOpenDateTime}
                    className="text-[#f56565] hover:text-[#c53030] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Task Type and Priority Settings Display */}
            <div className="bg-[#DDF0FF] rounded-lg border-2 border-[#3a3f47] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="px-3 py-1 rounded-md border border-[#3a3f47]"
                      style={{ 
                        backgroundColor: taskTypeColor.bg,
                        color: taskTypeColor.text
                      }}
                    >
                      <span 
                        className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px]"
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {taskTypeSettings.taskType}
                      </span>
                    </div>
                    <div 
                      className="px-3 py-1 rounded-md border border-[#3a3f47]"
                      style={{ 
                        backgroundColor: priorityColor.bg,
                        color: priorityColor.text
                      }}
                    >
                      <span 
                        className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px]"
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {taskTypeSettings.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleOpenTaskType}
                  className="text-[#6092e2] hover:text-[#4a7bc8] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>



            {/* Tips Section */}
            <div className="bg-[#DDF0FF] rounded-lg border-2 border-[#3a3f47] p-3 mt-4">
              <p 
                className="text-[#3a3f47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] leading-relaxed"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                💡 小贴士：必须设置DDL时间才能创建任务！请点击上方的编辑按钮设置截止时间。
              </p>
            </div>
          </div>

          {/* Bottom Safe Area - 适配安全区域 */}
          <div className="bg-white rounded-b-[28px] flex-shrink-0" style={{ height: 'max(32px, env(safe-area-inset-bottom, 32px))' }} />
        </div>
      </div>

      {/* Date Time Modal */}
      <DateTimeModal
        isOpen={isDateTimeModalOpen}
        onClose={handleCloseDateTimeModal}
        onConfirm={handleConfirmDateTime}
      />

      {/* Task Type Modal */}
      <TaskTypeModal
        isOpen={isTaskTypeModalOpen}
        onClose={handleCloseTaskTypeModal}
        onConfirm={handleConfirmTaskType}
        initialTaskType={taskTypeSettings.taskType}
        initialPriority={taskTypeSettings.priority}
      />
    </>
  );
}