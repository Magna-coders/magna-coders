import React from 'react';

interface ConversationItemProps {
  name: string;
  message: string;
  time: string;
  unread?: number;
  isTyping?: boolean;
  active: boolean;
  avatarColor: string;
  isDarkMode?: boolean;
  onClick: () => void;
}

export default function ConversationItem({ name, message, time, unread, isTyping, active, avatarColor, onClick, isDarkMode }: ConversationItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        active 
          ? isDarkMode ? 'bg-[#222] border border-[#E50914]/40' : 'bg-[#FDF8F5] border border-[#E50914]/10' 
          : isDarkMode ? 'hover:bg-[#1a1a1a] border border-transparent' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm overflow-hidden`}>
           {name.substring(0, 2).toUpperCase()}
        </div>
        {isTyping && (
           <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h4 className={`text-sm truncate ${
            active 
              ? isDarkMode ? 'font-bold text-[#F4A261]' : 'font-bold text-black' 
              : isDarkMode ? 'font-semibold text-[#F4A261]' : 'font-semibold text-gray-800'
          }`}>
            {name}
          </h4>
          <span className={`text-[10px] ${unread ? 'font-bold text-[#E50914]' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {time}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className={`text-xs truncate max-w-[80%] ${
            isTyping 
              ? 'text-[#2ECC71] font-medium' 
              : unread 
                ? isDarkMode ? 'text-[#F4A261] font-semibold' : 'text-black font-semibold' 
                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {message}
          </p>
          
          {unread && unread > 0 && (
            <div className="w-5 h-5 rounded-full bg-[#E50914] text-white flex items-center justify-center text-[10px] font-bold">
              {unread}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
