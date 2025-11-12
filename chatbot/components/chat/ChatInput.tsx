import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (按 Enter 发送，Shift+Enter 换行)"
            className="w-full px-4 py-3 pr-4 bg-[#FAFAFA] border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#E7874C] focus:border-transparent text-[#3A3F47] placeholder-gray-400 text-sm transition-all"
            rows="1"
            style={{ maxHeight: "120px" }}
          />
        </div>
        
        <Button
          type="submit"
          disabled={!input.trim()}
          className="h-11 px-5 bg-[#E7874C] hover:bg-[#d67a42] text-white rounded-2xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      
      <p className="text-xs text-gray-400 mt-2 text-center">
        AI助手可能会出错，请核对重要信息
      </p>
    </div>
  );
}