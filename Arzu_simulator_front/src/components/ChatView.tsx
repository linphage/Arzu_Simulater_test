
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import MessageBubble from "./chat/MessageBubble";
import ChatInput from "./chat/ChatInput";
import QuickReplyButtons from "./chat/QuickReplyButtons";
import TypingIndicator from "./chat/TypingIndicator";

const WELCOME_MESSAGES = [
  {
    id: "welcome-1",
    role: "assistant",
    content: "爱卿，难得啊，今天的议会散会这么早吗？你想要汇报工作，还是遇到了什么困难？还是说......果然啊。",
    timestamp: new Date().toISOString()
  },
  {
    id: "welcome-2",
    role: "assistant",
    content: "不管你想要说什么，先喝一杯薄荷茶，理清一下思路吧。",
    timestamp: new Date().toISOString()
  }
];

export function ChatView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Show welcome messages with delay
      setTimeout(() => {
        setMessages([WELCOME_MESSAGES[0]]);
        setTimeout(() => {
          setMessages([WELCOME_MESSAGES[0], WELCOME_MESSAGES[1]]);
        }, 1000);
      }, 500);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content) => {
    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      status: "delivered"
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI typing
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "我已经收到您的消息，正在为您处理。请稍等片刻......",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (action) => {
    let content = "";
    switch (action) {
      case "task-breakdown":
        content = "[Nefertor, Save Me!] 请帮我分解这个任务";
        break;
      case "praise":
        content = "[Praise Me, Meow!] 快来夸夸我吧！";
        break;
      case "work-analysis":
        content = "[Speaking of Work, Cough...] 帮我分析一下工作情况";
        break;
      default:
        return;
    }
    handleSendMessage(content);
  };

  return (
    <div className="mobile-fullscreen mobile-app-container">
      {/* 全屏背景容器 */}
      <div 
        className="absolute inset-0 bg-[#354827] w-full h-full" 
        data-name="全屏背景"
        style={{
          width: '100vw',
          height: '100dvh',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* 主应用容器 */}
      <div 
        className="responsive-container bg-[#354827] relative" 
        data-name="聊天界面" 
        style={{ 
          height: '100dvh',
          minHeight: '100dvh'
        }}
      >
        {/* 浅色背景区域 */}
        <div className="absolute inset-0 bg-[#FAFAFA] rounded-b-[28px] border-[3px] border-[#3a3f47] border-b-0 z-0" style={{ bottom: '0px' }} />
        
        {/* 头部返回按钮 */}
        <div className="relative z-20 px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center text-[#3a3f47] hover:opacity-70 transition-opacity"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: "'ABeeZee', 'Noto Sans SC', 'Noto Sans JP', sans-serif"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            返回
          </button>
        </div>

        {/* 聊天内容区域 */}
        <div className="relative z-10 flex flex-col" style={{ height: 'calc(100dvh - 60px)' }}>
          {/* Chat Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
          >
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                showTimestamp={index === 0 || index % 5 === 0}
              />
            ))}
            
            {isTyping && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Buttons */}
          <QuickReplyButtons onQuickReply={handleQuickReply} />

          {/* Input Area */}
          <ChatInput onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}