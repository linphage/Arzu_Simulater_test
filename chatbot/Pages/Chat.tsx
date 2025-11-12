
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import ChatInput from "../components/chat/ChatInput";
import QuickReplyButtons from "../components/chat/QuickReplyButtons";
import TypingIndicator from "../components/chat/TypingIndicator";

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

export default function Chat() {
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
    <div className="flex flex-col h-screen bg-[#FAFAFA]">
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
  );
}