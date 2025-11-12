import React from "react";
import { User, Bot, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

export default function MessageBubble({ message, showTimestamp = false }) {
  const isUser = message.role === "user";
  
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), "HH:mm");
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in slide-in-from-bottom-2 duration-300`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
        isUser 
          ? "bg-gradient-to-br from-blue-400 to-blue-500" 
          : "bg-gradient-to-br from-[#D5DECA] to-[#C5CEB8]"
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-[#3A3F47]" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%]`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? "bg-[#DDF0FF] rounded-tr-sm" 
              : "bg-[#D5DECA] rounded-tl-sm"
          }`}
        >
          <p className="text-[#3A3F47] text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Timestamp and Status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {showTimestamp && (
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          )}
          {isUser && message.status && (
            <span className="text-gray-400">
              {message.status === "delivered" && <CheckCheck className="w-3 h-3" />}
              {message.status === "sent" && <Check className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}