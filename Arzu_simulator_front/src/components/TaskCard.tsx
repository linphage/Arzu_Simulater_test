import React from 'react';
import { Edit3 } from 'lucide-react';
import svgPaths from "../assets/svg/calendar-icons";
import imgDelete from "figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png";
import img20004721 from "figma:asset/b97483069f151bb18d9e3e16d09bdec9a832ba18.png";
import img20002101 from "figma:asset/a6c466edcfc15b1b3db48bdf6993661a98e84ddd.png";
import img20003731 from "figma:asset/77dfb21b6ae5b3e017b8309d5b6bc1907545c62e.png";

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

interface TaskCardProps {
  task: TaskData;
  onDelete?: (taskId: string) => void;
  onTaskClick?: (task: TaskData) => void;
  onEdit?: (task: TaskData) => void;
  onCompleteClick?: (task: TaskData) => void;
}

export function TaskCard({ task, onDelete, onTaskClick, onEdit, onCompleteClick }: TaskCardProps) {
  // Get priority color scheme
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

  // Get task type icon
  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case '勤政': return img20002101;
      case '恕己': return img20003731;
      case '爱人': return img20004721;
      default: return img20002101;
    }
  };

  const colors = getPriorityColors(task.priority);
  const taskTypeIcon = getTaskTypeIcon(task.taskType);
  


  // 已完成任务统一使用白色背景
  const getBackgroundColor = () => {
    if (task.isCompleted) {
      return '#ffffff'; // 已完成任务统一白色背景
    }
    return colors.cardBg;
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🎯 点击完成框:', { taskId: task.id, taskTitle: task.title, isCompleted: task.isCompleted });
    
    if (task.isCompleted) {
      console.log('⚠️ 任务已完成,忽略点击');
      return;
    }
    
    if (!onCompleteClick) {
      console.log('⚠️ onCompleteClick未定义');
      return;
    }
    
    console.log('✅ 触发完成模态框');
    onCompleteClick(task);
  };

  const handleCardClick = () => {
    if (onTaskClick && !task.isCompleted) {
      onTaskClick(task);
    }
  };

  return (
    <div className="relative size-full">
      {/* Main Card Container - matches Frame71349476 */}
      <div 
        className={`box-border content-stretch flex flex-row gap-4 items-center justify-start pl-[68px] pr-4 py-4 rounded-2xl relative transition-opacity ${task.isCompleted ? 'cursor-default opacity-75' : 'cursor-pointer hover:opacity-90'}`}
        style={{ backgroundColor: getBackgroundColor() }}
        onClick={handleCardClick}
      >
        <div
          aria-hidden="true"
          className="absolute border-2 border-[#000000] border-solid inset-0 pointer-events-none rounded-2xl"
        />
        
        {/* Task Type Icon - positioned in the left margin */}
        <div
          className="absolute bg-center bg-cover bg-no-repeat h-[48px] left-[12px] top-1/2 transform -translate-y-1/2 w-[42px]"
          data-name="Task Type Icon"
          style={{ backgroundImage: `url('${taskTypeIcon}')` }}
        />
        
        {/* Checkbox */}
        <div
          className={`box-border content-stretch flex flex-row items-center justify-center p-[2px] relative rounded-lg shrink-0 size-6 ${!task.isCompleted ? 'cursor-pointer hover:bg-gray-100 transition-colors' : 'cursor-default'}`}
          data-name="Border"
          onClick={handleCompleteClick}
        >
          <div
            aria-hidden="true"
            className="absolute border-2 border-solid inset-0 pointer-events-none rounded-lg"
            style={{ 
              borderColor: task.isCompleted ? '#22c55e' : colors.borderColor,
              backgroundColor: task.isCompleted ? '#ffffff' : 'transparent'
            }}
          />
          <div className="relative shrink-0 size-4" data-name="SVG">
            {task.isCompleted ? (
              <svg 
                className="block size-full text-green-500" 
                fill="currentColor" 
                preserveAspectRatio="none" 
                viewBox="0 0 16 16"
              >
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            ) : (
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <g id="SVG">
                  <g id="Vector"></g>
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Main Content Area - matches Frame71349475 */}
        <div className="flex flex-col w-[249px] relative">
          
          {/* Top Row - Title, Action Button and Delete Button */}
          <div className="flex items-start justify-between mb-1">
            {/* Task Title */}
            <div
              className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[14px] text-left flex-1 mr-2"
              style={{ 
                fontVariationSettings: "'wght' 400",
                color: colors.textColor 
              }}
            >
              <p className="block leading-[normal]">{task.title}</p>
            </div>
            
            {/* Right side buttons container */}
            <div className="flex items-start gap-2 flex-shrink-0">
              {/* Action Button - "奈费勒救我" - 只在未完成任务显示 */}
              {!task.isCompleted && (
                <div 
                  className="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1.5 py-1 relative rounded-md shrink-0"
                  style={{ backgroundColor: colors.tagBg }}
                >
                  <div
                    className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[12px] text-left text-nowrap"
                    style={{ 
                      fontVariationSettings: "'wght' 400",
                      color: colors.textColor 
                    }}
                  >
                    <p className="block leading-[normal] whitespace-pre">奈费勒救我！！</p>
                  </div>
                </div>
              )}
              
              {/* Delete Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when deleting
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
          
          {/* Bottom Row - Date Time, Priority Tag and Edit Button */}
          <div className="flex items-center justify-between">
            {/* Left side - Date Time and Priority */}
            <div className="flex items-center gap-[7px]">
              {/* Date Time Container */}
              {task.dateTime && (
                <div
                  className="box-border content-stretch flex flex-row items-end justify-start pb-[1.5px] pt-0 px-0 relative shrink-0"
                  data-name="Container"
                >
                  {/* Time Text */}
                  <div 
                    className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-left"
                    style={{ color: colors.textColor }}
                  >
                    <p className="block leading-[normal]">{task.dateTime.date} {task.dateTime.startTime}</p>
                  </div>
                </div>
              )}
              
              {/* Priority Tag - matches Frame10 */}
              <div 
                className="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1.5 py-1 relative rounded-md shrink-0"
                style={{ backgroundColor: colors.tagBg }}
              >
                <div
                  className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[12px] text-left text-nowrap"
                  style={{ 
                    fontVariationSettings: "'wght' 400",
                    color: colors.textColor 
                  }}
                >
                  <p className="block leading-[normal] whitespace-pre">{task.priority}</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Edit Icon Button - 只在未完成任务显示 */}
            {!task.isCompleted && onEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when editing
                  handleEdit();
                }}
                className="hover:scale-110 transition-transform flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '15px',
                  padding: '0'
                }}
              >
                <Edit3 
                  size={14} 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  style={{ 
                    strokeWidth: 1.5,
                    color: colors.textColor 
                  }}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}