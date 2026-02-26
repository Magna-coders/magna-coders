'use client';

import React from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen, Archive } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  category: 'Today' | 'Yesterday' | 'Previous 7 Days';
  isArchived: boolean;
}

interface MagnaChatSidebarProps {
  conversations: ChatSession[];
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  selectedChat: string | null;
  handleNewChat: () => void;
  handleChatSelect: (chatName: string) => void;
  isDarkMode: boolean;
}

export default function MagnaChatSidebar({
  conversations,
  isHistoryOpen,
  setIsHistoryOpen,
  selectedChat,
  handleNewChat,
  handleChatSelect,
  isDarkMode
}: MagnaChatSidebarProps) {
  return (
    <>
      {/* MOBILE BACKDROP */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* HISTORY PANEL (Retractable) */}
      <div className={`border-r flex flex-col transition-all duration-300 overflow-hidden fixed left-0 md:relative z-[100] md:z-auto top-0 md:top-0 bottom-[80px] md:bottom-auto md:h-full ${isHistoryOpen ? 'w-[260px]' : 'w-0 md:w-[72px]'} ${isDarkMode ? 'bg-black border-[#E70008]/20' : 'bg-[#F9F9F9] border-gray-200'}`}>
         <div className={`p-4 flex items-center ${isHistoryOpen ? 'justify-between' : 'flex-col gap-4'}`}>
            <button 
              onClick={handleNewChat}
              className={`flex items-center gap-2 text-sm font-semibold rounded-lg transition-colors ${isHistoryOpen ? 'flex-1 px-3 py-2' : 'p-2 justify-center w-full'} ${isDarkMode ? 'text-gray-300 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-200'}`}
              title="New Chat"
            >
               <Plus size={20} />
               {isHistoryOpen && <span>New Chat</span>}
            </button>
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#222]' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}
              title={isHistoryOpen ? "Collapse" : "Expand"}
            >
               {isHistoryOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
         </div>

         <div className={`flex-1 overflow-y-auto py-2 space-y-6 ${isHistoryOpen ? 'px-2' : 'px-2 scrollbar-hide'}`}>
            {isHistoryOpen ? (
              <>
                {/* Today */}
                {conversations.some(c => c.category === 'Today' && !c.isArchived) && (
                  <div>
                     <h4 className="px-2 text-xs font-bold text-gray-400 uppercase mb-2">Today</h4>
                     <div className="space-y-1">
                        {conversations.filter(c => c.category === 'Today' && !c.isArchived).map(chat => (
                          <button 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.title)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedChat === chat.title ? (isDarkMode ? 'bg-[#222] font-semibold text-white' : 'bg-gray-200 font-semibold text-gray-900') : (isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-200')}`}
                          >
                             {chat.title}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {/* Yesterday */}
                {conversations.some(c => c.category === 'Yesterday' && !c.isArchived) && (
                  <div>
                     <h4 className="px-2 text-xs font-bold text-gray-400 uppercase mb-2">Yesterday</h4>
                     <div className="space-y-1">
                        {conversations.filter(c => c.category === 'Yesterday' && !c.isArchived).map(chat => (
                          <button 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.title)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedChat === chat.title ? (isDarkMode ? 'bg-[#222] font-semibold text-white' : 'bg-gray-200 font-semibold text-gray-900') : (isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-200')}`}
                          >
                             {chat.title}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {/* Previous 7 Days */}
                {conversations.some(c => c.category === 'Previous 7 Days' && !c.isArchived) && (
                  <div>
                     <h4 className="px-2 text-xs font-bold text-gray-400 uppercase mb-2">Previous 7 Days</h4>
                     <div className="space-y-1">
                        {conversations.filter(c => c.category === 'Previous 7 Days' && !c.isArchived).map(chat => (
                          <button 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.title)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedChat === chat.title ? (isDarkMode ? 'bg-[#222] font-semibold text-white' : 'bg-gray-200 font-semibold text-gray-900') : (isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-200')}`}
                          >
                             {chat.title}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {/* Archived Section */}
                {conversations.some(c => c.isArchived) && (
                  <div>
                     <h4 className="px-2 text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                       <Archive size={12} />
                       Archived
                     </h4>
                     <div className="space-y-1 opacity-70">
                        {conversations.filter(c => c.isArchived).map(chat => (
                          <button 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.title)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedChat === chat.title ? (isDarkMode ? 'bg-[#222] font-semibold text-white' : 'bg-gray-200 font-semibold text-gray-900') : (isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-200')}`}
                          >
                             {chat.title}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 pt-2 opacity-50">
                 {/* Icons only for collapsed state - simplified visualization of history */}
                 <div className="w-8 h-1 rounded-full bg-gray-300"></div>
                 <div className="w-8 h-1 rounded-full bg-gray-300"></div>
                 <div className="w-8 h-1 rounded-full bg-gray-300"></div>
              </div>
            )}
         </div>
      </div>
    </>
  );
}
