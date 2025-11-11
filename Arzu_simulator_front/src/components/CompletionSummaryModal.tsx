import React, { useState } from 'react';

interface CompletionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (summary: string) => void;
  isLoading: boolean;
  taskTitle?: string;
}

export function CompletionSummaryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading,
  taskTitle 
}: CompletionSummaryModalProps) {
  const [summary, setSummary] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (summary.trim() === '') {
      alert('请填写工作总结');
      return;
    }
    onSubmit(summary.trim());
    setSummary('');
  };

  const handleClose = () => {
    setSummary('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          完成任务
        </h2>
        
        {taskTitle && (
          <p className="text-sm text-gray-600 mb-4">
            {taskTitle}
          </p>
        )}

        <p className="text-gray-700 mb-4">
          分享你的工作总结，记录完成这个任务的心得体会...
        </p>

        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="例如：完成了数据库迁移，解决了3个技术难点..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isLoading}
          autoFocus
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || summary.trim() === ''}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '提交中...' : '提交总结'}
          </button>
        </div>
      </div>
    </div>
  );
}
