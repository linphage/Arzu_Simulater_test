import React from 'react';
import { motion } from 'motion/react';

interface SimpleToggleProps {
  isRight: boolean;
  onToggle: (isRight: boolean) => void;
}

export function SimpleToggle({ isRight, onToggle }: SimpleToggleProps) {
  return (
    <div 
      className="relative w-16 bg-[#ddf0ff] rounded-full border-2 border-[#3a3f47] cursor-pointer" 
      style={{ height: '22px' }}
      onClick={() => onToggle(!isRight)}
    >
      {/* Sliding Circle */}
      <motion.div
        className="absolute bg-[#6092e2] rounded-full shadow-md"
        style={{ 
          top: '2px',
          width: '17px',
          height: '17px'
        }}
        initial={false}
        animate={{
          left: isRight ? 'calc(100% - 21px)' : '2px'
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      />
    </div>
  );
}