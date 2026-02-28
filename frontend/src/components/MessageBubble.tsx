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
          
          {message.type === 'image' && (
            <div className="space-y-2">
              {message.text && message.text !== 'Sent an image' && (
                <p className="text-sm leading-relaxed">{message.text}</p>
              )}
              <img 
                src={message.imageUrl?.startsWith('http') ? message.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${message.imageUrl}`}
                alt="Shared image" 
                className="rounded-lg max-w-[300px] max-h-[400px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.imageUrl?.startsWith('http') ? message.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${message.imageUrl}`, '_blank')}
              />
            </div>
          )}
          
          {message.type === 'file' && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate max-w-[150px]">{message.fileName}</p>
                <p className="text-xs opacity-70">{message.fileSize}</p>
              </div>
              <a 
                href={(message.fileUrl || message.imageUrl)?.startsWith('http') ? (message.fileUrl || message.imageUrl) : `${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl || message.imageUrl}`}
                download={message.fileName}
                className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2"
                title="Download file"
              >
                <Download size={16} />
              </a>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mx-1">
           <span className="text-[10px] text-gray-400 font-medium">{message.time}</span>
           {message.isMe && (
              message.read ? (
                <CheckCheck size={12} className="text-[#E50914]" />
              ) : (
                <Check size={12} className="text-gray-300" />
              )
           )}
        </div>
      </div>
    </div>
  )
}
