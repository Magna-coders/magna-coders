'use client';

import React from 'react';
import { Plus, Image as ImageIcon, Mic, Send } from 'lucide-react';

interface MagnaChatInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSendMessage: () => void;
  isDarkMode: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  className?: string;
}

export default function MagnaChatInput({
  searchQuery,
  setSearchQuery,
  handleSendMessage,
  isDarkMode,
  inputRef,
  className = ''
}: MagnaChatInputProps) {
  return (
    <div className={`${className} relative flex items-end rounded-[28px] px-4 py-2 shadow-sm transition-colors ${isDarkMode ? 'bg-[#111] border border-[#333]' : 'bg-[#F0F4F9] border-transparent hover:border-gray-200'}`}>
      <button className={`p-2 rounded-full transition-colors mr-2 flex-shrink-0 mb-1 ${isDarkMode ? 'hover:bg-[#222] text-[#F4A261]' : 'hover:bg-gray-200 text-[#E50914]'}`}>
         <Plus size={24} />
      </button>
      <textarea 
        ref={inputRef}
        placeholder="Ask Magna AI" 
        className={`flex-1 bg-transparent border-none focus:outline-none text-base min-w-0 resize-none py-3 overflow-hidden ${isDarkMode ? 'text-gray-200 placeholder-[#F4A261]' : 'text-gray-700 placeholder-[#E50914]'}`}
        rows={1}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      />
      <div className="flex items-center gap-2 flex-shrink-0 mb-1">
         <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-[#F4A261]' : 'hover:bg-gray-200 text-[#E50914]'}`}>
            <ImageIcon size={20} />
         </button>
         <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-[#F4A261]' : 'hover:bg-gray-200 text-[#E50914]'}`}>
            <Mic size={20} />
         </button>
         <button 
            onClick={handleSendMessage}
            className="p-2 rounded-full bg-[#E50914] text-white hover:bg-[#b80710] transition-colors"
         >
            <Send size={18} />
         </button>
      </div>
    </div>
  );
}
