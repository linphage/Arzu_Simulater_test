import React, { useState, useEffect } from 'react';

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

interface TaskDeleteModalProps {
  isOpen: boolean;
  task: TaskData | null;
  onClose: () => void;
  onConfirm: (taskId: string, deleteReason: string) => void;
}

export function TaskDeleteModal({ isOpen, task, onClose, onConfirm }: TaskDeleteModalProps) {
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDeleteReason('');
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deleteReason.trim()) {
      alert('请说明删除原因');
      return;
    }

    onConfirm(task.id, deleteReason);
    onClose();
  };

  const handleClose = () => {
    setDeleteReason('');
    onClose();
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
              删除任务
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delete Reason */}
            <div className="space-y-3">
              <label className="block font-medium text-[#3A3F47]">
                删除原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="你可以删除，但需要告诉贤王发生了什么，反复制定计划又推翻它同样不会让人快乐，奈费勒希望你能制定合适的任务并完成他们，而不是下很多决心又放弃很多。"
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
                删除
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}