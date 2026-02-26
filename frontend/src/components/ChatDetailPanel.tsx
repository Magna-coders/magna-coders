import React from 'react';
import { Phone, Video } from 'lucide-react';
import type { Conversation } from '@/types';

interface ChatDetailPanelProps {
  selectedChat: Conversation;
  isDarkMode: boolean;
  description?: string;
}

export default function ChatDetailPanel({ selectedChat, isDarkMode, description }: ChatDetailPanelProps) {
  return (
    <div className={`w-[300px] border-l hidden xl:flex flex-col h-full overflow-y-auto ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <div className={`p-6 border-b ${isDarkMode ? 'border-[#E70008]/20' : 'border-gray-100'}`}>
        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
          {selectedChat.isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
      </div>
      
      <div className="p-6 flex flex-col items-center text-center">
        <div className={`w-24 h-24 rounded-2xl ${selectedChat.avatarColor} flex items-center justify-center text-2xl font-bold mb-4 shadow-lg`}>
          {selectedChat.name.substring(0, 2).toUpperCase()}
        </div>
        <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{selectedChat.name}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {selectedChat.isGroup ? 'Group • 12 Members' : 'Online'}
        </p>
        
        <div className="flex gap-4 w-full">
          <button className={`flex-1 py-2 rounded-lg font-medium text-xs transition-colors flex flex-col items-center gap-1 ${isDarkMode ? 'bg-[#222] text-gray-300 hover:bg-[#333]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-[#333]' : 'bg-white'}`}>
               <Phone size={16} />
             </div>
             Audio
          </button>
          <button className={`flex-1 py-2 rounded-lg font-medium text-xs transition-colors flex flex-col items-center gap-1 ${isDarkMode ? 'bg-[#222] text-gray-300 hover:bg-[#333]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-[#333]' : 'bg-white'}`}>
               <Video size={16} />
             </div>
             Video
          </button>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-6">
        <div>
           <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Description</h4>
           <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
             {description || "No description available."}
           </p>
        </div>

        <div>
           <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex justify-between">
             Media <span className="text-[#E50914] cursor-pointer">See All</span>
           </h4>
           <div className="grid grid-cols-3 gap-2">
             <div className={`aspect-square rounded-lg ${isDarkMode ? 'bg-[#222]' : 'bg-gray-200'}`}></div>
             <div className={`aspect-square rounded-lg ${isDarkMode ? 'bg-[#222]' : 'bg-gray-200'}`}></div>
             <div className={`aspect-square rounded-lg ${isDarkMode ? 'bg-[#222]' : 'bg-gray-200'}`}></div>
           </div>
        </div>
      </div>
    </div>
  );
}
