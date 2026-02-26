import React from 'react';
import { Plus, Users, MessageSquare } from 'lucide-react';

interface FloatingActionMenuProps {
  isDarkMode: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onCreateGroup: () => void;
  onStartChat: () => void;
  isHidden: boolean;
}

export default function FloatingActionMenu({ isDarkMode, isOpen, onToggle, onCreateGroup, onStartChat, isHidden }: FloatingActionMenuProps) {
  if (isHidden) return null;

  return (
    <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 flex flex-col items-end gap-4">
      {/* Modal Options */}
      {isOpen && (
        <div className="flex flex-col gap-3 mb-2 origin-bottom-right">
           <button 
              onClick={onCreateGroup}
              className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border transition-all group whitespace-nowrap ${isDarkMode ? 'bg-[#111] border-[#E70008]/20 hover:bg-[#222]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
           >
              <span className={`text-sm font-bold group-hover:text-[#E50914] ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Create Group</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#E50914] group-hover:text-white transition-all ${isDarkMode ? 'bg-[#F4A261]/20 text-[#F4A261]' : 'bg-[#F4A261]/10 text-[#F4A261]'}`}>
                <Users size={18} />
              </div>
           </button>
           
           <button 
              onClick={onStartChat}
              className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border transition-all group whitespace-nowrap ${isDarkMode ? 'bg-[#111] border-[#E70008]/20 hover:bg-[#222]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
           >
              <span className={`text-sm font-bold group-hover:text-[#E50914] ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Start Chat</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#E50914] group-hover:text-white transition-all ${isDarkMode ? 'bg-[#E50914]/20 text-[#E50914]' : 'bg-[#E50914]/10 text-[#E50914]'}`}>
                <MessageSquare size={18} />
              </div>
           </button>
        </div>
      )}

      {/* FAB Trigger */}
      <button 
        onClick={onToggle}
        className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-gray-800 rotate-45' 
            : 'bg-[#E50914]'
        }`}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
