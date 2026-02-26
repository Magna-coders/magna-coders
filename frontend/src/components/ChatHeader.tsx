import React, { useState } from 'react';
import { ChevronLeft, Video, Phone, MoreHorizontal, Archive, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  selectedChat: {
    id: string;
    name: string;
    avatarColor: string;
    isTyping: boolean;
    isGroup: boolean;
    archived: boolean;
  };
  isDarkMode: boolean;
  onBack: () => void;
  onOpenGroupInfo: () => void;
  onOpenContactInfo: () => void;
  onArchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export default function ChatHeader({
  selectedChat,
  isDarkMode,
  onBack,
  onOpenGroupInfo,
  onOpenContactInfo,
  onArchiveChat,
  onDeleteChat
}: ChatHeaderProps) {
  const [showChatOptions, setShowChatOptions] = useState(false);

  return (
    <div className={`px-3 py-2 md:px-6 md:py-4 border-b flex items-center justify-between shadow-sm z-10 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <div 
        className="flex items-center gap-2 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => {
          if (selectedChat.isGroup) {
            onOpenGroupInfo();
          } else {
            onOpenContactInfo();
          }
        }}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }} 
          className="md:hidden text-gray-500"
        >
            <ChevronLeft size={24} />
        </button>
        
        <div className="relative">
          <div className={`w-10 h-10 rounded-full ${selectedChat.avatarColor} flex items-center justify-center font-bold text-sm`}>
            {selectedChat.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full"></div>
        </div>
        <div className="min-w-0">
          <h2 className={`font-bold text-base md:text-lg leading-tight truncate ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{selectedChat.name}</h2>
          {selectedChat.isTyping ? (
            <p className="text-xs text-[#2ECC71] font-medium">typing...</p>
          ) : selectedChat.isGroup ? (
            <p className="text-xs text-gray-500">Tap for group info</p>
          ) : (
            <p className="text-xs text-gray-500">Tap for contact info</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 relative">
        <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <Video size={22} />
        </button>
        <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <Phone size={22} />
        </button>
        <button 
          className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          onClick={() => setShowChatOptions(!showChatOptions)}
        >
          <MoreHorizontal size={22} />
        </button>

        {/* Chat Options Dropdown */}
        {showChatOptions && (
          <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl border z-50 overflow-hidden ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
            <button 
              onClick={() => {
                onArchiveChat(selectedChat.id);
                setShowChatOptions(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-gray-300 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Archive size={16} />
              {selectedChat.archived ? 'Unarchive' : 'Archive Chat'}
            </button>
            <button 
              onClick={() => {
                onDeleteChat(selectedChat.id);
                setShowChatOptions(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-red-400 hover:bg-[#222]' : 'text-red-600 hover:bg-red-50'}`}
            >
              <Trash2 size={16} />
              Delete Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
