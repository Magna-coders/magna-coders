import React from 'react';
import { Smile, Paperclip, Mic, Send, Coins } from 'lucide-react';

interface ChatInputProps {
  isDarkMode: boolean;
  messageInput: string;
  setMessageInput: (value: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onAttachClick: () => void;
  onSendCoinsClick: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ChatInput({
  isDarkMode,
  messageInput,
  setMessageInput,
  onSendMessage,
  onAttachClick,
  onSendCoinsClick,
  onFileSelect,
  fileInputRef
}: ChatInputProps) {
  return (
    <div className={`p-4 pb-24 md:pb-4 border-t ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <form 
        onSubmit={onSendMessage}
        className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#222] border-gray-700 focus-within:border-[#E50914]' : 'bg-gray-50 border-gray-200 focus-within:border-[#E50914]'}`}
      >
        <button type="button" className={`p-2 transition-colors ${isDarkMode ? 'text-[#F4A261] hover:text-[#E50914]' : 'text-gray-400 hover:text-[#E50914]'}`}>
          <Smile size={24} />
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={onFileSelect} 
        />
        <button 
          type="button" 
          className={`p-2 transition-colors ${isDarkMode ? 'text-[#F4A261] hover:text-[#E50914]' : 'text-gray-400 hover:text-[#E50914]'}`}
          onClick={onAttachClick}
        >
          <Paperclip size={24} />
        </button>
        
        <button 
          type="button" 
          className={`p-2 transition-colors ${isDarkMode ? 'text-[#F4A261] hover:text-[#E50914]' : 'text-gray-400 hover:text-[#E50914]'}`}
          onClick={onSendCoinsClick}
          title="Send Coins"
        >
          <Coins size={24} />
        </button>
        
        <input 
          type="text" 
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..." 
          className={`flex-1 bg-transparent border-none focus:ring-0 text-sm focus:outline-none ${isDarkMode ? 'text-[#F4A261] placeholder-[#F4A261]' : 'text-black placeholder-gray-400'}`}
        />

        <button type="button" className={`p-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-[#E50914]' : 'text-gray-400 hover:text-[#E50914]'}`}>
          <Mic size={24} />
        </button>
        <button 
          type="submit" 
          disabled={!messageInput.trim()}
          className="p-2 bg-[#E50914] text-white rounded-xl hover:bg-[#cc0812] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
