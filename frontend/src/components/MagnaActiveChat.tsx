'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Search, 
  MoreVertical, 
  Archive, 
  Share2, 
  Flag, 
  Trash2 
} from 'lucide-react';
import MagnaNewIcon from '@/components/MagnaNewIcon';
import MagnaMessageBubble, { MessageBubbleProps } from './MagnaMessageBubble';
import MagnaChatInput from './MagnaChatInput';

interface MagnaActiveChatProps {
  selectedChat: string;
  setSelectedChat: (chat: string | null) => void;
  isDarkMode: boolean;
  showChatOptions: boolean;
  setShowChatOptions: (show: boolean) => void;
  handleArchiveChat: () => void;
  handleDeleteClick: () => void;
  messages: MessageBubbleProps[];
  handleEditMessage: (id: string, newText: string) => void;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSendMessage: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export default function MagnaActiveChat({
  selectedChat,
  setSelectedChat,
  isDarkMode,
  showChatOptions,
  setShowChatOptions,
  handleArchiveChat,
  handleDeleteClick,
  messages,
  handleEditMessage,
  isTyping,
  messagesEndRef,
  searchQuery,
  setSearchQuery,
  handleSendMessage,
  inputRef
}: MagnaActiveChatProps) {
  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Chat Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 pt-4 ${isDarkMode ? 'bg-black border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
         <div className="flex items-center gap-3">
           <button 
             onClick={() => setSelectedChat(null)}
             className={`p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-500 hover:bg-gray-100'}`}
           >
             <ChevronLeft size={24} />
           </button>
           <div>
             <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{selectedChat}</h2>
           </div>
         </div>
         <div className="flex items-center gap-2 relative">
           <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-400 hover:bg-gray-100'}`}>
             <Search size={20} />
           </button>
           <button 
             onClick={() => setShowChatOptions(!showChatOptions)}
             className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-[#222]' : 'text-gray-400 hover:bg-gray-100'}`}
           >
             <MoreVertical size={20} />
           </button>

           <AnimatePresence>
             {showChatOptions && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.9, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 10 }}
                 className={`absolute top-12 right-0 rounded-xl shadow-lg border py-2 min-w-[160px] z-50 ${isDarkMode ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-100'}`}
               >
                 <button 
                   onClick={handleArchiveChat}
                   className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
                 >
                   <Archive size={16} />
                   <span>Archive</span>
                 </button>
                 <button className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}>
                   <Share2 size={16} />
                   <span>Share</span>
                 </button>
                 <button className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}>
                   <Flag size={16} />
                   <span>Report</span>
                 </button>
                 <div className={`h-px my-1 ${isDarkMode ? 'bg-[#333]' : 'bg-gray-100'}`} />
                 <button 
                  onClick={handleDeleteClick}
                  className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm text-red-600 ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-red-50'}`}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
               </motion.div>
             )}
           </AnimatePresence>
         </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-6 pb-40 overflow-y-auto">
         <div className="flex justify-center my-4">
           <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">Today</span>
         </div>
         
         <AnimatePresence>
           {messages.map((msg, index) => (
             <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MagnaMessageBubble {...msg} onEdit={handleEditMessage} isDarkMode={isDarkMode} />
            </motion.div>
           ))}
         </AnimatePresence>

         {isTyping && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-3 max-w-[80%]"
            >
                 <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-red-100 text-red-800">
                    AI
                 </div>
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-2 h-2 bg-gray-400 rounded-full" 
                    />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full" 
                    />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full" 
                    />
                 </div>
            </motion.div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Fixed Bottom Input Area for Desktop */}
      <div className="hidden md:block absolute bottom-6 left-0 right-0 px-8 z-20">
        <div className="max-w-4xl mx-auto w-full">
          <MagnaChatInput 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSendMessage={handleSendMessage}
            isDarkMode={isDarkMode}
            inputRef={inputRef}
            className="shadow-lg border"
          />
          <div className="text-center mt-2">
             <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Magna AI can make mistakes. Check important info.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
