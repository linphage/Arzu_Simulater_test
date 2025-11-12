import React from "react";
import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in duration-300">
      {/* Avatar */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#D5DECA] to-[#C5CEB8] flex items-center justify-center shadow-sm">
        <Bot className="w-5 h-5 text-[#3A3F47]" />
      </div>

      {/* Typing Animation */}
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#D5DECA] shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#3A3F47] animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-2 h-2 rounded-full bg-[#3A3F47] animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2 h-2 rounded-full bg-[#3A3F47] animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    </div>
  );
}