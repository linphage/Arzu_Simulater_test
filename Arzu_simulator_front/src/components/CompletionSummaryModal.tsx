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
    onSubmit(summary.trim());
    setSummary('');
  };

  const handleClose = () => {
    setSummary('');
    onClose();
  };

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
            恭喜，阿尔图，我当然会庆祝你的完成——但我相信工作一定没有难到让你嘤嘤嘤地挂在我身上的程度！跟我说说你工作时细微的烦躁来源吧，下次工作时也许可以给你一些指导。
          </p>
        </div>
        
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
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
          disabled={isLoading}
          autoFocus
        />
        
        <div className="flex justify-center mt-4">
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="unified-button border-[#3A3F47] text-white bg-[#3A3F47] hover:bg-[#2a2f35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              border: '1px solid #3A3F47',
              padding: '12px 16px',
              boxShadow: 'none'
            }}
          >
            {isLoading ? '提交中...' : '提交总结'}
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
      </div>
    </div>
  );
}
