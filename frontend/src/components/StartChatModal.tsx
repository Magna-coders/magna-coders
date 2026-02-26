'use client';

import React, { useState } from 'react';
import { 
  X, Search, MessageSquare, User, ChevronRight
} from 'lucide-react';

// --- TYPES ---

interface Friend {
  id: string;
  name: string;
  avatarColor: string; // Tailwind class
  initials: string;
  isOnline?: boolean;
  status?: string;
}

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (friendId: string) => void;
  existingFriends?: Friend[]; // In a real app, this would come from a prop or context
  isDarkMode?: boolean;
}

export default function StartChatModal({ 
  isOpen, 
  onClose, 
  onStartChat,
  existingFriends = [],
  isDarkMode = false
}: StartChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handleSelectFriend = (id: string) => {
    onStartChat(id);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // --- RENDERERS ---

  const filteredFriends = existingFriends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className={`md:rounded-3xl shadow-none md:shadow-2xl w-full md:max-w-md h-full md:h-auto md:max-h-[85vh] overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between z-10 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Start New Chat</h2>
          </div>
          <button 
            onClick={handleClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search friends..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E50914] text-sm ${isDarkMode ? 'bg-black border border-[#F4A261]/30 text-[#F4A261] placeholder-[#F4A261]/50' : 'bg-gray-50 border border-gray-100 text-black'}`}
                autoFocus
              />
            </div>
          </div>

          {/* Friends List */}
          <div className={`flex-1 overflow-y-auto p-2 ${isDarkMode ? 'bg-[#111]' : ''}`}>
            <div className="px-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Suggested</div>
            {filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <User size={48} className="mb-2 opacity-20" />
                <p>No friends found</p>
              </div>
            ) : (
              filteredFriends.map(friend => (
                <div 
                  key={friend.id}
                  onClick={() => handleSelectFriend(friend.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full ${friend.avatarColor} flex items-center justify-center font-bold text-sm`}>
                        {friend.initials}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-white group-hover:text-[#F4A261]' : 'text-gray-800 group-hover:text-[#E50914]'}`}>
                        {friend.name}
                      </span>
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {friend.status || (friend.isOnline ? 'Online' : 'Offline')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-[#222] text-gray-400 group-hover:bg-[#F4A261] group-hover:text-black' : 'bg-gray-50 text-gray-400 group-hover:bg-[#E50914] group-hover:text-white'}`}>
                    <MessageSquare size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
