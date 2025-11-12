import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Briefcase } from "lucide-react";

export default function QuickReplyButtons({ onQuickReply }) {
  const quickReplies = [
    {
      id: "task-breakdown",
      label: "Nefertor, Save Me!",
      icon: Sparkles,
      color: "from-purple-400 to-purple-500"
    },
    {
      id: "praise",
      label: "Praise Me, Meow!",
      icon: Heart,
      color: "from-pink-400 to-rose-400"
    },
    {
      id: "work-analysis",
      label: "Speaking of Work, Cough...",
      icon: Briefcase,
      color: "from-blue-400 to-cyan-400"
    }
  ];

  return (
    <div className="bg-white border-t border-gray-100 px-4 py-3">
      <div 
        className="flex items-center gap-2 overflow-x-auto pb-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {quickReplies.map((reply) => {
          const Icon = reply.icon;
          return (
            <Button
              key={reply.id}
              onClick={() => onQuickReply(reply.id)}
              variant="outline"
              className="flex-shrink-0 h-9 px-4 rounded-full border-2 border-gray-200 hover:border-[#E7874C] bg-white hover:bg-gradient-to-r hover:from-[#E7874C]/10 hover:to-[#FBED9D]/10 text-[#3A3F47] text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {reply.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}