import React, { useState, useEffect } from 'react';
import { X, Check, Tag, Award } from 'lucide-react';

interface TaskTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (settings: { taskType: string; priority: string }) => void;
  onSelect?: (priority: string) => void;
  initialTaskType?: string;
  initialPriority?: string;
  isPriorityMode?: boolean;
}

export function TaskTypeModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  onSelect, 
  initialTaskType = '勤政',
  initialPriority = '铜卡',
  isPriorityMode = false
}: TaskTypeModalProps) {
  const [selectedTaskType, setSelectedTaskType] = useState(initialTaskType);
  const [selectedPriority, setSelectedPriority] = useState(initialPriority);

  useEffect(() => {
    if (isOpen) {
      setSelectedTaskType(initialTaskType);
      setSelectedPriority(initialPriority);
    }
  }, [isOpen, initialTaskType, initialPriority]);

  const taskTypes = [
    {
      id: '勤政',
      name: '勤政',
      description: '学习与工作任务',
      textColor: '#3a3f47'
    },
    {
      id: '恕己',
      name: '恕己', 
      description: '自我照顾，休息和娱乐',
      textColor: '#3a3f47'
    },
    {
      id: '爱人',
      name: '爱人',
      description: '社交任务，和家人相处',
      textColor: '#3a3f47'
    }
  ];

  const priorities = [
    {
      id: '金卡',
      name: '金卡',
      description: '紧急且重要',
      selectedColor: '#FFD700', // 金色
      textColor: '#3a3f47',
      icon: '🥇'
    },
    {
      id: '银卡',
      name: '银卡', 
      description: '紧急不重要',
      selectedColor: '#DDF0FF', // 浅蓝色
      textColor: '#3a3f47',
      icon: '🥈'
    },
    {
      id: '铜卡',
      name: '铜卡',
      description: '重要不紧急',
      selectedColor: '#BFC8A6', // 橄榄绿色
      textColor: '#3a3f47',
      icon: '🥉'
    },
    {
      id: '石卡',
      name: '石卡',
      description: '不紧急不重要',
      selectedColor: '#A9A9A9', // 灰色
      textColor: '#3a3f47',
      icon: '🪨'
    }
  ];

  const handleConfirm = () => {
    if (onSelect) {
      if (isPriorityMode) {
        onSelect(selectedPriority);
      } else {
        onSelect(selectedTaskType);
      }
    } else if (onConfirm) {
      onConfirm({
        taskType: selectedTaskType,
        priority: selectedPriority
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center max-w-md mx-auto p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#3a3f47] bg-opacity-40"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-h-[85vh] bg-white rounded-[28px] shadow-lg transform transition-transform duration-300 ease-out ${
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
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 text-[#3a3f47] hover:bg-[#f0f0f0] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 
            className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[18px] text-[#3a3f47]"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            任务分类
          </h2>
          <button 
            onClick={handleConfirm}
            className="flex items-center justify-center w-10 h-10 text-[#6092e2] hover:bg-[#f0f0f0] rounded-lg transition-colors"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area - 优化滚动区域 */}
        <div className="px-6 pb-6 space-y-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          
          {/* Task Type Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Tag className="w-5 h-5 text-[#91a67c]" />
              <h3 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                任务类型
              </h3>
            </div>

            <div className="space-y-3">
              {taskTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedTaskType(type.id)}
                  className={`w-full p-4 rounded-lg border-2 border-[#3a3f47] transition-colors ${
                    selectedTaskType === type.id 
                      ? 'bg-[#6092e2] text-white border-[#6092e2]' 
                      : 'bg-white hover:bg-[#ddf0ff]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 
                        className={`font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] ${
                          selectedTaskType === type.id ? 'text-white' : 'text-[#3a3f47]'
                        }`}
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {type.name}
                      </h4>
                      <p 
                        className={`font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] mt-1 ${
                          selectedTaskType === type.id ? 'text-white opacity-80' : 'text-[#91a67c]'
                        }`}
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {type.description}
                      </p>
                    </div>
                    {selectedTaskType === type.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Section */}
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-5 h-5 text-[#91a67c]" />
              <h3 
                className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[16px] text-[#3a3f47]"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                优先级设置
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {priorities.map((priority) => (
                <button
                  key={priority.id}
                  onClick={() => setSelectedPriority(priority.id)}
                  className={`p-4 rounded-lg border-2 border-[#3a3f47] transition-colors ${
                    selectedPriority === priority.id 
                      ? '' 
                      : 'bg-white hover:bg-[#ddf0ff]'
                  }`}
                  style={{ 
                    backgroundColor: selectedPriority === priority.id ? priority.selectedColor : 'white'
                  }}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="text-2xl">{priority.icon}</span>
                    <div>
                      <h4 
                        className={`font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[14px] text-[#3a3f47]`}
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {priority.name}
                      </h4>
                      <p 
                        className={`font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[10px] mt-1 text-[#91a67c]`}
                        style={{ fontVariationSettings: "'wght' 400" }}
                      >
                        {priority.description}
                      </p>
                    </div>
                    {selectedPriority === priority.id && (
                      <Check className="w-4 h-4 text-[#3a3f47]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-[#DDF0FF] rounded-lg border-2 border-[#3a3f47] p-4">
            <p 
              className="font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] text-[12px] text-[#3a3f47] leading-relaxed"
              style={{ fontVariationSettings: "'wght' 400" }}
            >
              哈哈，奈费勒！别再害怕苏丹卡了，世间只剩贤王卡——等会卧槽，贤王卡是用来给我拉磨计数的吗？？？
            </p>
          </div>
        </div>

        {/* Bottom Safe Area - 适配安全区域 */}
        <div className="bg-white rounded-b-[28px]" style={{ height: 'max(32px, env(safe-area-inset-bottom, 32px))' }} />
      </div>
    </div>
  );
}