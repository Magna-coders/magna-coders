import React, { useState } from 'react';
import { Trash2, CheckCheck, FileText, Download } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onDelete: () => void;
  isDarkMode?: boolean;
}

export default function MessageBubble({ message, onDelete, isDarkMode }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className={`flex items-end gap-3 max-w-[90%] group ${message.isMe ? 'ml-auto flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${message.isMe ? (isDarkMode ? 'bg-[#E50914] text-white' : 'bg-black text-white') : (isDarkMode ? 'bg-[#222] text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
        {message.avatar}
      </div>
      
      <div className={`flex flex-col gap-1 ${message.isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mx-1">
          <span className={`text-xs font-bold ${!message.isMe ? 'text-[#F4A261]' : isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{message.sender}</span>
          {showActions && message.isMe && (
            <button 
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        
        <div className={`p-4 rounded-2xl shadow-sm border ${
          message.isMe 
            ? 'bg-[#E50914] text-white rounded-tr-none border-[#E50914]' 
            : isDarkMode 
              ? 'bg-[#222] text-[#F9E4AD] rounded-tl-none border-[#E70008]/20' 
              : 'bg-black text-[#F4A261] rounded-tl-none border-[#F4A261]'
        }`}>
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed">{message.text}</p>
          )}
          
          {message.type === 'file' && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm font-bold truncate max-w-[150px]">{message.fileName}</p>
                <p className="text-xs opacity-70">{message.fileSize}</p>
              </div>
              <button className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2">
                <Download size={16} />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mx-1">
           <span className="text-[10px] text-gray-400 font-medium">{message.time}</span>
           {message.isMe && (
              <CheckCheck size={12} className={message.read ? "text-[#E50914]" : "text-gray-300"} />
           )}
        </div>
      </div>
    </div>
  )
}
