import React, { useState } from 'react';
import { Trash2, Check, CheckCheck, FileText, Download } from 'lucide-react';
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
      className={`flex items-end gap-2 md:gap-3 max-w-[85%] md:max-w-[90%] group ${message.isMe ? 'ml-auto flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold flex-shrink-0 ${message.isMe ? (isDarkMode ? 'bg-[#E50914] text-white' : 'bg-black text-white') : (isDarkMode ? 'bg-[#222] text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
        {message.avatar}
      </div>
      
      <div className={`flex flex-col gap-1 ${message.isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mx-1">
          <span className={`text-[10px] md:text-xs font-bold ${!message.isMe ? 'text-[#F4A261]' : isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{message.sender}</span>
          {(showActions || message.isMe) && (
            <button 
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
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
          
          {message.type === 'image' && (
            <div className="space-y-2">
              {message.text && message.text !== 'Sent an image' && (
                <p className="text-xs md:text-sm leading-relaxed">{message.text}</p>
              )}
              <img 
                src={message.imageUrl?.startsWith('http') ? message.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${message.imageUrl}`}
                alt="Shared image" 
                className="rounded-lg max-w-[200px] md:max-w-[300px] max-h-[250px] md:max-h-[400px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.imageUrl?.startsWith('http') ? message.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${message.imageUrl}`, '_blank')}
              />
            </div>
          )}
          
          {message.type === 'file' && (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-white/20 rounded-lg">
                <FileText size={20} className="md:size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-bold truncate max-w-[100px] md:max-w-[150px]">{message.fileName}</p>
                <p className="text-xs opacity-70">{message.fileSize}</p>
              </div>
              <a 
                href={(message.fileUrl || message.imageUrl)?.startsWith('http') ? (message.fileUrl || message.imageUrl) : `${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl || message.imageUrl}`}
                download={message.fileName}
                className="p-1 hover:bg-white/20 rounded-full transition-colors ml-1 md:ml-2"
                title="Download file"
              >
                <Download size={14} className="md:size-4" />
              </a>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mx-1">
           <span className="text-[9px] md:text-[10px] text-gray-400 font-medium">{message.time}</span>
           {message.isMe && (
              message.read ? (
                <CheckCheck size={10} className="md:size-3 text-[#E50914]" />
              ) : (
                <Check size={10} className="md:size-3 text-gray-300" />
              )
           )}
        </div>
      </div>
    </div>
  )
}
